import './index.css';
import indexData from './screens/index.json';
import { supabase } from './supabaseClient.js';
import Chart from 'chart.js/auto';

// Use Vite's import.meta.glob to import all HTML files as raw strings
const htmlModules = import.meta.glob('./screens/*.html', { query: '?raw', import: 'default' });

const app = document.getElementById('root');

// Define screens
const splashScreen = indexData.find(s => s.title.toLowerCase().includes('splash')) || indexData[0];
const loginScreen = indexData.find(s => s.title.toLowerCase().includes('login'));
const signUpScreen = indexData.find(s => s.title.toLowerCase().includes('signup'));
const walletScreen = indexData.find(s => s.title.toLowerCase().includes('walletoverview'));

// Public routes that don't require authentication
const publicRoutes = [
    splashScreen?.filename,
    loginScreen?.filename,
    signUpScreen?.filename,
    indexData.find(s => s.title.toLowerCase().includes('forgot'))?.filename,
    indexData.find(s => s.title.toLowerCase().includes('verifyotp'))?.filename
].filter(Boolean);

let currentSession = null;
let currentTransactions = [];
let currentGoals = [];
let pendingMPIN = ''; // state for MPIN screens

async function init() {
    // Dark Mode initialization
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
    }

    // Check for existing session
    const { data: { session }, error } = await supabase.auth.getSession();
    currentSession = session;
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
        currentSession = session;
    });

    // Initial load
    const initialHash = window.location.hash.slice(1);
    handleRoute(initialHash || splashScreen.filename);
}

async function fetchUserData() {
    if (!currentSession) return;
    
    const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
        
    if (!txError) currentTransactions = txData || [];

    const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });
        
    if (!goalsError) currentGoals = goalsData || [];

    // Trigger auto-sweep logic after fetching fresh data
    await checkAndTriggerAutoSweep();
}

async function checkAndTriggerAutoSweep() {
    if (!currentSession || currentTransactions.length === 0 || currentGoals.length === 0) return;

    // 1. Calculate current balance
    let balance = 0;
    currentTransactions.forEach(tx => {
        if (tx.type === 'deposit') balance += Number(tx.amount);
        else if (tx.type === 'expense') balance -= Number(tx.amount);
        else if (tx.type === 'investment') balance -= Number(tx.amount);
    });

    const SWEEP_THRESHOLD = 500;

    // 2. Trigger condition
    if (balance >= SWEEP_THRESHOLD) {
        // Find a goal to fund (e.g. first active one)
        const targetGoal = currentGoals.find(g => g.saved_amount < g.target_amount);
        if (!targetGoal) return; // No incomplete goals

        console.log(`Auto-Sweep triggered! Moving ₹${SWEEP_THRESHOLD} to goal: ${targetGoal.title}`);

        // 3. Execute DB operations concurrently
        const [txRes, goalRes] = await Promise.all([
            supabase.from('transactions').insert([{
                user_id: currentSession.user.id,
                merchant_name: `Auto-Sweep to ${targetGoal.title}`,
                category: 'Investment',
                amount: SWEEP_THRESHOLD,
                type: 'investment'
            }]),
            supabase.from('goals')
                .update({ saved_amount: targetGoal.saved_amount + SWEEP_THRESHOLD })
                .eq('id', targetGoal.id)
        ]);

        if (!txRes.error && !goalRes.error) {
            // Show toast notification
            showToast(`🎉 Awesome! Your spare change hit ₹${SWEEP_THRESHOLD}, so we automatically invested it into your ${targetGoal.title} goal!`);
            
            // Re-fetch data to reflect changes
            const { data: newTx } = await supabase.from('transactions').select('*').order('date', { ascending: false });
            if (newTx) currentTransactions = newTx;
            
            const { data: newGoals } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
            if (newGoals) currentGoals = newGoals;

            // Re-render if on a relevant screen
            const hash = window.location.hash.slice(1);
            if (hash.includes('WalletOverview')) renderWallet();
            if (hash.includes('GoalsDashboard')) renderGoals();
        }
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-emerald-800 text-white px-6 py-4 rounded-2xl shadow-2xl z-[9999] font-body-md text-sm flex items-start gap-3 transition-all transform translate-y-[-100%] opacity-0';
    toast.innerHTML = `
        <span class="material-symbols-outlined text-emerald-300">auto_awesome</span>
        <p class="flex-1">${message}</p>
        <button class="text-emerald-300 hover:text-white" onclick="this.parentElement.remove()">
            <span class="material-symbols-outlined text-sm">close</span>
        </button>
    `;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-y-[-100%]', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    }, 100);

    // Animate out after 5s
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-[-100%]', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

async function handleRoute(filename) {
    // Route Guard
    if (!currentSession && !publicRoutes.includes(filename)) {
        console.warn('Unauthorized access. Redirecting to Login.');
        window.location.hash = loginScreen.filename;
        return;
    }

    // Auto-redirect to Wallet if logged in and trying to view Splash/Login/Signup
    if (currentSession && publicRoutes.includes(filename) && filename !== indexData.find(s => s.title.toLowerCase().includes('forgot'))?.filename) {
        window.location.hash = walletScreen.filename;
        return;
    }

    // MPIN Verification Interceptor
    if (currentSession && filename !== indexData.find(s => s.title.toLowerCase().includes('verifympin'))?.filename && filename !== indexData.find(s => s.title.toLowerCase().includes('setmpin'))?.filename) {
        const storedMPIN = localStorage.getItem('mpin_' + currentSession.user.id);
        const isVerified = sessionStorage.getItem('mpin_verified_' + currentSession.user.id);
        if (storedMPIN && !isVerified) {
            console.log('MPIN required, redirecting to VerifyMPIN');
            window.location.hash = indexData.find(s => s.title.toLowerCase().includes('verifympin'))?.filename;
            return;
        }
    }

    if (currentSession) {
        await fetchUserData();
    }

    await loadScreen(filename);
}

async function loadScreen(filename) {
    const loader = htmlModules[`./screens/${filename}`];
    if (loader) {
        const html = await loader();
        app.innerHTML = html;
        attachAuthListeners(filename);
    } else {
        console.error('Screen not found:', filename);
        app.innerHTML = '<div class="p-4 text-red-500">Screen not found</div>';
    }
}

// Global navigation function
window.navigate = function(filename) {
    window.location.hash = filename;
};

// Listen to hash changes
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    handleRoute(hash || splashScreen.filename);
});

// Attach Supabase Auth Event Listeners to specific screens
function attachAuthListeners(filename) {
    // 1. Login Screen
    if (filename === loginScreen?.filename) {
        const loginForm = document.getElementById('login-form');
        const submitBtn = document.getElementById('login-submit-btn');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = 'Logging in...';
                submitBtn.disabled = true;

                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                
                if (error) {
                    alert('Login Failed: ' + error.message);
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                } else {
                    // Success! Hash change listener will handle the redirect
                    window.location.hash = walletScreen.filename;
                }
            });
        }
    }

    // 2. Sign Up Screen
    if (filename === signUpScreen?.filename) {
        const signupForm = document.getElementById('signup-form');
        const submitBtn = document.getElementById('signup-submit-btn');
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('signup-email').value;
                const password = document.getElementById('signup-password').value;
                
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = 'Creating account...';
                submitBtn.disabled = true;

                const { data, error } = await supabase.auth.signUp({ email, password });
                
                if (error) {
                    alert('Sign Up Failed: ' + error.message);
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                } else {
                    alert('Account created! Please check your email for verification, or login if auto-confirmed.');
                    window.location.hash = loginScreen.filename;
                }
            });
        }
    }

    // 3. Profile Settings (Sign Out & Dark Mode)
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const { error } = await supabase.auth.signOut();
            if (error) {
                alert('Error signing out: ' + error.message);
            } else {
                currentTransactions = [];
                currentGoals = [];
                if (currentSession) sessionStorage.removeItem('mpin_verified_' + currentSession.user.id);
                window.location.hash = loginScreen.filename;
            }
        });
    }

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.checked = document.documentElement.classList.contains('dark');
        darkModeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // 4. Render Dynamic Data depending on screen
    if (filename === walletScreen?.filename) {
        renderWallet();
    } else if (filename.includes('GoalsDashboard')) {
        renderGoals();
    } else if (filename.includes('CreateGoal')) {
        attachCreateGoalListener();
    } else if (filename.includes('PaymentUPI')) {
        attachUPIListener();
    } else if (filename.includes('TransactionHistory')) {
        renderTransactionHistory();
    } else if (filename.includes('VerifyMPIN') || filename.includes('SetMPIN')) {
        setupMPINListeners(filename);
    }
}

function renderWallet() {
    const balanceEl = document.getElementById('wallet-balance');
    const txListEl = document.getElementById('recent-transactions-list');
    
    if (!balanceEl || !txListEl) return;

    // Calculate balance
    let balance = 0;
    currentTransactions.forEach(tx => {
        if (tx.type === 'deposit') balance += Number(tx.amount);
        else if (tx.type === 'expense') balance -= Number(tx.amount);
        else if (tx.type === 'investment') balance -= Number(tx.amount); // From wallet to investment
    });

    balanceEl.innerText = `₹${balance.toFixed(2)}`;

    // Render Chart
    const ctx = document.getElementById('walletChart');
    if (ctx) {
        // Destroy existing chart if it exists
        if (window.myChart) {
            window.myChart.destroy();
        }

        const dates = [];
        const balances = [];
        let runBal = 0;
        
        // Ensure transactions are sorted chronologically ascending for the chart
        const sortedTx = [...currentTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Only use the last 7 transactions for a cleaner chart
        const recentTx = sortedTx.slice(-7);
        
        recentTx.forEach(tx => {
            dates.push(new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
            if (tx.type === 'deposit') runBal += Number(tx.amount);
            else if (tx.type === 'expense') runBal -= Number(tx.amount);
            balances.push(runBal);
        });

        if (recentTx.length === 0) {
            dates.push('Today');
            balances.push(0);
        }

        window.myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Portfolio Balance',
                    data: balances,
                    borderColor: '#00342b', // primary color
                    backgroundColor: 'rgba(0, 52, 43, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }

    // Render Recent Transactions (Top 3)
    txListEl.innerHTML = '';
    if (currentTransactions.length === 0) {
        txListEl.innerHTML = `<div class="p-md text-center text-outline text-sm">No recent transactions.</div>`;
    } else {
        const top3 = currentTransactions.slice(0, 3);
        top3.forEach(tx => {
            const isDeposit = tx.type === 'deposit';
            const icon = isDeposit ? 'arrow_downward' : 'shopping_bag';
            const colorClass = isDeposit ? 'text-secondary' : 'text-primary';
            const sign = isDeposit ? '+' : '-';
            
            txListEl.innerHTML += `
                <div class="p-md flex justify-between items-center hover:bg-surface-container-lowest transition-colors">
                    <div class="flex items-center gap-md">
                        <div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                            <span class="material-symbols-outlined">${icon}</span>
                        </div>
                        <div>
                            <p class="font-body-md font-bold text-primary">${tx.merchant_name || 'Transaction'}</p>
                            <p class="font-data-mono text-data-mono text-outline">${new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-body-md font-bold ${colorClass}">${sign}₹${Number(tx.amount).toFixed(2)}</p>
                    </div>
                </div>
            `;
        });
    }
}

function renderGoals() {
    const goalsGrid = document.getElementById('goals-grid');
    if (!goalsGrid) return;

    goalsGrid.innerHTML = '';
    if (currentGoals.length === 0) {
        goalsGrid.innerHTML = `<div class="col-span-full p-md text-center text-outline">You haven't planted any goals yet!</div>`;
    } else {
        currentGoals.forEach(goal => {
            const progress = goal.target_amount > 0 ? (goal.saved_amount / goal.target_amount) * 100 : 0;
            const progressClamped = Math.min(100, Math.max(0, progress));
            
            goalsGrid.innerHTML += `
                <div class="glass-card rounded-2xl p-md flex flex-col justify-between group transition-all hover:shadow-lg">
                    <div class="flex justify-between items-start mb-md">
                        <div class="p-3 bg-secondary-container rounded-xl text-on-secondary-container">
                            <span class="material-symbols-outlined text-2xl">${goal.icon || 'potted_plant'}</span>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="font-label-caps text-on-secondary-container">${progressClamped.toFixed(0)}% GROWN</span>
                            <span class="font-data-mono text-on-surface-variant">₹${goal.saved_amount} / ₹${goal.target_amount}</span>
                        </div>
                    </div>
                    <div class="mb-lg">
                        <h3 class="font-title-sm text-title-sm text-primary mb-sm">${goal.title}</h3>
                        <div class="relative flex justify-center py-6">
                            <span class="material-symbols-outlined text-6xl text-on-secondary-container">potted_plant</span>
                        </div>
                    </div>
                    <div>
                        <div class="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-xs">
                            <div class="h-full bg-secondary progress-glow rounded-full" style="width: ${progressClamped}%"></div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
}

function attachCreateGoalListener() {
    const form = document.getElementById('create-goal-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('goal-name').value;
        const target = document.getElementById('target-amount').value;
        const btn = document.getElementById('create-goal-btn');
        
        btn.innerHTML = 'PLANTING...';
        btn.disabled = true;

        const { error } = await supabase.from('goals').insert([{
            user_id: currentSession.user.id,
            title: title,
            target_amount: parseFloat(target),
            saved_amount: 0,
            icon: 'potted_plant'
        }]);

        if (error) {
            alert('Failed to create goal: ' + error.message);
            btn.innerHTML = 'CONTINUE';
            btn.disabled = false;
        } else {
            // Success, re-fetch and redirect
            await fetchUserData();
            navigate(indexData.find(s => s.title.toLowerCase().includes('goalsdashboard')).filename);
        }
    });
}

function attachUPIListener() {
    const btn = document.getElementById('simulate-payment-btn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const amt = document.getElementById('amount').value || '500';
        
        // Simulating manual merchant entry (AI categorize test)
        const merchants = ['Starbucks', 'Uber Technologies', 'Amazon', 'UPI Top Up', 'Vanguard S&P 500'];
        const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];
        const category = aiCategorizeTransaction(randomMerchant);
        
        btn.innerHTML = 'PROCESSING...';
        btn.disabled = true;

        const { error } = await supabase.from('transactions').insert([{
            user_id: currentSession.user.id,
            merchant_name: randomMerchant,
            category: category,
            amount: parseFloat(amt),
            type: category === 'Investment' ? 'investment' : 'expense'
        }]);

        if (error) {
            alert('Payment simulation failed: ' + error.message);
            btn.innerHTML = "I'VE MADE THE PAYMENT";
            btn.disabled = false;
        } else {
            await fetchUserData();
            
            // Show success briefly
            const modal = document.getElementById('qr-modal');
            if (modal) {
                modal.innerHTML = `
                    <div class="bg-white w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center">
                        <div class="w-20 h-20 bg-secondary text-white rounded-full flex items-center justify-center mb-4">
                            <span class="material-symbols-outlined" style="font-size: 40px;">check</span>
                        </div>
                        <h2 class="font-title-sm text-2xl text-primary mb-2">Payment Successful!</h2>
                        <p class="font-body-md text-on-surface-variant mb-6">Your funds have been securely added.</p>
                        <button class="w-full py-4 bg-surface-container text-primary rounded-xl font-label-caps" onclick="navigate('WalletOverview_5609f92e5e924a72a75b627360229f5f.html')">Back to Wallet</button>
                    </div>
                `;
            }
        }
    });
}

// Mock AI Decision Tree for Transaction Categorization
function aiCategorizeTransaction(merchantName) {
    const name = merchantName.toLowerCase();
    if (name.includes('starbucks') || name.includes('coffee') || name.includes('restaurant') || name.includes('food')) {
        return 'Food & Drink';
    } else if (name.includes('uber') || name.includes('lyft') || name.includes('transit') || name.includes('rail')) {
        return 'Transport';
    } else if (name.includes('amazon') || name.includes('nike') || name.includes('store') || name.includes('mart')) {
        return 'Shopping';
    } else if (name.includes('vanguard') || name.includes('fidelity') || name.includes('investment') || name.includes('sip')) {
        return 'Investment';
    } else if (name.includes('upi') || name.includes('transfer') || name.includes('deposit')) {
        return 'Deposit';
    }
    return 'Miscellaneous';
}

function renderTransactionHistory() {
    const list = document.getElementById('full-transaction-list');
    if (!list) return;
    list.innerHTML = '';

    if (currentTransactions.length === 0) {
        list.innerHTML = '<div class="p-md text-center text-slate-500">No transactions found.</div>';
        return;
    }

    const sortedTx = [...currentTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedTx.forEach(tx => {
        const isDeposit = tx.type === 'deposit';
        const isInvestment = tx.type === 'investment';
        let icon = 'shopping_bag';
        let iconBg = 'bg-slate-100 text-slate-500';
        
        if (isDeposit) {
            icon = 'arrow_downward';
            iconBg = 'bg-secondary-container text-on-secondary-container';
        } else if (isInvestment) {
            icon = 'trending_up';
            iconBg = 'bg-emerald-700 text-white shadow-sm shadow-emerald-200';
        }

        const sign = isDeposit ? '+' : '-';
        const colorClass = isDeposit || isInvestment ? 'text-emerald-700' : 'text-primary';
        
        // AI Badge formatting
        const badge = tx.category !== 'Deposit' && tx.category !== 'Investment' 
            ? `<span class="text-[10px] font-label-caps text-slate-400 bg-slate-100 px-1 py-0.5 rounded ml-2">AI CATEGORIZED: ${tx.category.toUpperCase()}</span>`
            : '';

        list.innerHTML += `
            <div class="p-md flex items-center justify-between hover:bg-slate-50/50 transition-colors group ${isInvestment ? 'bg-emerald-50/20' : ''}">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 ${iconBg}">
                        <span class="material-symbols-outlined">${icon}</span>
                    </div>
                    <div>
                        <p class="font-bold text-primary group-hover:text-emerald-700 transition-colors">${tx.merchant_name} ${badge}</p>
                        <p class="text-sm text-slate-500">${tx.category} • ${new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-data-mono font-bold ${colorClass}">${sign}₹${Number(tx.amount).toFixed(2)}</p>
                </div>
            </div>
        `;
    });
}

function setupMPINListeners(filename) {
    pendingMPIN = '';
    const dotsContainer = document.getElementById('mpin-dots');
    const numpad = document.getElementById('mpin-numpad');
    const confirmBtn = document.getElementById('confirm-mpin-btn');

    const isVerify = filename.includes('VerifyMPIN');

    function updateDots() {
        if (!dotsContainer) return;
        const dots = dotsContainer.children;
        for (let i = 0; i < 4; i++) {
            if (i < pendingMPIN.length) {
                dots[i].classList.replace('bg-primary/20', 'bg-primary'); // for SetMPIN
                dots[i].classList.replace('bg-white/20', 'bg-secondary'); // for VerifyMPIN
            } else {
                dots[i].classList.replace('bg-primary', 'bg-primary/20');
                dots[i].classList.replace('bg-secondary', 'bg-white/20');
            }
        }
    }

    if (numpad) {
        const buttons = numpad.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.innerText.trim();
                if (text === 'backspace' || btn.querySelector('span.material-symbols-outlined')?.innerText === 'backspace') {
                    pendingMPIN = pendingMPIN.slice(0, -1);
                } else if (!isNaN(parseInt(text)) && pendingMPIN.length < 4) {
                    pendingMPIN += text;
                } else if (text === 'fingerprint' || btn.querySelector('span.material-symbols-outlined')?.innerText === 'fingerprint') {
                    alert('Biometric auth triggered (mock)');
                }
                
                updateDots();

                // Auto-verify if VerifyMPIN
                if (isVerify && pendingMPIN.length === 4) {
                    const storedMPIN = localStorage.getItem('mpin_' + currentSession.user.id);
                    if (pendingMPIN === storedMPIN) {
                        sessionStorage.setItem('mpin_verified_' + currentSession.user.id, 'true');
                        navigate(walletScreen.filename);
                    } else {
                        alert('Incorrect MPIN. Try again.');
                        pendingMPIN = '';
                        updateDots();
                    }
                }
            });
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (pendingMPIN.length !== 4) {
                alert('Please enter a 4 digit MPIN.');
                return;
            }
            localStorage.setItem('mpin_' + currentSession.user.id, pendingMPIN);
            alert('MPIN Set successfully!');
            navigate(indexData.find(s => s.title.toLowerCase().includes('profile')).filename);
        });
    }
}

console.log('Available Screens:', indexData);

// Start the app
init();
