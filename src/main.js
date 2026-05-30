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
    'Onboarding_Walkthrough.html',
    loginScreen?.filename,
    signUpScreen?.filename,
    indexData.find(s => s.title.toLowerCase().includes('forgot'))?.filename,
    indexData.find(s => s.title.toLowerCase().includes('verifyotp'))?.filename
].filter(Boolean);

let currentSession = null;
let currentTransactions = [];
let currentGoals = [];
let pendingMPIN = ''; // state for MPIN screens

let goalsSubscription = null;
let transactionsSubscription = null;

async function init() {
    // Dark Mode initialization
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
    }

    // Check for existing session
    const { data: { session }, error } = await supabase.auth.getSession();
    currentSession = session;
    
    // Inject the interactive GrowBot assistant into the global DOM
    injectGrowBot();

    if (currentSession) {
        setupRealtimeSubscriptions();
    }
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
        currentSession = session;
        if (session) {
            setupRealtimeSubscriptions();
        } else {
            unsubscribeRealtime();
        }
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
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 w-[92%] max-w-[360px] bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.25)] z-[9999] font-body-md text-[15px] leading-snug flex items-center gap-4 transition-all transform translate-y-[150%] opacity-0 border border-slate-700/50';
    toast.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-emerald-400" style="font-size: 20px;">check_circle</span>
        </div>
        <p class="flex-1 text-slate-50">${message}</p>
        <button class="text-slate-400 hover:text-white transition-colors shrink-0 p-1" onclick="this.parentElement.remove()">
            <span class="material-symbols-outlined text-lg">close</span>
        </button>
    `;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-y-[150%]', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    }, 50);

    // Animate out after 4s
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-[150%]', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
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
    } else if (filename.includes('Onboarding')) {
        setupOnboarding();
    } else if (filename.includes('GoalsDashboard')) {
        renderGoals();
    } else if (filename.includes('CreateGoal')) {
        attachCreateGoalListener();
    } else if (filename.includes('PaymentUPI')) {
        attachUPIListener();
    } else if (filename.includes('TransactionHistory')) {
        renderTransactionHistory();
    } else if (filename.includes('FundDiscovery')) {
        setupFundDiscovery();
    } else if (filename.includes('VerifyMPIN') || filename.includes('SetMPIN')) {
        setupMPINListeners(filename);
    } else if (filename.includes('ProfileSettings')) {
        if(window.renderProfile) window.renderProfile();
    } else if (filename.includes('WealthSimulator')) {
        setupWealthSimulator();
    }
}

function renderWallet() {
    const balanceEl = document.getElementById('wallet-balance');
    const txListEl = document.getElementById('recent-transactions-list');
    
    if (!balanceEl || !txListEl) return;

    // Calculate Available Wallet Balance (Expenses and investments deduct, deposits add)
    let balance = 0;
    currentTransactions.forEach(tx => {
        if (tx.type === 'deposit') balance += Number(tx.amount);
        else if (tx.type === 'expense' || tx.type === 'investment') balance -= Number(tx.amount);
    });

    balanceEl.innerText = `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // 1. Render circular progress gauge for Auto-Sweep Status
    const gaugeCtx = document.getElementById('sweepGaugeChart');
    if (gaugeCtx) {
        if (window.myGaugeChart) window.myGaugeChart.destroy();
        
        const currentChange = balance >= 0 ? (balance % 500) : 0;
        const targetSweep = 500;
        const sweepProgress = Math.min(100, Math.round((currentChange / targetSweep) * 100));
        
        const isDark = document.documentElement.classList.contains('dark');
        const isPaused = localStorage.getItem('rules_paused') === 'true';
        
        window.myGaugeChart = new Chart(gaugeCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [currentChange, Math.max(0, targetSweep - currentChange)],
                    backgroundColor: [isPaused ? '#f59e0b' : '#10b981', isDark ? '#334155' : '#e2e8f0'],
                    borderWidth: 0,
                    circumference: 270,
                    rotation: 225
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
        
        // Update textual readouts
        const pctEl = document.getElementById('gauge-percentage');
        const statusEl = document.getElementById('gauge-status');
        const feedbackEl = document.getElementById('gauge-feedback');
        
        if (pctEl) pctEl.innerText = `${sweepProgress}%`;
        if (statusEl) {
            statusEl.innerText = isPaused ? 'PAUSED' : 'ACTIVE';
            statusEl.className = isPaused ? 'font-label-caps text-[9px] text-amber-500 font-bold tracking-widest' : 'font-label-caps text-[9px] text-emerald-600 font-bold tracking-widest';
        }
        if (feedbackEl) feedbackEl.innerText = `₹${currentChange.toFixed(2)} / ₹500.00`;
    }

    // 2. Render portfolio transaction history area chart in bento box
    const historyCtx = document.getElementById('walletHistoryChart');
    if (historyCtx) {
        if (window.myHistoryChart) window.myHistoryChart.destroy();
        
        const dates = [];
        const balances = [];
        let runBal = 0;
        
        const sortedTx = [...currentTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        const recentTx = sortedTx.slice(-7);
        
        recentTx.forEach(tx => {
            dates.push(new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
            if (tx.type === 'deposit') runBal += Number(tx.amount);
            else if (tx.type === 'expense' || tx.type === 'investment') runBal -= Number(tx.amount);
            balances.push(runBal);
        });

        if (recentTx.length === 0) {
            dates.push('Today');
            balances.push(0);
        }

        window.myHistoryChart = new Chart(historyCtx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Trend',
                    data: balances,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    borderWidth: 2,
                    tension: 0.45,
                    fill: true,
                    pointRadius: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }

    // Refresh Pause Rules button states
    if (window.updatePauseButtonVisuals) window.updatePauseButtonVisuals();

    // Render Recent Transactions with Spent, Round-Up, & Spare Change breakdown
    txListEl.innerHTML = '';
    if (currentTransactions.length === 0) {
        txListEl.innerHTML = `<div class="p-md text-center text-outline text-sm">No recent transactions.</div>`;
    } else {
        const top3 = currentTransactions.slice(0, 3);
        top3.forEach(tx => {
            const isDeposit = tx.type === 'deposit';
            const isInvestment = tx.type === 'investment';
            
            let icon = 'shopping_bag';
            let colorClass = 'text-primary';
            let sign = '-';
            
            if (isDeposit) {
                icon = 'arrow_downward';
                colorClass = 'text-secondary';
                sign = '+';
            } else if (isInvestment) {
                icon = 'trending_up';
                colorClass = 'text-[#C5A059]';
                sign = '+';
            }
            
            let amountDetailsHTML = '';
            const amt = Number(tx.amount);
            
            if (tx.type === 'expense') {
                const spent = amt;
                const next10 = Math.ceil(spent / 10) * 10;
                const spare = next10 - spent === 0 ? 10 : next10 - spent;
                
                amountDetailsHTML = `
                    <div class="text-right select-none">
                        <p class="font-body-md font-bold text-slate-800 dark:text-slate-100">${sign}₹${spent.toFixed(2)}</p>
                        <p class="text-[9px] text-outline font-bold leading-tight mt-0.5">Paid: ₹${spent.toFixed(2)} • Round: ₹${(spent + spare).toFixed(2)} • Spare: <span class="text-secondary font-extrabold">+₹${spare.toFixed(2)}</span></p>
                    </div>
                `;
            } else if (tx.type === 'investment') {
                const spare = amt;
                const spent = spare * 9;
                const round = spare * 10;
                
                amountDetailsHTML = `
                    <div class="text-right select-none">
                        <p class="font-body-md font-bold text-emerald-600 dark:text-[#C5A059]">${sign}₹${spare.toFixed(2)}</p>
                        <p class="text-[9px] text-outline font-bold leading-tight mt-0.5">Paid: ₹${spent.toFixed(2)} • Round: ₹${round.toFixed(2)} • Spare: <span class="text-secondary font-extrabold">+₹${spare.toFixed(2)}</span></p>
                    </div>
                `;
            } else { // deposit
                const spent = amt;
                
                amountDetailsHTML = `
                    <div class="text-right select-none">
                        <p class="font-body-md font-bold text-secondary">${sign}₹${spent.toFixed(2)}</p>
                        <p class="text-[9px] text-outline font-bold leading-tight mt-0.5">Paid: ₹${spent.toFixed(2)} • Round: ₹${spent.toFixed(2)} • Spare: <span class="text-slate-400 font-extrabold">+₹0.00</span></p>
                    </div>
                `;
            }
            
            txListEl.innerHTML += `
                <div class="p-md flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                    <div class="flex items-center gap-md">
                        <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-650 dark:text-slate-200">
                            <span class="material-symbols-outlined">${icon}</span>
                        </div>
                        <div>
                            <p class="font-body-md font-bold text-primary dark:text-emerald-400">${tx.merchant_name || 'Transaction'}</p>
                            <p class="font-data-mono text-data-mono text-outline">${new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div>
                        ${amountDetailsHTML}
                    </div>
                </div>
            `;
        });
    }

    // Dynamic Gold Card Banner Content Updates
    const goldBanner = document.querySelector('[onclick="window.triggerGoldUpgrade()"]');
    if (goldBanner) {
        const isGold = localStorage.getItem('is_gold_member') === 'true';
        if (isGold) {
            goldBanner.innerHTML = `
                <img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" data-alt="A luxurious lifestyle photograph..." src="/logo.png"/>
                <div class="absolute inset-0 bg-gradient-to-r from-[#111827]/95 via-indigo-950/80 to-transparent flex flex-col justify-center px-md text-white">
                    <div class="flex items-center gap-2 text-amber-400 mb-xs select-none">
                        <span class="material-symbols-outlined text-xl">workspace_premium</span>
                        <h2 class="font-title-sm text-title-sm font-bold text-amber-300">SpareGrow Gold Active</h2>
                    </div>
                    <p class="font-body-md text-xs opacity-90 max-w-[320px] text-slate-250">Enjoying 2% higher yields, Turbo Round-ups, and priority wealth growth features!</p>
                    <button class="mt-md px-md py-2 bg-slate-800 border border-amber-500/30 text-amber-400 font-bold rounded-lg w-fit text-sm cursor-default">
                        ACTIVE MEMBERSHIP ✨
                    </button>
                </div>
            `;
        } else {
            goldBanner.innerHTML = `
                <img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" data-alt="A luxurious lifestyle photograph..." src="/logo.png"/>
                <div class="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/70 to-transparent flex flex-col justify-center px-md text-white">
                    <h2 class="font-title-sm text-title-sm mb-xs font-bold text-slate-50">Unlock Premium Growth</h2>
                    <p class="font-body-md text-body-md opacity-90 max-w-[320px] text-slate-200">Earn 2% higher yields on your spare change with SpareGrow Gold.</p>
                    <button class="mt-md px-md py-2 bg-[#C5A059] text-primary font-bold rounded-lg w-fit text-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow">
                        UPGRADE NOW
                    </button>
                </div>
            `;
        }
    }

    // Wire up Withdrawal Button click handler
    const confirmWithdrawBtn = document.getElementById('btn-confirm-withdraw');
    if (confirmWithdrawBtn) {
        confirmWithdrawBtn.onclick = async function() {
            const amountInput = document.getElementById('withdraw-amount');
            if (!amountInput) return;
            
            const amtVal = parseFloat(amountInput.value);
            if (isNaN(amtVal) || amtVal <= 0) {
                alert("Please enter a valid amount to withdraw.");
                return;
            }
            
            // Calculate current balance
            let balance = 0;
            currentTransactions.forEach(tx => {
                if (tx.type === 'deposit') balance += Number(tx.amount);
                else if (tx.type === 'expense' || tx.type === 'investment') balance -= Number(tx.amount);
            });
            
            if (amtVal > balance) {
                alert("Insufficient available balance for this withdrawal.");
                return;
            }
            
            confirmWithdrawBtn.innerText = "PROCESSING WITHDRAWAL...";
            confirmWithdrawBtn.disabled = true;
            
            const { error } = await supabase.from('transactions').insert([{
                user_id: currentSession.user.id,
                merchant_name: 'Withdrawal to Linked Bank',
                category: 'Transfer',
                amount: amtVal,
                type: 'expense'
            }]);
            
            if (error) {
                alert("Withdrawal failed: " + error.message);
                confirmWithdrawBtn.innerText = "INITIATE WITHDRAWAL";
                confirmWithdrawBtn.disabled = false;
            } else {
                showToast(`💸 ₹${amtVal.toLocaleString('en-IN')} successfully withdrawn to your linked bank account!`);
                await fetchUserData();
                window.closeWithdrawModal();
                renderWallet();
            }
        };
    }
}

function renderSVGSprout(progress) {
    const p = Math.min(100, Math.max(0, progress));
    const stemHeight = p * 0.7; // Max height is 70px
    const stemY = 85 - stemHeight;
    const wobble = Math.sin(p / 10) * 5;
    const ctrlX = 50 + wobble * 0.5;
    const ctrlY = 85 - stemHeight * 0.5;
    const endX = 50 + wobble;
    
    let stemPath = `M 50 85 Q ${ctrlX} ${ctrlY} ${endX} ${stemY}`;
    let leaves = "";
    
    if (p > 15) {
        leaves += `<path d="M 49 70 C 35 65, 30 55, 48 65 Z" fill="#10b981" class="transition-all duration-500" stroke="#047857" stroke-width="0.5"/>`;
    }
    if (p > 35) {
        leaves += `<path d="M 51 55 C 65 50, 70 40, 52 50 Z" fill="#10b981" class="transition-all duration-500" stroke="#047857" stroke-width="0.5"/>`;
    }
    if (p > 55) {
        leaves += `<path d="M 49 45 C 35 40, 32 30, 48 40 Z" fill="#34d399" class="transition-all duration-500" stroke="#047857" stroke-width="0.5"/>`;
    }
    if (p > 75) {
        leaves += `<path d="M 51 35 C 65 30, 68 20, 52 30 Z" fill="#34d399" class="transition-all duration-500" stroke="#047857" stroke-width="0.5"/>`;
    }
    
    let flower = "";
    if (p >= 90) {
        flower = `
            <g transform="translate(${endX}, ${stemY}) scale(0.9)" class="origin-center animate-pulse">
                <circle cx="0" cy="-8" r="6" fill="#C5A059" opacity="0.9"/>
                <circle cx="-8" cy="0" r="6" fill="#C5A059" opacity="0.9"/>
                <circle cx="8" cy="0" r="6" fill="#C5A059" opacity="0.9"/>
                <circle cx="0" cy="8" r="6" fill="#C5A059" opacity="0.9"/>
                <circle cx="0" cy="0" r="4.5" fill="#f59e0b"/>
            </g>
        `;
    } else if (p > 70) {
        flower = `<circle cx="${endX}" cy="${stemY}" r="4" fill="#a7f3d0" stroke="#10b981" stroke-width="1"/>`;
    } else {
        flower = `<circle cx="${endX}" cy="${stemY}" r="2" fill="#34d399"/>`;
    }
    
    return `
        <svg viewBox="0 0 100 100" class="w-24 h-24 transition-all duration-500 filter drop-shadow-md">
            <ellipse cx="50" cy="87" rx="22" ry="4" fill="#78350f" opacity="0.8"/>
            <path d="M 32 87 L 36 96 L 64 96 L 68 87 Z" fill="#92400e" stroke="#78350f" stroke-width="0.5"/>
            <path d="${stemPath}" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>
            ${leaves}
            ${flower}
        </svg>
    `;
}

function renderGoals() {
    const goalsGrid = document.getElementById('goals-grid');
    if (!goalsGrid) return;

    const totalSeedingEl = document.getElementById('total-seeding');
    const activeHarvestsEl = document.getElementById('active-harvests');
    
    let totalSeeding = 0;
    
    goalsGrid.innerHTML = '';
    if (currentGoals.length === 0) {
        goalsGrid.innerHTML = `<div class="col-span-full p-md text-center text-outline">You haven't planted any goals yet!</div>`;
        if (totalSeedingEl) totalSeedingEl.innerText = '₹0.00';
        if (activeHarvestsEl) activeHarvestsEl.innerText = '0';
    } else {
        currentGoals.forEach(goal => {
            totalSeeding += Number(goal.saved_amount);
            const progress = goal.target_amount > 0 ? (goal.saved_amount / goal.target_amount) * 100 : 0;
            const progressClamped = Math.min(100, Math.max(0, progress));
            const plantSVG = renderSVGSprout(progressClamped);
            
            goalsGrid.innerHTML += `
                <div class="glass-card rounded-2xl p-md flex flex-col justify-between group transition-all hover:shadow-lg cursor-pointer hover:border-emerald-500/20 hover:translate-y-[-4px]" onclick="window.openGoalModal('${goal.id}')">
                    <div class="flex justify-between items-start mb-md">
                        <div class="p-3 bg-secondary-container/20 rounded-xl text-secondary">
                            <span class="material-symbols-outlined text-2xl">${goal.icon || 'potted_plant'}</span>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="font-label-caps text-on-secondary-container text-[10px] font-bold tracking-widest">${progressClamped.toFixed(0)}% GROWN</span>
                            <span class="font-data-mono text-on-surface-variant text-xs">₹${goal.saved_amount} / ₹${goal.target_amount}</span>
                        </div>
                    </div>
                    <div class="mb-lg text-center">
                        <h3 class="font-title-sm text-title-sm text-primary mb-sm font-bold">${goal.title}</h3>
                        <div class="relative flex justify-center py-4 select-none">
                            ${plantSVG}
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
        
        if (totalSeedingEl) totalSeedingEl.innerText = `₹${totalSeeding.toFixed(2)}`;
        if (activeHarvestsEl) activeHarvestsEl.innerText = currentGoals.length.toString();
    }
}

function attachCreateGoalListener() {
    const form = document.getElementById('create-goal-form');
    if (!form) return;

    let selectedIcon = 'potted_plant';

    const categoryBtns = document.querySelectorAll('.category-btn');
    const nameInput = document.getElementById('goal-name');
    const targetInput = document.getElementById('target-amount');

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Reset styles
            categoryBtns.forEach(b => {
                b.classList.remove('border-primary', 'bg-primary-container', 'active-ring');
                b.classList.add('border-outline-variant');
                b.querySelector('.icon-container').classList.remove('bg-primary-fixed-dim');
                b.querySelector('.icon-container').classList.add('bg-surface-container');
                b.querySelector('.text-span').classList.remove('text-primary-fixed');
                b.querySelector('.text-span').classList.add('text-on-surface-variant');
            });
            
            // Apply active styles
            btn.classList.add('border-primary', 'bg-primary-container', 'active-ring');
            btn.classList.remove('border-outline-variant');
            btn.querySelector('.icon-container').classList.add('bg-primary-fixed-dim');
            btn.querySelector('.icon-container').classList.remove('bg-surface-container');
            btn.querySelector('.text-span').classList.add('text-primary-fixed');
            btn.querySelector('.text-span').classList.remove('text-on-surface-variant');

            // Update inputs
            if (nameInput) nameInput.value = btn.dataset.presetTitle;
            if (targetInput) targetInput.value = btn.dataset.presetAmount;
            selectedIcon = btn.dataset.presetIcon;
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = nameInput.value;
        const target = targetInput.value;
        const btn = document.getElementById('create-goal-btn');
        
        btn.innerHTML = 'PLANTING...';
        btn.disabled = true;

        const { error } = await supabase.from('goals').insert([{
            user_id: currentSession.user.id,
            title: title,
            target_amount: parseFloat(target),
            saved_amount: 0,
            icon: selectedIcon
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

window.setAmount = function(val) {
    const amtInput = document.getElementById('amount');
    if (amtInput) {
        amtInput.value = val;
        window.updateIntent();
    }
};

window.updateIntent = function() {
    const amtInput = document.getElementById('amount');
    const qrAmt = document.getElementById('qr-amount');
    if (!amtInput) return;
    const amt = amtInput.value || '0';
    if (qrAmt) qrAmt.innerText = `₹${amt}`;
    
    const pa = "sparegrow@bank";
    const pn = "SpareGrow Investments";
    const cu = "INR";
    const upiString = `upi://pay?pa=${pa}&pn=${pn}&am=${amt}&cu=${cu}`;
    
    const gpay = document.getElementById('gpay-btn');
    const phonepe = document.getElementById('phonepe-btn');
    const paytm = document.getElementById('paytm-btn');
    
    if (gpay) gpay.href = upiString;
    if (phonepe) phonepe.href = upiString;
    if (paytm) paytm.href = upiString;
};

function attachUPIListener() {
    // Generate initial deep links
    window.updateIntent();
    
    const amtInput = document.getElementById('amount');
    if (amtInput) {
        amtInput.addEventListener('input', window.updateIntent);
    }
    
    // Bind click events to GPay, PhonePe, Paytm for real-time sandbox simulation!
    const deepLinks = ['gpay-btn', 'phonepe-btn', 'paytm-btn'];
    deepLinks.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const amt = document.getElementById('amount').value || '500';
                
                showToast(`🔗 Redirecting to ${id.split('-')[0].toUpperCase()} UPI app...`);
                
                setTimeout(async () => {
                    const { error } = await supabase.from('transactions').insert([{
                        user_id: currentSession.user.id,
                        merchant_name: `UPI Top Up via ${id.split('-')[0].toUpperCase()}`,
                        category: 'Deposit',
                        amount: parseFloat(amt),
                        type: 'deposit'
                    }]);
                    if (!error) {
                        showToast(`🎉 ₹${amt} securely topped up!`);
                        await fetchUserData();
                        navigate('WalletOverview_5609f92e5e924a72a75b627360229f5f.html');
                    }
                }, 1200);
            });
        }
    });

    const btn = document.getElementById('simulate-payment-btn');
    if (btn) {
        btn.addEventListener('click', async () => {
            const amt = document.getElementById('amount').value || '500';
            btn.innerHTML = 'PROCESSING...';
            btn.disabled = true;
            
            const { error } = await supabase.from('transactions').insert([{
                user_id: currentSession.user.id,
                merchant_name: 'UPI QR Top Up',
                category: 'Deposit',
                amount: parseFloat(amt),
                type: 'deposit'
            }]);
            
            if (error) {
                alert('Payment simulation failed: ' + error.message);
                btn.innerHTML = "I'VE MADE THE PAYMENT";
                btn.disabled = false;
            } else {
                await fetchUserData();
                
                // Show dynamic success state inside the QR code modal
                const modal = document.getElementById('qr-modal');
                if (modal) {
                    const card = modal.querySelector('.bg-white');
                    if (card) {
                        card.innerHTML = `
                            <div class="w-20 h-20 bg-secondary text-white rounded-full flex items-center justify-center mb-4 mx-auto animate-bounce shadow">
                                <span class="material-symbols-outlined" style="font-size: 40px;">check</span>
                            </div>
                            <h2 class="font-title-sm text-2xl text-primary mb-2 font-bold font-manrope">Payment Successful!</h2>
                            <p class="font-body-md text-on-surface-variant text-sm mb-6">₹${amt} has been securely topped up to your available balance.</p>
                            <button class="w-full py-4 bg-primary text-white rounded-xl font-label-caps" onclick="document.getElementById('qr-modal').classList.add('hidden'); navigate('WalletOverview_5609f92e5e924a72a75b627360229f5f.html')">Back to Wallet</button>
                        `;
                    }
                }
            }
        });
    }
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

let txSearchQuery = "";
let txSelectedCategory = "all";
let fundSearchQuery = "";
let fundSelectedCategory = "all";

function renderTransactionHistory() {
    const list = document.getElementById('full-transaction-list');
    if (!list) return;
    list.innerHTML = '';

    // Dynamically update the Goal Progress card with active real-time stats
    const goalPercentageEl = document.getElementById('insights-goal-percentage');
    const goalProgressBarEl = document.getElementById('insights-goal-progress-bar');
    const goalDescEl = document.getElementById('insights-goal-desc');
    
    if (goalPercentageEl && goalProgressBarEl && goalDescEl) {
        if (currentGoals.length > 0) {
            const activeGoal = currentGoals.find(g => g.saved_amount < g.target_amount) || currentGoals[0];
            const progress = activeGoal.target_amount > 0 ? (activeGoal.saved_amount / activeGoal.target_amount) * 100 : 0;
            const progressClamped = Math.min(100, Math.max(0, progress));
            
            goalPercentageEl.innerText = `${Math.round(progressClamped)}%`;
            goalProgressBarEl.style.width = `${progressClamped}%`;
            goalDescEl.innerText = progressClamped >= 100 
                ? `🎉 ${activeGoal.title} Fully Grown!` 
                : `On track for "${activeGoal.title}"`;
        } else {
            goalPercentageEl.innerText = '0%';
            goalProgressBarEl.style.width = '0%';
            goalDescEl.innerText = 'Plant your first goal on the dashboard!';
        }
    }

    const searchInput = document.getElementById('tx-search-input');
    if (searchInput) {
        searchInput.value = txSearchQuery;
        searchInput.oninput = function() {
            txSearchQuery = searchInput.value.toLowerCase().trim();
            applyFilters();
        };
    }
    
    const filterAll = document.getElementById('btn-filter-all');
    const filterFood = document.getElementById('btn-filter-food');
    const filterTravel = document.getElementById('btn-filter-travel');
    const filterRetail = document.getElementById('btn-filter-retail');
    
    const categoryBtns = [
        { el: filterAll, cat: 'all', icon: 'filter_list', text: 'All' },
        { el: filterFood, cat: 'food', icon: 'restaurant', text: 'Food' },
        { el: filterTravel, cat: 'travel', icon: 'flight', text: 'Travel' },
        { el: filterRetail, cat: 'retail', icon: 'shopping_bag', text: 'Retail' }
    ];
    
    function updateFilterButtonStyles() {
        categoryBtns.forEach(item => {
            if (!item.el) return;
            if (txSelectedCategory === item.cat) {
                // Active style (matching app branding)
                item.el.className = 'flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-bold whitespace-nowrap shadow-sm cursor-pointer transition-all active:scale-95 hover:bg-teal-950';
            } else {
                // Inactive outline style with premium dark-mode support
                item.el.className = 'flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-650 dark:text-slate-350 border border-slate-200 dark:border-slate-700 rounded-full font-bold whitespace-nowrap hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer active:scale-95';
            }
        });
    }
    
    categoryBtns.forEach(item => {
        if (item.el) {
            item.el.onclick = function(e) {
                e.preventDefault();
                txSelectedCategory = item.cat;
                updateFilterButtonStyles();
                applyFilters();
            };
        }
    });
    
    updateFilterButtonStyles();
    
    function applyFilters() {
        if (!list) return;
        list.innerHTML = '';
        
        if (currentTransactions.length === 0) {
            list.innerHTML = '<div class="p-md text-center text-slate-500">No transactions found.</div>';
            return;
        }

        // Apply filters
        let filtered = currentTransactions;
        
        // Helper to resolve dynamic category for both expense & investment (round-up) transactions
        function resolveDynamicCategory(tx) {
            const cat = (tx.category || '').toLowerCase();
            const merchant = (tx.merchant_name || '').toLowerCase();
            
            // Food Keywords
            const foodKeywords = ['starbucks', 'zomato', 'swiggy', 'milk', 'dairy', 'groceries', 'chai', 'coffee', 'tea', 'cafe', 'dining', 'eat', 'mcdonald', 'burger', 'pizza', 'dinner', 'lunch', 'food', 'drink', 'restaurant', 'essentials'];
            // Travel Keywords
            const travelKeywords = ['uber', 'lyft', 'transit', 'rail', 'cab', 'travel', 'transport', 'flight', 'train', 'bus', 'metro', 'ola', 'auto', 'ride', 'commute', 'ticket', 'booking'];
            // Retail Keywords
            const retailKeywords = ['amazon', 'netflix', 'nike', 'store', 'mart', 'shopping', 'purchase', 'retail', 'brand', 'clothes', 'fashion', 'apparel', 'gadgets', 'device', 'electronics', 'flipkart', 'myntra', 'zara', 'h&m'];
            
            if (foodKeywords.some(kw => merchant.includes(kw) || cat.includes(kw))) {
                return 'Food';
            } else if (travelKeywords.some(kw => merchant.includes(kw) || cat.includes(kw))) {
                return 'Travel';
            } else if (retailKeywords.some(kw => merchant.includes(kw) || cat.includes(kw))) {
                return 'Retail';
            }
            return tx.category || 'Miscellaneous';
        }
        
        // 1. Category Filter
        if (txSelectedCategory !== 'all') {
            filtered = filtered.filter(tx => {
                const resolvedCat = resolveDynamicCategory(tx).toLowerCase();
                return resolvedCat === txSelectedCategory;
            });
        }
        
        // 2. Text Search Input Filter
        if (txSearchQuery) {
            filtered = filtered.filter(tx => {
                const merchant = (tx.merchant_name || '').toLowerCase();
                const category = (tx.category || '').toLowerCase();
                const type = (tx.type || '').toLowerCase();
                const amount = String(tx.amount || '');
                const resolved = resolveDynamicCategory(tx).toLowerCase();
                return merchant.includes(txSearchQuery) || 
                       category.includes(txSearchQuery) || 
                       type.includes(txSearchQuery) || 
                       amount.includes(txSearchQuery) ||
                       resolved.includes(txSearchQuery);
            });
        }
        
        if (filtered.length === 0) {
            list.innerHTML = '<div class="p-md text-center text-slate-500 select-none">No transactions match your search or category.</div>';
            return;
        }
        
        const sortedTx = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedTx.forEach(tx => {
            const isDeposit = tx.type === 'deposit';
            const isInvestment = tx.type === 'investment';
            let icon = 'shopping_bag';
            let iconBg = 'bg-slate-100 text-slate-500';
            
            // Map icons based on resolved category or transaction type
            const resolved = resolveDynamicCategory(tx);
            if (isDeposit) {
                icon = 'arrow_downward';
                iconBg = 'bg-secondary-container text-on-secondary-container';
            } else if (isInvestment) {
                icon = 'trending_up';
                iconBg = 'bg-emerald-700 text-white shadow-sm shadow-emerald-200';
            } else {
                if (resolved === 'Food') icon = 'restaurant';
                else if (resolved === 'Travel') icon = 'flight';
                else if (resolved === 'Retail') icon = 'shopping_bag';
            }
            
            const sign = isDeposit ? '+' : '-';
            const badge = tx.category !== 'Deposit' && tx.category !== 'Investment' 
                ? `<span class="text-[10px] font-label-caps text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded ml-2 font-bold">AI CATEGORIZED: ${resolved.toUpperCase()}</span>`
                : (isInvestment ? `<span class="text-[10px] font-label-caps text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded ml-2 font-bold">AI SWEEP: ${resolved.toUpperCase()}</span>` : '');

            let amountDetailsHTML = '';
            const amt = Number(tx.amount);
            
            if (tx.type === 'expense') {
                const spent = amt;
                const next10 = Math.ceil(spent / 10) * 10;
                const spare = next10 - spent === 0 ? 10 : next10 - spent;
                
                amountDetailsHTML = `
                    <div class="text-right select-none font-data-mono">
                        <p class="font-bold text-slate-800 dark:text-slate-100">${sign}₹${spent.toFixed(2)}</p>
                        <p class="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">Paid: ₹${spent.toFixed(2)} • Round: ₹${(spent + spare).toFixed(2)} • Spare: <span class="text-secondary font-extrabold">+₹${spare.toFixed(2)}</span></p>
                    </div>
                `;
            } else if (tx.type === 'investment') {
                const spare = amt;
                const spent = spare * 9;
                const round = spare * 10;
                
                amountDetailsHTML = `
                    <div class="text-right select-none font-data-mono">
                        <p class="font-bold text-emerald-600 dark:text-emerald-400">${sign}₹${spare.toFixed(2)}</p>
                        <p class="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">Paid: ₹${spent.toFixed(2)} • Round: ₹${round.toFixed(2)} • Spare: <span class="text-secondary font-extrabold">+₹${spare.toFixed(2)}</span></p>
                    </div>
                `;
            } else { // deposit
                const spent = amt;
                
                amountDetailsHTML = `
                    <div class="text-right select-none font-data-mono">
                        <p class="font-bold text-secondary">${sign}₹${spent.toFixed(2)}</p>
                        <p class="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">Paid: ₹${spent.toFixed(2)} • Round: ₹${spent.toFixed(2)} • Spare: <span class="text-slate-400 font-extrabold">+₹0.00</span></p>
                    </div>
                `;
            }

            list.innerHTML += `
                <div class="p-md flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors group ${isInvestment ? 'bg-emerald-50/20' : ''}">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 ${iconBg}">
                            <span class="material-symbols-outlined">${icon}</span>
                        </div>
                        <div>
                            <p class="font-bold text-primary dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">${tx.merchant_name} ${badge}</p>
                            <p class="text-sm text-slate-500 dark:text-slate-450">${tx.category} • ${new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div>
                        ${amountDetailsHTML}
                    </div>
                </div>
            `;
        });
    }

    applyFilters();
}

function setupFundDiscovery() {
    console.log('Initializing Fund Discovery Search & Filter Controllers...');
    const searchInput = document.getElementById('fund-search-input');
    if (searchInput) {
        searchInput.value = fundSearchQuery;
        searchInput.oninput = function() {
            fundSearchQuery = searchInput.value.toLowerCase().trim();
            applyFundFilters();
        };
    }

    // Bind category filter buttons
    window.filterFunds = function(category, btnElement) {
        fundSelectedCategory = category;
        
        // Update button styles
        const allButtons = document.querySelectorAll('.filter-btn');
        allButtons.forEach(btn => {
            btn.className = 'px-4 py-2 bg-white dark:bg-slate-850 text-slate-650 dark:text-slate-350 border border-slate-250 dark:border-slate-850 hover:bg-surface-container rounded-full font-label-caps whitespace-nowrap transition-colors filter-btn cursor-pointer';
        });
        
        if (btnElement) {
            btnElement.className = 'px-4 py-2 bg-primary text-white rounded-full font-label-caps whitespace-nowrap filter-btn cursor-pointer';
        }

        applyFundFilters();
    };

    function applyFundFilters() {
        const cards = document.querySelectorAll('.fund-card');
        if (cards.length === 0) return;
        
        cards.forEach(card => {
            const category = card.getAttribute('data-category');
            const title = (card.querySelector('h3')?.innerText || '').toLowerCase();
            const desc = (card.querySelector('p')?.innerText || '').toLowerCase();
            
            const matchesCategory = fundSelectedCategory === 'all' || category === fundSelectedCategory;
            const matchesSearch = !fundSearchQuery || title.includes(fundSearchQuery) || desc.includes(fundSearchQuery);
            
            if (matchesCategory && matchesSearch) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    applyFundFilters();
}

function setupOnboarding() {
    console.log('Initializing Onboarding Walkthrough Carousel...');
    let activeSlideIndex = 1;
    const totalSlides = 3;

    const nextBtn = document.getElementById('btn-next-slide');
    if (!nextBtn) return;

    nextBtn.onclick = function(e) {
        e.preventDefault();
        if (activeSlideIndex < totalSlides) {
            activeSlideIndex++;
            showSlide(activeSlideIndex);
        } else {
            navigate('Login_7b98119117794e4a97e4c84627fe9615.html');
        }
    };

    function showSlide(index) {
        for (let i = 1; i <= totalSlides; i++) {
            const slide = document.getElementById(`onboarding-slide-${i}`);
            const dot = document.getElementById(`dot-${i}`);
            
            if (slide) {
                slide.classList.add('hidden');
            }
            if (dot) {
                dot.className = 'onboarding-dot w-1.5 h-1.5 bg-white/20 rounded-full transition-all duration-300';
            }
        }

        const activeSlide = document.getElementById(`onboarding-slide-${index}`);
        const activeDot = document.getElementById(`dot-${index}`);
        
        if (activeSlide) {
            activeSlide.classList.remove('hidden');
        }
        if (activeDot) {
            activeDot.className = 'onboarding-dot active w-6 h-1.5 bg-primary rounded-full transition-all duration-300';
        }

        if (index === totalSlides) {
            nextBtn.innerHTML = `
                <span>GET STARTED</span>
                <span class="material-symbols-outlined text-[18px]">rocket_launch</span>
            `;
            nextBtn.className = 'w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-800 hover:opacity-90 text-white rounded-2xl font-label-caps text-sm tracking-wider font-bold shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer flex justify-center items-center gap-2';
        } else {
            nextBtn.innerHTML = `
                <span>NEXT</span>
                <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            `;
            nextBtn.className = 'w-full h-14 bg-primary hover:bg-teal-950 text-white rounded-2xl font-label-caps text-sm tracking-wider font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer flex justify-center items-center gap-2';
        }
    }
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

// Global modal state
let activeGoalId = null;

window.openGoalModal = function(goalId) {
    activeGoalId = goalId;
    const goal = currentGoals.find(g => g.id === goalId);
    if (!goal) return;

    const modal = document.getElementById('goal-modal');
    const modalContent = document.getElementById('goal-modal-content');
    
    if (!modal || !modalContent) return;

    document.getElementById('modal-goal-title').innerText = goal.title;
    document.getElementById('modal-goal-saved').innerText = Number(goal.saved_amount).toLocaleString('en-IN');
    document.getElementById('modal-goal-target').innerText = Number(goal.target_amount).toLocaleString('en-IN');
    document.getElementById('modal-goal-icon').innerText = goal.icon || 'potted_plant';

    const progress = goal.target_amount > 0 ? (goal.saved_amount / goal.target_amount) * 100 : 0;
    const progressClamped = Math.min(100, Math.max(0, progress));

    const visualizer = document.getElementById('modal-plant-visualizer');
    if (visualizer) {
        visualizer.innerHTML = renderSVGSprout(progressClamped);
    }

    const progressEl = document.getElementById('modal-goal-progress');
    if (progressEl) {
        progressEl.style.width = `${progressClamped}%`;
    }

    const input = document.getElementById('add-funds-amount');
    if (input) {
        input.value = '';
    }

    const btn = document.getElementById('btn-add-funds');
    if (btn) {
        btn.innerHTML = `<span class="material-symbols-outlined">water_drop</span> POUR FUNDS`;
        btn.disabled = false;
        
        btn.onclick = async function() {
            const amtVal = parseFloat(input.value);
            if (isNaN(amtVal) || amtVal <= 0) {
                alert("Please enter a valid amount to invest.");
                return;
            }

            let balance = 0;
            currentTransactions.forEach(tx => {
                if (tx.type === 'deposit') balance += Number(tx.amount);
                else if (tx.type === 'expense' || tx.type === 'investment') balance -= Number(tx.amount);
            });

            if (amtVal > balance) {
                alert(`Insufficient funds! Your available wallet balance is ₹${balance.toFixed(2)}. Please Top Up first.`);
                return;
            }

            btn.disabled = true;
            btn.innerHTML = `🌊 WATERING SPROUT...`;

            triggerWateringAnimation();

            setTimeout(async () => {
                const [txRes, goalRes] = await Promise.all([
                    supabase.from('transactions').insert([{
                        user_id: currentSession.user.id,
                        merchant_name: `Watered goal: ${goal.title}`,
                        category: 'Investment',
                        amount: amtVal,
                        type: 'investment'
                    }]),
                    supabase.from('goals')
                        .update({ saved_amount: goal.saved_amount + amtVal })
                        .eq('id', goal.id)
                ]);

                if (txRes.error || goalRes.error) {
                    alert("Watering failed: " + (txRes.error?.message || goalRes.error?.message));
                    btn.innerHTML = `<span class="material-symbols-outlined">water_drop</span> POUR FUNDS`;
                    btn.disabled = false;
                } else {
                    showToast(`💧 Nourished! ₹${amtVal.toLocaleString('en-IN')} poured into your ${goal.title} goal. Sprout grew taller!`);
                    await fetchUserData();
                    
                    renderGoals();
                    
                    const updatedGoal = currentGoals.find(g => g.id === goal.id);
                    if (updatedGoal) {
                        document.getElementById('modal-goal-saved').innerText = Number(updatedGoal.saved_amount).toLocaleString('en-IN');
                        const newPct = updatedGoal.target_amount > 0 ? (updatedGoal.saved_amount / updatedGoal.target_amount) * 100 : 0;
                        const newPctClamped = Math.min(100, Math.max(0, newPct));
                        
                        if (visualizer) {
                            visualizer.innerHTML = renderSVGSprout(newPctClamped);
                        }
                        if (progressEl) {
                            progressEl.style.width = `${newPctClamped}%`;
                        }
                    }
                    
                    btn.innerHTML = `✨ NURTURED!`;
                    setTimeout(() => {
                        window.closeGoalModal();
                    }, 800);
                }
            }, 1500);
        };
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('translate-y-full');
        modalContent.classList.add('translate-y-0');
    }, 50);
};

window.closeGoalModal = function() {
    const modal = document.getElementById('goal-modal');
    const modalContent = document.getElementById('goal-modal-content');
    if (!modal || !modalContent) return;

    modalContent.classList.remove('translate-y-0');
    modalContent.classList.add('translate-y-full');
    setTimeout(() => {
        modal.classList.add('hidden');
        activeGoalId = null;
    }, 300);
};

window.setAddFundsAmount = function(val) {
    const input = document.getElementById('add-funds-amount');
    if (input) {
        input.value = val;
    }
};

window.confirmDeleteGoal = async function() {
    if (!activeGoalId) return;
    const goal = currentGoals.find(g => g.id === activeGoalId);
    if (!goal) return;

    if (confirm(`Are you sure you want to pull up and delete the goal '${goal.title}'? Saved funds will remain in your transaction history.`)) {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', activeGoalId);

        if (error) {
            alert("Failed to delete goal: " + error.message);
        } else {
            showToast(`🗑️ Pulled up and harvested '${goal.title}' goal.`);
            await fetchUserData();
            window.closeGoalModal();
            renderGoals();
        }
    }
};

window.openWithdrawModal = function() {
    const modal = document.getElementById('withdraw-modal');
    const modalContent = document.getElementById('withdraw-modal-content');
    const balEl = document.getElementById('withdraw-available-balance');
    const amountInput = document.getElementById('withdraw-amount');
    
    if (!modal || !modalContent) return;
    
    let balance = 0;
    currentTransactions.forEach(tx => {
        if (tx.type === 'deposit') balance += Number(tx.amount);
        else if (tx.type === 'expense' || tx.type === 'investment') balance -= Number(tx.amount);
    });
    
    if (balEl) {
        balEl.innerText = `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
    if (amountInput) {
        amountInput.value = '';
    }
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('translate-y-full');
        modalContent.classList.add('translate-y-0');
    }, 50);
};

window.closeWithdrawModal = function() {
    const modal = document.getElementById('withdraw-modal');
    const modalContent = document.getElementById('withdraw-modal-content');
    if (!modal || !modalContent) return;
    
    modalContent.classList.remove('translate-y-0');
    modalContent.classList.add('translate-y-full');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

window.setWithdrawAmount = function(val) {
    const amountInput = document.getElementById('withdraw-amount');
    if (amountInput) {
        amountInput.value = val;
    }
};

// Start the app
init();

// --- NEW FEATURES ---

window.openEditProfileModal = function() {
    const modal = document.getElementById('edit-profile-modal');
    const content = document.getElementById('edit-profile-modal-content');
    if(modal) {
        modal.classList.remove('hidden');
        // small delay to allow display:block to apply before animating
        setTimeout(() => {
            content.classList.remove('translate-y-full');
        }, 10);
    }
}

window.closeEditProfileModal = function() {
    const modal = document.getElementById('edit-profile-modal');
    const content = document.getElementById('edit-profile-modal-content');
    if(modal) {
        content.classList.add('translate-y-full');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300); // match transition duration
    }
}

window.saveProfile = async function() {
    const name = document.getElementById('edit-profile-name').value;
    const phone = document.getElementById('edit-profile-phone').value;
    
    if(!currentSession) return;
    
    // Show loading state on button
    const btn = document.querySelector('#edit-profile-modal button.bg-primary');
    const oldHtml = btn.innerHTML;
    if(btn) { btn.innerHTML = 'Saving...'; btn.disabled = true; }
    
    const { data, error } = await supabase.auth.updateUser({
        data: { full_name: name, phone: phone }
    });
    
    if(btn) { btn.innerHTML = oldHtml; btn.disabled = false; }
    
    if (error) {
        showToast(error.message, 'error');
        return;
    }
    
    currentSession.user = data.user;
    window.renderProfile();
    closeEditProfileModal();
    showToast('Profile updated successfully!', 'success');
}

window.renderProfile = function() {
    if(!currentSession) return;
    
    const meta = currentSession.user.user_metadata || {};
    const name = meta.full_name || 'Add Name';
    const phone = meta.phone || 'Add Phone';
    const email = currentSession.user.email;
    
    const nameDisplay = document.getElementById('profile-name-display');
    const emailDisplay = document.getElementById('profile-email-display');
    
    if(nameDisplay) nameDisplay.innerText = name;
    if(emailDisplay) emailDisplay.innerText = `${email} • ${phone}`;
    
    const nameInput = document.getElementById('edit-profile-name');
    const phoneInput = document.getElementById('edit-profile-phone');
    const emailInput = document.getElementById('edit-profile-email');
    
    if(nameInput) nameInput.value = name !== 'Add Name' ? name : '';
    if(phoneInput) phoneInput.value = phone !== 'Add Phone' ? phone : '';
    if(emailInput) {
        emailInput.value = email;
        emailInput.disabled = true; 
    }
    
    const bankAccounts = meta.bank_accounts || [];
    const bankCountDisplay = document.getElementById('bank-accounts-count');
    if(bankCountDisplay) {
        bankCountDisplay.innerText = `${bankAccounts.length} accounts connected`;
    }
}

window.nextAutoInvestStep = function(step) {
    const s1 = document.getElementById('step-1');
    const s2 = document.getElementById('step-2');
    const s3 = document.getElementById('step-3');
    
    if(s1) s1.classList.add('hidden');
    if(s2) s2.classList.add('hidden');
    if(s3) s3.classList.add('hidden');
    
    const targetStep = document.getElementById(`step-${step}`);
    if(targetStep) targetStep.classList.remove('hidden');
    
    // Update progress bar
    if(step >= 2) {
        const ind2 = document.getElementById('step2-indicator');
        if(ind2) {
            ind2.classList.replace('bg-surface-container-highest', 'bg-primary');
            ind2.classList.replace('text-slate-500', 'text-white');
        }
        const text2 = document.getElementById('step2-text');
        if(text2) text2.classList.replace('text-slate-500', 'text-primary');
        const line2 = document.getElementById('line2');
        if(line2) line2.classList.replace('bg-surface-container-highest', 'bg-primary');
    }
    if(step >= 3) {
        const ind3 = document.getElementById('step3-indicator');
        if(ind3) {
            ind3.classList.replace('bg-surface-container-highest', 'bg-primary');
            ind3.classList.replace('text-slate-500', 'text-white');
        }
        const text3 = document.getElementById('step3-text');
        if(text3) text3.classList.replace('text-slate-500', 'text-primary');
    }
}

window.completeAutoInvest = function() {
    showToast('AutoPay Mandate Authorized!', 'success');
    setTimeout(() => {
        navigate('ProfileSettings_dbb3792156614cb5ae492572ff792679.html');
    }, 1500);
}

window.filterFunds = function(category, btnElement) {
    // Update button styles
    const allButtons = document.querySelectorAll('.filter-btn');
    allButtons.forEach(btn => {
        btn.classList.remove('bg-primary', 'text-white');
        btn.classList.add('bg-white', 'text-on-surface-variant');
    });
    
    // Highlight clicked button
    if (btnElement) {
        btnElement.classList.remove('bg-white', 'text-on-surface-variant');
        btnElement.classList.add('bg-primary', 'text-white');
    }

    // Filter cards
    const cards = document.querySelectorAll('.fund-card');
    cards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

window.linkBankAccount = async function(event, form) {
    event.preventDefault();
    if(!currentSession) return;
    
    const btn = document.getElementById('saveBankBtn');
    const oldHtml = btn.innerHTML;
    btn.innerHTML = 'Linking...';
    btn.disabled = true;
    
    const bankName = document.getElementById('bank-name').value;
    const accountNo = document.getElementById('account-no').value;
    const ifscCode = document.getElementById('ifsc-code').value;
    
    const meta = currentSession.user.user_metadata || {};
    const bankAccounts = meta.bank_accounts || [];
    
    bankAccounts.push({
        bankName,
        accountNo: accountNo.slice(-4), // Only store last 4 for security
        ifscCode,
        linkedAt: new Date().toISOString()
    });
    
    const { data, error } = await supabase.auth.updateUser({
        data: { bank_accounts: bankAccounts }
    });
    
    btn.innerHTML = oldHtml;
    btn.disabled = false;
    
    if (error) {
        showToast(error.message, 'error');
        return;
    }
    
    currentSession.user = data.user;
    
    document.getElementById('inputState').classList.add('hidden');
    document.getElementById('successState').classList.remove('hidden');
}

// ==========================================
// REAL-TIME AND AI FEATURES (GROWBOT)
// ==========================================

function setupRealtimeSubscriptions() {
    if (!currentSession) return;
    
    // Cleanup any existing active channels
    unsubscribeRealtime();
    
    const userId = currentSession.user.id;
    console.log('Establishing Realtime postgres change channels for user:', userId);
    
    transactionsSubscription = supabase
        .channel('public-transactions')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'transactions'
        }, async (payload) => {
            const newRow = payload.new || {};
            const oldRow = payload.old || {};
            if (newRow.user_id === userId || oldRow.user_id === userId) {
                console.log('Live Transaction sync triggered:', payload.eventType);
                await fetchUserDataSilently();
                reRenderActiveScreen();
            }
        })
        .subscribe();
        
    goalsSubscription = supabase
        .channel('public-goals')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'goals'
        }, async (payload) => {
            const newRow = payload.new || {};
            const oldRow = payload.old || {};
            if (newRow.user_id === userId || oldRow.user_id === userId) {
                console.log('Live Goal sync triggered:', payload.eventType);
                await fetchUserDataSilently();
                reRenderActiveScreen();
            }
        })
        .subscribe();
}

function unsubscribeRealtime() {
    if (transactionsSubscription) {
        supabase.removeChannel(transactionsSubscription);
        transactionsSubscription = null;
    }
    if (goalsSubscription) {
        supabase.removeChannel(goalsSubscription);
        goalsSubscription = null;
    }
}

async function fetchUserDataSilently() {
    if (!currentSession) return;
    
    const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
    if (txData) currentTransactions = txData;

    const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });
    if (goalsData) currentGoals = goalsData;
}

function reRenderActiveScreen() {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    
    if (hash.includes('WalletOverview')) {
        renderWallet();
    } else if (hash.includes('GoalsDashboard')) {
        renderGoals();
    } else if (hash.includes('TransactionHistory')) {
        renderTransactionHistory();
    } else if (hash.includes('ProfileSettings')) {
        window.renderProfile();
    }
}

function triggerSproutAnimation() {
    for (let i = 0; i < 10; i++) {
        const sprout = document.createElement('div');
        sprout.className = 'sweep-sprout font-bold text-3xl select-none filter drop-shadow-md';
        sprout.innerHTML = Math.random() > 0.5 ? '🌱' : '✨';
        sprout.style.left = `${15 + Math.random() * 70}%`;
        sprout.style.bottom = `${15 + Math.random() * 20}%`;
        sprout.style.animationDelay = `${i * 120}ms`;
        document.body.appendChild(sprout);
        setTimeout(() => sprout.remove(), 2000);
    }
}

function injectGrowBot() {
    // Remove if already exists
    const oldFab = document.getElementById('growbot-fab');
    if (oldFab) oldFab.remove();
    const oldChat = document.getElementById('growbot-chat-window');
    if (oldChat) oldChat.remove();

    // Create FAB
    const fab = document.createElement('div');
    fab.id = 'growbot-fab';
    fab.className = 'fixed bottom-24 right-6 md:bottom-28 md:right-10 z-[999] w-14 h-14 bg-gradient-to-tr from-emerald-600 to-[#C5A059] rounded-full flex items-center justify-center text-white cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.3)] animate-orb hover:scale-105 active:scale-95 transition-all';
    fab.innerHTML = `<span class="material-symbols-outlined text-2xl select-none" id="growbot-fab-icon">auto_awesome</span>`;
    fab.onclick = window.toggleGrowBot;
    
    // Create Chat Window
    const chatWindow = document.createElement('div');
    chatWindow.id = 'growbot-chat-window';
    chatWindow.className = 'fixed bottom-20 right-4 md:right-10 w-[92%] max-w-[380px] h-[480px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl flex flex-col z-[1000] overflow-hidden transition-all duration-300 transform translate-y-[120%] opacity-0 scale-95 pointer-events-none';
    
    chatWindow.innerHTML = `
        <!-- Header -->
        <div class="px-5 py-4 bg-gradient-to-r from-emerald-900 to-teal-950 text-white flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-400/30">
                    <span class="material-symbols-outlined text-emerald-300" style="font-size: 20px;">psychology</span>
                </div>
                <div>
                    <h4 class="font-bold text-sm tracking-wide">GrowBot AI</h4>
                    <p class="text-[10px] text-emerald-300 flex items-center gap-1">
                        <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Wealth Coach
                    </p>
                </div>
            </div>
            <button class="text-teal-200 hover:text-white transition-colors cursor-pointer" onclick="window.toggleGrowBot()">
                <span class="material-symbols-outlined" style="font-size: 22px;">close</span>
            </button>
        </div>
        
        <!-- Message Stream -->
        <div id="growbot-messages" class="flex-1 overflow-y-auto p-4 space-y-3 growbot-chat-scrollbar text-sm flex flex-col">
            <!-- Dynamic Messages Go Here -->
        </div>
        
        <!-- Quick Action Suggestion Chips -->
        <div class="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/40 flex gap-2 overflow-x-auto whitespace-nowrap growbot-chat-scrollbar">
            <button class="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs text-slate-700 dark:text-slate-300 rounded-full transition-all cursor-pointer shadow-sm hover:shadow" onclick="window.sendQuickPrompt('portfolio')">💡 Portfolio</button>
            <button class="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs text-slate-700 dark:text-slate-300 rounded-full transition-all cursor-pointer shadow-sm hover:shadow" onclick="window.sendQuickPrompt('goals')">🚀 Goals</button>
            <button class="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs text-slate-700 dark:text-slate-300 rounded-full transition-all cursor-pointer shadow-sm hover:shadow" onclick="window.sendQuickPrompt('autosweep')">🌾 Auto-Sweep</button>
            <button class="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs text-slate-700 dark:text-slate-300 rounded-full transition-all cursor-pointer shadow-sm hover:shadow" onclick="window.sendQuickPrompt('simulate')">💰 AI Top-Up</button>
        </div>
        
        <!-- Input Form -->
        <form id="growbot-form" class="p-3 border-t border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 flex gap-2 items-center">
            <input id="growbot-input" type="text" placeholder="Ask GrowBot wealth planner..." class="flex-1 h-10 px-4 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none text-sm" autocomplete="off"/>
            <button type="submit" class="w-10 h-10 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer">
                <span class="material-symbols-outlined" style="font-size: 18px;">send</span>
            </button>
        </form>
    `;
    
    document.body.appendChild(fab);
    document.body.appendChild(chatWindow);
    
    addBotMessage("Hi! I'm **GrowBot**, your AI Wealth Partner. 🌾✨<br><br>I can analyze your transactions, offer advice on your active goals, or simulate real-time round-up deposits. How can I help you grow today?");
    
    const form = document.getElementById('growbot-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('growbot-input');
            const text = input.value.trim();
            if (!text) return;
            
            addUserMessage(text);
            input.value = '';
            
            simulateBotResponse(text);
        });
    }
}

let isBotOpen = false;
window.toggleGrowBot = function() {
    const chat = document.getElementById('growbot-chat-window');
    const fabIcon = document.getElementById('growbot-fab-icon');
    if (!chat) return;
    isBotOpen = !isBotOpen;
    if (isBotOpen) {
        chat.classList.remove('translate-y-[120%]', 'opacity-0', 'scale-95', 'pointer-events-none');
        chat.classList.add('translate-y-0', 'opacity-100', 'scale-100', 'pointer-events-auto');
        if (fabIcon) fabIcon.innerText = 'close';
    } else {
        chat.classList.remove('translate-y-0', 'opacity-100', 'scale-100', 'pointer-events-auto');
        chat.classList.add('translate-y-[120%]', 'opacity-0', 'scale-95', 'pointer-events-none');
        if (fabIcon) fabIcon.innerText = 'auto_awesome';
    }
};

function addBotMessage(html) {
    const msgs = document.getElementById('growbot-messages');
    if (!msgs) return;
    const msg = document.createElement('div');
    msg.className = 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-none p-3.5 max-w-[85%] self-start border border-slate-200/20 dark:border-slate-700/20 shadow-sm leading-relaxed';
    msg.innerHTML = html;
    msgs.appendChild(msg);
    msgs.scrollTop = msgs.scrollHeight;
}

function addUserMessage(text) {
    const msgs = document.getElementById('growbot-messages');
    if (!msgs) return;
    const msg = document.createElement('div');
    msg.className = 'bg-emerald-800 text-white rounded-2xl rounded-tr-none p-3.5 max-w-[85%] self-end ml-auto shadow-sm';
    msg.innerText = text;
    msgs.appendChild(msg);
    msgs.scrollTop = msgs.scrollHeight;
}

window.sendQuickPrompt = function(type) {
    let query = "";
    if (type === 'portfolio') query = "Analyze my Portfolio";
    else if (type === 'goals') query = "How can I accelerate my goals?";
    else if (type === 'autosweep') query = "Explain how Auto-Sweep works";
    else if (type === 'simulate') query = "Simulate an AI Spare Change Top-Up";
    
    addUserMessage(query);
    simulateBotResponse(query, type);
};

async function simulateBotResponse(text, type) {
    const msgs = document.getElementById('growbot-messages');
    if (!msgs) return;
    
    // Add typing indicator
    const typing = document.createElement('div');
    typing.id = 'growbot-typing';
    typing.className = 'bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl rounded-tl-none p-3.5 max-w-[85%] self-start border border-slate-200/20 shadow-sm flex items-center gap-1';
    typing.innerHTML = '<span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span><span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span><span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;

    // Simulate standard prompt parsing
    const q = text.toLowerCase();
    let response = "";
    
    // Calculate current wallet balance
    let balance = 0;
    currentTransactions.forEach(tx => {
        if (tx.type === 'deposit') balance += Number(tx.amount);
        else if (tx.type === 'expense' || tx.type === 'investment') balance -= Number(tx.amount);
    });

    // Small delay to make it feel extremely realistic
    setTimeout(async () => {
        const typIndicator = document.getElementById('growbot-typing');
        if (typIndicator) typIndicator.remove();
        
        if (!currentSession) {
            addBotMessage("Please sign in to allow me to analyze your wealth statistics!");
            return;
        }

        if (type === 'portfolio' || q.includes('portfolio') || q.includes('balance') || q.includes('wallet')) {
            const expenseCount = currentTransactions.filter(t => t.type === 'expense').length;
            const investCount = currentTransactions.filter(t => t.type === 'investment').length;
            response = `📊 **Portfolio Analysis**:<br>
            • Available Wallet Balance: **₹${balance.toFixed(2)}**<br>
            • Total Transactions logged: **${currentTransactions.length}**<br>
            • Expense activity: **${expenseCount} purchases**<br>
            • Spare Change Investments: **${investCount} deposits**<br><br>
            Your current savings rate suggests a steady growth trajectory. Try to round-up transactions at 2x to hit your investment threshold quicker!`;
            
        } else if (type === 'goals' || q.includes('goal') || q.includes('accelerate') || q.includes('potted')) {
            if (currentGoals.length === 0) {
                response = "You haven't planted any goals yet! Plant one on the **Goals Dashboard** (e.g. *Vacation Fund* or *Crypto Sprout*) and I will track it live for you! 🪴";
            } else {
                const firstGoal = currentGoals[0];
                const progress = firstGoal.target_amount > 0 ? (firstGoal.saved_amount / firstGoal.target_amount) * 100 : 0;
                response = `🚀 **Goals Acceleration Plan**:<br>
                • You have **${currentGoals.length}** active goals.<br>
                • Top Goal: **'${firstGoal.title}'** is **${progress.toFixed(1)}%** complete (₹${firstGoal.saved_amount} saved / ₹${firstGoal.target_amount} target).<br><br>
                💡 **GrowBot Pro-Tip**:<br>
                Enable UPI auto-sweep or simulated payments to pour water directly onto your **${firstGoal.title}** goal. Top-up ₹100 right now to accelerate completion by a week!`;
            }
            
        } else if (type === 'autosweep' || q.includes('sweep') || q.includes('auto')) {
            response = `🌾 **How Auto-Sweep Works**:<br>
            1. Every time you make a regular digital payment, SpareGrow rounds it up to the nearest ₹10, ₹50, or ₹100.<br>
            2. The spare change is aggregated in your Available Balance.<br>
            3. Once your balance hits our auto-investment threshold of **₹500.00**, we automatically trigger an Auto-Sweep to distribute funds directly into your active goals.<br><br>
            This ensures hands-free, frictionless compounding growth!`;
            
        } else if (type === 'simulate' || q.includes('simulate') || q.includes('top-up') || q.includes('invest') || q.includes('topup')) {
            addBotMessage("⚙️ **Simulating Round-Up Transaction...**");
            
            const mockTxList = [
                { merchant: 'Starbucks Latte', amount: 46.00, category: 'Food & Drink' },
                { merchant: 'Uber Ride', amount: 38.00, category: 'Transport' },
                { merchant: 'Zomato Delivery', amount: 73.00, category: 'Food & Drink' },
                { merchant: 'Mother Dairy Milk', amount: 29.00, category: 'Daily Essentials' },
                { merchant: 'Local Groceries (Bread & Eggs)', amount: 47.50, category: 'Daily Essentials' },
                { merchant: 'Chai Stall Tapri', amount: 8.00, category: 'Daily Essentials' }
            ];
            
            const inserts = [];
            mockTxList.forEach(item => {
                const spent = item.amount;
                const next10 = Math.ceil(spent / 10) * 10;
                const spare = next10 - spent === 0 ? 10 : next10 - spent;
                
                // Insert the expense transaction
                inserts.push(supabase.from('transactions').insert([{
                    user_id: currentSession.user.id,
                    merchant_name: item.merchant,
                    category: item.category,
                    amount: spent,
                    type: 'expense'
                }]));
                
                // Insert the corresponding round-up sweep/investment
                inserts.push(supabase.from('transactions').insert([{
                    user_id: currentSession.user.id,
                    merchant_name: `Round-Up: ${item.merchant}`,
                    category: 'Investment',
                    amount: spare,
                    type: 'investment'
                }]));
            });
            
            const results = await Promise.all(inserts);
            const hasError = results.some(res => res.error);
            
            if (hasError) {
                response = "❌ Oops, I failed to process the mock transactions. Please check your Supabase network credentials.";
            } else {
                response = `✅ **AI Simulation Success!** ⚡<br><br>
                I've successfully simulated **6 new purchases** (including daily essentials) in your account:<br><br>
                🛒 **Daily Essentials Micro-Savings**:<br>
                • 🥛 **Mother Dairy Milk**: spent ₹29.00 ➔ **Spare: +₹1.00**<br>
                • 🍞 **Bread & Eggs**: spent ₹47.50 ➔ **Spare: +₹2.50**<br>
                • ☕ **Chai Stall Tapri**: spent ₹8.00 ➔ **Spare: +₹2.00**<br><br>
                🍔 **Lifestyle Micro-Savings**:<br>
                • ☕ **Starbucks Latte**: spent ₹46.00 ➔ **Spare: +₹4.00**<br>
                • 🚗 **Uber Ride**: spent ₹38.00 ➔ **Spare: +₹2.00**<br>
                • 🍔 **Zomato Delivery**: spent ₹73.00 ➔ **Spare: +₹7.00**<br><br>
                Notice how SpareGrow automatically rounds each daily transaction to the nearest ₹10, generating tiny, effortless spare changes! Check your transaction list—the real-time feed has already updated in the background! 🌿✨`;
                
                triggerSproutAnimation();
            }
            
        } else {
            response = `🤖 **GrowBot Advisor**:<br><br>
            I see you asked: *"${text}"*<br><br>
            I am here to advise you on saving strategies. Try clicking one of the quick chips below to get customized reports on your portfolio, active goal projections, or explanation of the automated round-up rules!`;
        }
        
        addBotMessage(response);
    }, 950);
}

// ==========================================
// PORTFOLIO WEALTH CALCULATOR (PREMIUM APP)
// ==========================================

function setupWealthSimulator() {
    console.log('Initializing Wealth Simulator Dashboard...');
    // Small timeout to guarantee DOM is mounted before initial calculation
    setTimeout(() => {
        window.updateProjections();
    }, 100);
}

window.updateProjections = function() {
    const seedInput = document.getElementById('slider-seed');
    const contributionInput = document.getElementById('slider-contribution');
    const rateInput = document.getElementById('slider-rate');
    const yearsInput = document.getElementById('slider-years');
    
    if (!seedInput || !contributionInput || !rateInput || !yearsInput) return;
    
    const seed = parseFloat(seedInput.value);
    const weekly = parseFloat(contributionInput.value);
    const rate = parseFloat(rateInput.value) / 100;
    const years = parseFloat(yearsInput.value);
    
    // Update textual indicators
    document.getElementById('val-seed').innerText = `₹${seed.toLocaleString('en-IN')}`;
    document.getElementById('val-contribution').innerText = `₹${weekly.toLocaleString('en-IN')}/week`;
    document.getElementById('val-rate').innerText = `${Math.round(rate * 100)}%`;
    document.getElementById('val-years').innerText = `${years} ${years === 1 ? 'Year' : 'Years'}`;
    
    // Math: Future Value of Compound Interest with Periodic Weekly Deposits
    const n = 52;
    const totalPeriods = n * years;
    const periodicRate = rate / n;
    
    let compoundFactor = Math.pow(1 + periodicRate, totalPeriods);
    let seedGrowth = seed * compoundFactor;
    
    let annuityGrowth = 0;
    if (periodicRate > 0) {
        annuityGrowth = weekly * ((compoundFactor - 1) / periodicRate) * (1 + periodicRate);
    } else {
        annuityGrowth = weekly * totalPeriods;
    }
    
    const futureWealth = seedGrowth + annuityGrowth;
    const totalInvested = seed + (weekly * totalPeriods);
    const netGained = Math.max(0, futureWealth - totalInvested);
    
    // Update visual results
    document.getElementById('res-wealth').innerText = `₹${Math.round(futureWealth).toLocaleString('en-IN')}`;
    document.getElementById('res-invested').innerText = `₹${Math.round(totalInvested).toLocaleString('en-IN')}`;
    document.getElementById('res-gain').innerText = `₹${Math.round(netGained).toLocaleString('en-IN')}`;
    
    // Render dynamic SVG Curve path
    const svg = document.getElementById('compounding-chart-svg');
    const linePath = document.getElementById('chart-line-path');
    const areaPath = document.getElementById('chart-area-path');
    
    if (svg && linePath && areaPath) {
        const points = [];
        const divisions = 10;
        
        for (let i = 0; i <= divisions; i++) {
            const fraction = i / divisions;
            const tPeriod = totalPeriods * fraction;
            const factor = Math.pow(1 + periodicRate, tPeriod);
            const valSeed = seed * factor;
            let valAnn = 0;
            if (periodicRate > 0) {
                valAnn = weekly * ((factor - 1) / periodicRate) * (1 + periodicRate);
            } else {
                valAnn = weekly * tPeriod;
            }
            const wealthAtStep = valSeed + valAnn;
            
            const x = fraction * 100;
            const y = 95 - (wealthAtStep / futureWealth) * 85; 
            points.push(`${x},${y}`);
        }
        
        const dLine = `M ${points.join(' L ')}`;
        linePath.setAttribute('d', dLine);
        
        const dArea = `${dLine} L 100,100 L 0,100 Z`;
        areaPath.setAttribute('d', dArea);
    }
    
    // Dynamic GrowBot Smart recommendation
    const recText = document.getElementById('ai-rebalance-recommendation');
    if (recText) {
        if (rate * 100 < 10) {
            recText.innerHTML = `Your return target is conservative. Moving parts of your cash into **Balanced Growth Fund** would elevate yields to 12% (+₹${Math.round(netGained * 0.35).toLocaleString('en-IN')} gain!).`;
        } else if (rate * 100 >= 10 && rate * 100 <= 18) {
            recText.innerHTML = `Excellent return projection! GrowBot suggests setting a **Round-Up Rule multiplier at 2.0x** to plant an additional ₹${Math.round(weekly * 0.5)} weekly!`;
        } else {
            recText.innerHTML = `🔥 High return targets require high-growth vehicles! Rebalancing 50% of sweeps into **Equity Alpha ETF** yields maximum capital efficiency.`;
        }
    }
}

// ==========================================
// PAUSE / RESUME AUTOMATED RULES
// ==========================================

window.togglePauseRules = function() {
    const isPaused = localStorage.getItem('rules_paused') === 'true';
    const nextState = !isPaused;
    localStorage.setItem('rules_paused', nextState ? 'true' : 'false');
    
    if (nextState) {
        showToast("⏸️ Auto-invest rules paused! Spare change round-ups will gather in your balance but won't auto-sweep.");
    } else {
        showToast("▶️ Auto-invest rules resumed! We will automatically sweep when your balance hits the threshold.");
        checkAndTriggerAutoSweep();
    }
    
    window.updatePauseButtonVisuals();
    
    const hash = window.location.hash.slice(1);
    if (hash.includes('WalletOverview')) {
        renderWallet();
    }
};

window.updatePauseButtonVisuals = function() {
    const isPaused = localStorage.getItem('rules_paused') === 'true';
    const btn = document.getElementById('btn-pause-rules');
    const icon = document.getElementById('icon-pause-rules');
    const label = document.getElementById('label-pause-rules');
    
    if (btn && icon && label) {
        if (isPaused) {
            icon.innerText = 'play_circle';
            label.innerText = 'RESUME RULES';
            btn.className = 'flex flex-col items-center justify-center p-md bg-amber-100 dark:bg-amber-950/40 text-amber-750 dark:text-amber-300 border border-amber-500/25 rounded-2xl hover:bg-amber-200 dark:hover:bg-amber-900/40 transition-all active:scale-95 shadow-sm cursor-pointer';
        } else {
            icon.innerText = 'pause_circle';
            label.innerText = 'PAUSE RULES';
            btn.className = 'flex flex-col items-center justify-center p-md bg-surface-container-low text-on-surface-variant border border-transparent rounded-2xl hover:bg-surface-container-high transition-all active:scale-95 shadow-sm cursor-pointer';
        }
    }
};

// ==========================================
// WITHDRAW FUNDS MODAL ACTIONS
// ==========================================

window.openWithdrawModal = function() {
    const modal = document.getElementById('withdraw-modal');
    const modalContent = document.getElementById('withdraw-modal-content');
    const balEl = document.getElementById('withdraw-available-balance');
    const amountInput = document.getElementById('withdraw-amount');
    
    if (!modal || !modalContent) return;
    
    let balance = 0;
    currentTransactions.forEach(tx => {
        if (tx.type === 'deposit') balance += Number(tx.amount);
        else if (tx.type === 'expense' || tx.type === 'investment') balance -= Number(tx.amount);
    });
    
    if (balEl) {
        balEl.innerText = `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
    if (amountInput) {
        amountInput.value = '';
    }
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('translate-y-full');
        modalContent.classList.add('translate-y-0');
    }, 50);
};

window.closeWithdrawModal = function() {
    const modal = document.getElementById('withdraw-modal');
    const modalContent = document.getElementById('withdraw-modal-content');
    if (!modal || !modalContent) return;
    
    modalContent.classList.remove('translate-y-0');
    modalContent.classList.add('translate-y-full');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

window.setWithdrawAmount = function(val) {
    const amountInput = document.getElementById('withdraw-amount');
    if (amountInput) {
        amountInput.value = val;
    }
};

// ==========================================
// SPAREGROW GOLD PREMIUM UPGRADE SYSTEM
// ==========================================

window.triggerGoldUpgrade = function() {
    let modal = document.getElementById('gold-upgrade-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'gold-upgrade-modal';
        modal.className = 'fixed inset-0 z-[100] bg-black/75 backdrop-blur-md hidden flex items-center justify-center p-6 transition-all duration-300';
        modal.innerHTML = `
            <div class="bg-gradient-to-b from-[#111827] to-[#1e1b4b] border border-[#C5A059]/40 w-full max-w-[420px] rounded-3xl p-8 flex flex-col items-center text-center relative shadow-[0_0_50px_rgba(197,160,89,0.3)] select-none">
                <button class="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer" onclick="document.getElementById('gold-upgrade-modal').classList.add('hidden')">
                    <span class="material-symbols-outlined">close</span>
                </button>
                
                <div class="w-20 h-20 bg-gradient-to-r from-amber-400 via-[#C5A059] to-yellow-500 rounded-full flex items-center justify-center text-[#111827] mb-6 shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-pulse">
                    <span class="material-symbols-outlined" style="font-size: 44px;">workspace_premium</span>
                </div>
                
                <h2 class="font-title-lg text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-[#C5A059] to-amber-200 mb-2 font-manrope">SpareGrow Gold</h2>
                <p class="text-amber-200/70 text-sm mb-6 uppercase tracking-widest font-bold font-label-caps">Elite Wealth Building Tier</p>
                
                <div class="w-full space-y-4 mb-8 text-left text-slate-200 font-body-md text-sm">
                    <div class="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        <span class="material-symbols-outlined text-amber-400">trending_up</span>
                        <span><strong>2% Higher Yields</strong> on all spare-change sweep portfolios.</span>
                    </div>
                    <div class="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        <span class="material-symbols-outlined text-amber-400">speed</span>
                        <span><strong>Turbo Round-up</strong> triggers at 2x and 3x multiplier rates.</span>
                    </div>
                    <div class="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        <span class="material-symbols-outlined text-amber-400">support_agent</span>
                        <span><strong>Dedicated Wealth Manager</strong> and custom AI portfolio rules.</span>
                    </div>
                </div>
                
                <button id="btn-activate-gold" class="w-full py-4 bg-gradient-to-r from-yellow-500 via-[#C5A059] to-amber-500 text-slate-950 rounded-xl font-label-caps text-[15px] font-black tracking-wider shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 active:scale-95 transition-all cursor-pointer">
                    ACTIVATE GOLD NOW • ₹149/mo
                </button>
                <p class="text-slate-400 text-xs mt-4">Cancel anytime. 7-day free trial applies immediately.</p>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const isGold = localStorage.getItem('is_gold_member') === 'true';
    const btn = document.getElementById('btn-activate-gold');
    
    if (isGold) {
        modal.querySelector('h2').innerText = "SpareGrow Gold Active";
        modal.querySelector('p').innerText = "YOUR EXCLUSIVE PRIVILEGES ARE LIVE";
        btn.innerText = "YOU ARE ALREADY GOLD ✨";
        btn.disabled = true;
        btn.className = "w-full py-4 bg-slate-800 text-amber-400 rounded-xl font-label-caps text-[15px] font-bold tracking-wider cursor-default border border-amber-500/30";
    } else {
        modal.querySelector('h2').innerText = "SpareGrow Gold";
        modal.querySelector('p').innerText = "Elite Wealth Building Tier";
        btn.innerText = "ACTIVATE GOLD NOW • ₹149/mo";
        btn.disabled = false;
        btn.className = "w-full py-4 bg-gradient-to-r from-yellow-500 via-[#C5A059] to-amber-500 text-slate-950 rounded-xl font-label-caps text-[15px] font-black tracking-wider shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 active:scale-95 transition-all cursor-pointer";
        
        btn.onclick = function() {
            btn.innerText = "ACTIVATING...";
            btn.disabled = true;
            setTimeout(() => {
                localStorage.setItem('is_gold_member', 'true');
                showToast("✨ Congratulations! You are now a SpareGrow Gold Member! Premium yields applied.");
                modal.classList.add('hidden');
                
                const hash = window.location.hash.slice(1);
                if (hash.includes('WalletOverview')) {
                    renderWallet();
                }
            }, 1200);
        };
    }
    
    modal.classList.remove('hidden');
};

function triggerWateringAnimation() {
    const visualizer = document.getElementById('modal-plant-visualizer');
    if (!visualizer) return;

    const can = document.createElement('div');
    can.className = 'absolute top-2 right-4 text-3xl select-none animate-[watering-tilt_1.2s_ease-in-out_infinite] z-20';
    can.innerText = '🚿';
    visualizer.appendChild(can);

    const dropInterval = setInterval(() => {
        if (!can.parentElement) {
            clearInterval(dropInterval);
            return;
        }
        const drop = document.createElement('div');
        drop.className = 'absolute bg-emerald-400 rounded-full w-1 h-2 opacity-85 z-10';
        drop.style.left = `${50 + (Math.random() * 20 - 10)}%`;
        drop.style.top = '25%';
        drop.style.animation = 'watering-drop 0.6s linear forwards';
        visualizer.appendChild(drop);

        setTimeout(() => drop.remove(), 600);
    }, 80);

    setTimeout(() => {
        clearInterval(dropInterval);
        can.remove();
    }, 1400);
}

// Inject watering animation styles to DOM
const wateringStyleSheet = document.createElement("style");
wateringStyleSheet.innerText = `
@keyframes watering-tilt {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(-10px, 8px) rotate(-35deg); }
}
@keyframes watering-drop {
    0% { transform: translateY(0) scaleY(1); opacity: 0.85; }
    80% { opacity: 0.85; }
    100% { transform: translateY(70px) scaleY(0.4); opacity: 0; }
}
`;
document.head.appendChild(wateringStyleSheet);

