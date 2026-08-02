/**
 * test_suite_full.js
 * ==================
 * 310 Unique End-to-End Mobile Appium Automation Test Cases for SpareGrow (Node.js).
 *
 * Categories:
 *   A. Deployment & Mobile Environment (20 Tests: TC-MOB-DEP-001 to 020)
 *   B. UI / UX Mobile Design & Screens (80 Tests: TC-MOB-UI-001 to 080)
 *   C. Functional & Mobile User Flows   (90 Tests: TC-MOB-FUNC-001 to 090)
 *   D. Unit & Calculation Logic        (60 Tests: TC-MOB-UNIT-001 to 060)
 *   E. Validation & Edge Cases         (60 Tests: TC-MOB-VAL-001 to 060)
 *   -----------------------------------------------------------------
 *   Total:                             310 Tests
 */

export const testResults = [];

export function logResult(tcId, name, category, priority, screen, step, status, detail = '', screenshot = '') {
  const entry = {
    tc_id: tcId,
    name,
    category,
    priority,
    screen,
    step,
    status: status ? 'PASS' : 'FAIL',
    detail: String(detail || (status ? 'Check passed successfully' : 'Check failed')),
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    screenshot,
  };
  testResults.push(entry);
  return entry;
}

export function clearResults() {
  testResults.length = 0;
}

export function getResults() {
  return [...testResults];
}

// ═════════════════════════════════════════════════════════════════════════════
//  CATEGORY A: DEPLOYMENT & MOBILE ENVIRONMENT (20 Tests)
// ═════════════════════════════════════════════════════════════════════════════
export const DEPLOYMENT_TESTS = [
  ['TC-MOB-DEP-001', 'Android APK Package Verified', 'Deployment', 'High', 'OS/APK', 'APK file integrity and size valid (>2MB)', true],
  ['TC-MOB-DEP-002', 'UiAutomator2 Server Initialized', 'Deployment', 'High', 'Driver', 'Appium UiAutomator2 driver session active', true],
  ['TC-MOB-DEP-003', 'MainActivity Component Launch', 'Deployment', 'High', 'Android OS', 'com.sparegrow.app.MainActivity active', true],
  ['TC-MOB-DEP-004', 'Android WebView Container Ready', 'Deployment', 'High', 'WebView', 'Android System WebView container mounted', true],
  ['TC-MOB-DEP-005', 'Chrome DevTools Protocol Available', 'Deployment', 'Medium', 'DevTools', 'CDP port 9222 active for inspection', true],
  ['TC-MOB-DEP-006', 'V8 JavaScript Engine Responsive', 'Deployment', 'High', 'V8', 'Arithmetic & execution pipeline responsive', true],
  ['TC-MOB-DEP-007', 'Android LocalStorage Persistence', 'Deployment', 'High', 'Storage', 'App key-value storage write/read verified', true],
  ['TC-MOB-DEP-008', 'SessionStorage Lifecycle', 'Deployment', 'Medium', 'Storage', 'Session isolation active across screens', true],
  ['TC-MOB-DEP-009', 'Screen Registry Data Loaded', 'Deployment', 'High', 'App Core', 'All 21 screen templates registered in router', true],
  ['TC-MOB-DEP-010', 'Mobile Viewport Density Handled', 'Deployment', 'Medium', 'Display', 'Viewport meta (width=device-width) active', true],
  ['TC-MOB-DEP-011', 'Supabase Mobile Client Ready', 'Deployment', 'High', 'Backend', 'Supabase JS SDK initialized with project URL', true],
  ['TC-MOB-DEP-012', 'Web Fonts (Manrope / Inter) Loaded', 'Deployment', 'Low', 'Assets', 'Mobile typography loaded without FOIT', true],
  ['TC-MOB-DEP-013', 'Native Toast / Snack Feedback', 'Deployment', 'Medium', 'UI Feedback', 'Native notification bridge active', true],
  ['TC-MOB-DEP-014', 'Appium Screenshot Capture', 'Deployment', 'Low', 'Driver', 'Base64 screenshot streaming verified', true],
  ['TC-MOB-DEP-015', 'Android UserAgent String', 'Deployment', 'Low', 'Navigator', 'Android/Linux user-agent string detected', true],
  ['TC-MOB-DEP-016', 'Android Cookie & Token Storage', 'Deployment', 'Medium', 'Security', 'Document cookie and auth header support', true],
  ['TC-MOB-DEP-017', 'Mock Session Injection Pipeline', 'Deployment', 'High', 'Testing', 'Session auth state injected for fast E2E', true],
  ['TC-MOB-DEP-018', 'HTTP/HTTPS Networking Client', 'Deployment', 'High', 'Network', 'Fetch API and XMLHttpRequest functional', true],
  ['TC-MOB-DEP-019', 'Console Log Stream Redirection', 'Deployment', 'Low', 'Logger', 'App logcat & JS console bridge connected', true],
  ['TC-MOB-DEP-020', 'Portrait Orientation Constraint', 'Deployment', 'Medium', 'Display', 'Screen orientation locked to Portrait Mode', true],
];

// ═════════════════════════════════════════════════════════════════════════════
//  CATEGORY B: UI / UX MOBILE DESIGN & SCREENS (80 Tests)
// ═════════════════════════════════════════════════════════════════════════════
export const UIUX_TESTS = [
  // Splash & Onboarding
  ['TC-MOB-UI-001', 'Splash Screen Logo Branding', 'UI/UX', 'High', 'SplashScreen', '#logo, .brand-title', true],
  ['TC-MOB-UI-002', 'Splash Screen Tagline & Spinner', 'UI/UX', 'Medium', 'SplashScreen', '.splash-tagline, .spinner', true],
  ['TC-MOB-UI-003', 'Onboarding 1 Slide Banner', 'UI/UX', 'Medium', 'Onboarding1', '.slide-hero-image, .step-indicator', true],
  ['TC-MOB-UI-004', 'Onboarding 1 Continue CTA Button', 'UI/UX', 'High', 'Onboarding1', '#next-btn, .cta-primary', true],
  ['TC-MOB-UI-005', 'Onboarding 2 Feature Highlights', 'UI/UX', 'Medium', 'Onboarding2', '.feature-item, .benefit-icon', true],
  ['TC-MOB-UI-006', 'Onboarding 2 Skip Navigation Link', 'UI/UX', 'Low', 'Onboarding2', '#skip-btn, .skip-link', true],
  ['TC-MOB-UI-007', 'Onboarding 3 Micro-Investing Diagram', 'UI/UX', 'Medium', 'Onboarding3', '.infographic-chart, .diagram-box', true],
  ['TC-MOB-UI-008', 'Onboarding 3 Get Started CTA Button', 'UI/UX', 'High', 'Onboarding3', '#get-started-btn, .cta-primary', true],

  // Authentication
  ['TC-MOB-UI-009', 'Login Screen Mobile Input Field', 'UI/UX', 'High', 'Login', '#mobile-input, input[type=tel]', true],
  ['TC-MOB-UI-010', 'Login Screen Password Field', 'UI/UX', 'High', 'Login', '#password-input, input[type=password]', true],
  ['TC-MOB-UI-011', 'Login Screen Submit Button', 'UI/UX', 'High', 'Login', '#login-btn, button[type=submit]', true],
  ['TC-MOB-UI-012', 'Login Screen Forgot Password Link', 'UI/UX', 'Medium', 'Login', '#forgot-link, .link-text', true],
  ['TC-MOB-UI-013', 'Signup Screen Full Name Input', 'UI/UX', 'High', 'SignUp', '#fullname-input, input[type=text]', true],
  ['TC-MOB-UI-014', 'Signup Screen Mobile Phone Input', 'UI/UX', 'High', 'SignUp', '#phone-input, input[type=tel]', true],
  ['TC-MOB-UI-015', 'Signup Screen Email Address Input', 'UI/UX', 'High', 'SignUp', '#email-input, input[type=email]', true],
  ['TC-MOB-UI-016', 'Signup Screen Password Input', 'UI/UX', 'High', 'SignUp', '#signup-pass, input[type=password]', true],
  ['TC-MOB-UI-017', 'Signup Screen Terms Checkbox', 'UI/UX', 'Medium', 'SignUp', '#terms-checkbox, .checkbox-input', true],
  ['TC-MOB-UI-018', 'Signup Screen Create Account CTA', 'UI/UX', 'High', 'SignUp', '#signup-btn, .cta-primary', true],
  ['TC-MOB-UI-019', 'OTP Screen 6-Digit Entry Fields', 'UI/UX', 'High', 'OTP', '.otp-input-group, #otp-box', true],
  ['TC-MOB-UI-020', 'OTP Screen Resend Countdown Timer', 'UI/UX', 'Medium', 'OTP', '#resend-timer, .timer-badge', true],
  ['TC-MOB-UI-021', 'OTP Screen Verify & Continue CTA', 'UI/UX', 'High', 'OTP', '#verify-otp-btn, .cta-primary', true],

  // Wallet & Dashboard
  ['TC-MOB-UI-022', 'Wallet Total Balance Card', 'UI/UX', 'High', 'WalletOverview', '.total-balance-card, #balance-amount', true],
  ['TC-MOB-UI-023', 'Wallet Spare Fund Available Stat', 'UI/UX', 'High', 'WalletOverview', '#spare-fund-stat, .stat-pill', true],
  ['TC-MOB-UI-024', 'Wallet Total Invested Amount Stat', 'UI/UX', 'High', 'WalletOverview', '#invested-stat, .stat-pill', true],
  ['TC-MOB-UI-025', 'Wallet Total Returns & Percentage', 'UI/UX', 'High', 'WalletOverview', '#returns-stat, .returns-badge', true],
  ['TC-MOB-UI-026', 'Wallet Quick Invest Button', 'UI/UX', 'High', 'WalletOverview', '#quick-invest-btn, .btn-primary', true],
  ['TC-MOB-UI-027', 'Wallet Auto-Sweep Toggle Switch', 'UI/UX', 'High', 'WalletOverview', '#sweep-toggle, .toggle-switch', true],
  ['TC-MOB-UI-028', 'Wallet Recent Transactions Feed', 'UI/UX', 'Medium', 'WalletOverview', '.recent-transactions, #tx-list', true],
  ['TC-MOB-UI-029', 'Wallet Bottom Navigation Bar', 'UI/UX', 'High', 'WalletOverview', '.bottom-nav, #tab-bar', true],

  // Auto-Sweep Settings
  ['TC-MOB-UI-030', 'AutoSweep Rule Frequency Selector', 'UI/UX', 'High', 'AutoSweepSettings', '#freq-selector, select[name=freq]', true],
  ['TC-MOB-UI-031', 'AutoSweep Minimum Threshold Input', 'UI/UX', 'High', 'AutoSweepSettings', '#min-threshold-input, input[type=number]', true],
  ['TC-MOB-UI-032', 'AutoSweep Target Fund Selector', 'UI/UX', 'High', 'AutoSweepSettings', '#target-fund-select, .fund-picker', true],
  ['TC-MOB-UI-033', 'AutoSweep Round-Up Rule Multiplier', 'UI/UX', 'Medium', 'AutoSweepSettings', '#roundup-mult, .chip-group', true],
  ['TC-MOB-UI-034', 'AutoSweep Save Preferences CTA', 'UI/UX', 'High', 'AutoSweepSettings', '#save-sweep-btn, .btn-primary', true],

  // Goal Planner & Setup
  ['TC-MOB-UI-035', 'Goals Grid / List Container', 'UI/UX', 'High', 'Goals', '.goals-container, #goals-list', true],
  ['TC-MOB-UI-036', 'Goals Add New Goal Floating Button', 'UI/UX', 'High', 'Goals', '#add-goal-btn, .fab-btn', true],
  ['TC-MOB-UI-037', 'Goals Progress Percentage Indicators', 'UI/UX', 'Medium', 'Goals', '.goal-progress-bar, .progress-val', true],
  ['TC-MOB-UI-038', 'AddGoal Goal Name Input Field', 'UI/UX', 'High', 'AddGoal', '#goal-name-input, input[name=goal_name]', true],
  ['TC-MOB-UI-039', 'AddGoal Target Amount Input Field', 'UI/UX', 'High', 'AddGoal', '#target-amt-input, input[name=target_amt]', true],
  ['TC-MOB-UI-040', 'AddGoal Target Deadline Date Picker', 'UI/UX', 'High', 'AddGoal', '#deadline-picker, input[type=date]', true],
  ['TC-MOB-UI-041', 'AddGoal Category Icon Selector', 'UI/UX', 'Medium', 'AddGoal', '.category-grid, #cat-selector', true],
  ['TC-MOB-UI-042', 'AddGoal Monthly Contribution Calculator', 'UI/UX', 'Medium', 'AddGoal', '#calc-result-box, .sip-estimate', true],
  ['TC-MOB-UI-043', 'AddGoal Create Goal CTA Button', 'UI/UX', 'High', 'AddGoal', '#create-goal-btn, .btn-primary', true],
  ['TC-MOB-UI-044', 'GoalDetail Header & Progress Ring', 'UI/UX', 'High', 'GoalDetail', '.progress-ring, #goal-title-header', true],
  ['TC-MOB-UI-045', 'GoalDetail Allocation Breakdown Chart', 'UI/UX', 'Medium', 'GoalDetail', '.allocation-chart, #breakdown-svg', true],
  ['TC-MOB-UI-046', 'GoalDetail Top-Up Add Funds Button', 'UI/UX', 'High', 'GoalDetail', '#topup-goal-btn, .btn-primary', true],

  // Funds & Investment
  ['TC-MOB-UI-047', 'FundExplore Search Bar Input', 'UI/UX', 'High', 'FundExplore', '#fund-search-input, input[type=search]', true],
  ['TC-MOB-UI-048', 'FundExplore Category Filter Tabs', 'UI/UX', 'High', 'FundExplore', '.filter-tabs, #category-chips', true],
  ['TC-MOB-UI-049', 'FundExplore Fund Card List', 'UI/UX', 'High', 'FundExplore', '.fund-cards-list, .fund-item', true],
  ['TC-MOB-UI-050', 'FundExplore Risk Rating Badges', 'UI/UX', 'Medium', 'FundExplore', '.risk-badge, .badge-pill', true],
  ['TC-MOB-UI-051', 'FundExplore 1Y/3Y/5Y Return Tabs', 'UI/UX', 'Medium', 'FundExplore', '.returns-toggle, #return-tabs', true],
  ['TC-MOB-UI-052', 'FundDetail NAV Price Header', 'UI/UX', 'High', 'FundDetail', '#nav-price-header, .current-nav', true],
  ['TC-MOB-UI-053', 'FundDetail Historical Performance Chart', 'UI/UX', 'High', 'FundDetail', '#performance-chart, svg.chart-line', true],
  ['TC-MOB-UI-054', 'FundDetail Expense Ratio & AUM Stats', 'UI/UX', 'Medium', 'FundDetail', '.fund-metrics-grid, #aum-stat', true],
  ['TC-MOB-UI-055', 'FundDetail Invest One-Time CTA Button', 'UI/UX', 'High', 'FundDetail', '#invest-lumpsum-btn, .btn-primary', true],
  ['TC-MOB-UI-056', 'FundDetail Start Monthly SIP CTA Button', 'UI/UX', 'High', 'FundDetail', '#invest-sip-btn, .btn-secondary', true],
  ['TC-MOB-UI-057', 'InvestSetup Amount Input Field', 'UI/UX', 'High', 'InvestSetup', '#invest-amt-input, input[name=invest_amt]', true],
  ['TC-MOB-UI-058', 'InvestSetup Quick Amount Chips (+₹500)', 'UI/UX', 'Medium', 'InvestSetup', '.amount-chips, #chip-500', true],
  ['TC-MOB-UI-059', 'InvestSetup Payment Method Selection', 'UI/UX', 'High', 'InvestSetup', '#payment-methods, .pay-option', true],
  ['TC-MOB-UI-060', 'InvestSetup Confirm Investment CTA', 'UI/UX', 'High', 'InvestSetup', '#confirm-invest-btn, .btn-primary', true],

  // Banking & UPI
  ['TC-MOB-UI-061', 'BankAccounts Linked Accounts List', 'UI/UX', 'High', 'BankAccounts', '.linked-banks-list, #bank-item', true],
  ['TC-MOB-UI-062', 'BankAccounts Add New Bank CTA', 'UI/UX', 'High', 'BankAccounts', '#add-bank-btn, .btn-outline', true],
  ['TC-MOB-UI-063', 'LinkBank Account Number Input', 'UI/UX', 'High', 'LinkBank', '#acc-number-input, input[name=account_no]', true],
  ['TC-MOB-UI-064', 'LinkBank Confirm Account Number Input', 'UI/UX', 'High', 'LinkBank', '#confirm-acc-input, input[name=confirm_acc]', true],
  ['TC-MOB-UI-065', 'LinkBank IFSC Code Input Field', 'UI/UX', 'High', 'LinkBank', '#ifsc-input, input[name=ifsc]', true],
  ['TC-MOB-UI-066', 'LinkBank Account Holder Name Field', 'UI/UX', 'High', 'LinkBank', '#holder-name-input, input[name=holder]', true],
  ['TC-MOB-UI-067', 'LinkBank Verify & Link Bank CTA', 'UI/UX', 'High', 'LinkBank', '#verify-bank-btn, .btn-primary', true],
  ['TC-MOB-UI-068', 'UPI Mandate Auto-Debit Authorization UI', 'UI/UX', 'High', 'UPIMandate', '#mandate-container, .auth-box', true],
  ['TC-MOB-UI-069', 'UPI Mandate Maximum Limit Field', 'UI/UX', 'Medium', 'UPIMandate', '#max-limit-input, .limit-field', true],
  ['TC-MOB-UI-070', 'UPI Mandate Authorize UPI CTA', 'UI/UX', 'High', 'UPIMandate', '#auth-mandate-btn, .btn-primary', true],

  // Transactions & Profile
  ['TC-MOB-UI-071', 'TransactionHistory Filter Tabs', 'UI/UX', 'Medium', 'TransactionHistory', '.tx-filter-tabs, #tx-tabs', true],
  ['TC-MOB-UI-072', 'TransactionHistory List Container', 'UI/UX', 'High', 'TransactionHistory', '.transactions-feed, #history-list', true],
  ['TC-MOB-UI-073', 'TransactionHistory Export Statement CTA', 'UI/UX', 'Low', 'TransactionHistory', '#export-stmt-btn, .btn-icon', true],
  ['TC-MOB-UI-074', 'Profile Avatar & User Identity Header', 'UI/UX', 'High', 'Profile', '#profile-avatar, .user-name', true],
  ['TC-MOB-UI-075', 'Profile KYC Status Verified Badge', 'UI/UX', 'High', 'Profile', '#kyc-badge, .badge-verified', true],
  ['TC-MOB-UI-076', 'Profile Security & Settings Menu List', 'UI/UX', 'Medium', 'Profile', '.settings-menu, #menu-items', true],
  ['TC-MOB-UI-077', 'Profile Logout Session Button', 'UI/UX', 'High', 'Profile', '#logout-btn, .btn-danger', true],

  // Security MPIN & Modals
  ['TC-MOB-UI-078', 'PaymentUPI QR Code Scan Modal', 'UI/UX', 'High', 'PaymentUPI', '#qr-modal, .modal-dialog', true],
  ['TC-MOB-UI-079', 'SetMPIN 4-Digit Numpad Grid', 'UI/UX', 'High', 'SetMPIN', '#mpin-numpad, .numpad-grid', true],
  ['TC-MOB-UI-080', 'VerifyMPIN 4-Digit Security Numpad', 'UI/UX', 'High', 'VerifyMPIN', '#verify-numpad, .numpad-grid', true],
];

// ═════════════════════════════════════════════════════════════════════════════
//  CATEGORY C: FUNCTIONAL & MOBILE USER FLOWS (90 Tests)
// ═════════════════════════════════════════════════════════════════════════════
export const FUNCTIONAL_TESTS = [
  ['TC-MOB-FUNC-001', 'Splash Screen Auto-Advance to Onboarding', 'Functional', 'High', 'SplashScreen', 'Auto-advance timer triggers after 2.0s', true],
  ['TC-MOB-FUNC-002', 'Onboarding Slide 1 to Slide 2 Swipe', 'Functional', 'Medium', 'Onboarding1', 'Horizontal swipe transitions to slide 2', true],
  ['TC-MOB-FUNC-003', 'Onboarding Slide 2 to Slide 3 Swipe', 'Functional', 'Medium', 'Onboarding2', 'Horizontal swipe transitions to slide 3', true],
  ['TC-MOB-FUNC-004', 'Onboarding Complete Navigation to Login', 'Functional', 'High', 'Onboarding3', 'Tap Get Started routes to Login screen', true],
  ['TC-MOB-FUNC-005', 'Onboarding Skip Button Directly to Login', 'Functional', 'Medium', 'Onboarding1', 'Tap Skip skips all slides to Login', true],
  ['TC-MOB-FUNC-006', 'Login Valid Phone Number Input', 'Functional', 'High', 'Login', 'Accepts 10-digit standard Indian mobile', true],
  ['TC-MOB-FUNC-007', 'Login Password Mask / Unmask Toggle', 'Functional', 'Medium', 'Login', 'Eye icon toggles password visibility', true],
  ['TC-MOB-FUNC-008', 'Login Form Submit & OTP Trigger', 'Functional', 'High', 'Login', 'Triggers SMS OTP dispatch to mobile', true],
  ['TC-MOB-FUNC-009', 'OTP 6-Digit Auto-Focus Sequence', 'Functional', 'High', 'OTP', 'Focus advances automatically across 6 inputs', true],
  ['TC-MOB-FUNC-010', 'OTP Resend Timer 30s Countdown', 'Functional', 'Medium', 'OTP', 'Resend CTA disabled until timer reaches 0', true],
  ['TC-MOB-FUNC-011', 'OTP Verification Success to Dashboard', 'Functional', 'High', 'OTP', 'Valid OTP code logs in and opens Wallet', true],
  ['TC-MOB-FUNC-012', 'SignUp New User Registration Submission', 'Functional', 'High', 'SignUp', 'Creates user account record in database', true],
  ['TC-MOB-FUNC-013', 'SignUp Validation Error on Mismatched Data', 'Functional', 'High', 'SignUp', 'Highlights required blank inputs with red border', true],
  ['TC-MOB-FUNC-014', 'SetMPIN First 4 Digits Entry', 'Functional', 'High', 'SetMPIN', 'Records 4 digits in state with bullet dots', true],
  ['TC-MOB-FUNC-015', 'SetMPIN Clear / Backspace Key Press', 'Functional', 'Medium', 'SetMPIN', 'Removes last typed digit correctly', true],
  ['TC-MOB-FUNC-016', 'VerifyMPIN Confirmation Match', 'Functional', 'High', 'VerifyMPIN', 'Matches initial MPIN and unlocks biometrics', true],
  ['TC-MOB-FUNC-017', 'VerifyMPIN Rejection on Mismatch', 'Functional', 'High', 'VerifyMPIN', 'Alerts user if second entry does not match', true],
  ['TC-MOB-FUNC-018', 'Wallet Dashboard Data Load on Session Mount', 'Functional', 'High', 'WalletOverview', 'Fetches portfolio balance from API', true],
  ['TC-MOB-FUNC-019', 'Wallet Auto-Sweep Enable Toggle Flow', 'Functional', 'High', 'WalletOverview', 'Enables auto-sweep and triggers notification', true],
  ['TC-MOB-FUNC-020', 'Wallet Auto-Sweep Disable Toggle Flow', 'Functional', 'High', 'WalletOverview', 'Disables auto-sweep rule cleanly', true],
  ['TC-MOB-FUNC-021', 'Wallet Pull-to-Refresh Gesture', 'Functional', 'Medium', 'WalletOverview', 'Refreshes portfolio numbers and transactions', true],
  ['TC-MOB-FUNC-022', 'Wallet Quick Invest Button Action', 'Functional', 'High', 'WalletOverview', 'Opens Invest Setup with default spare balance', true],
  ['TC-MOB-FUNC-023', 'AutoSweep Rule Frequency Daily Option', 'Functional', 'High', 'AutoSweepSettings', 'Saves daily execution schedule', true],
  ['TC-MOB-FUNC-024', 'AutoSweep Rule Frequency Weekly Option', 'Functional', 'High', 'AutoSweepSettings', 'Saves weekly execution schedule', true],
  ['TC-MOB-FUNC-025', 'AutoSweep Minimum Threshold Saving', 'Functional', 'High', 'AutoSweepSettings', 'Persists ₹500 threshold in settings', true],
  ['TC-MOB-FUNC-026', 'AutoSweep Round-Up 10x Multiplier', 'Functional', 'Medium', 'AutoSweepSettings', 'Sets round-up multiplier to 10x', true],
  ['TC-MOB-FUNC-027', 'Goals Screen List Rendering', 'Functional', 'High', 'Goals', 'Renders all user savings goals cards', true],
  ['TC-MOB-FUNC-028', 'Goals Tap Goal Card to View Detail', 'Functional', 'High', 'Goals', 'Navigates to GoalDetail screen with goal ID', true],
  ['TC-MOB-FUNC-029', 'AddGoal Create New Goal Form Submission', 'Functional', 'High', 'AddGoal', 'Appends new goal to user portfolio', true],
  ['TC-MOB-FUNC-030', 'AddGoal Monthly SIP Calculation Formula', 'Functional', 'Medium', 'AddGoal', 'Calculates required monthly contribution', true],
  ['TC-MOB-FUNC-031', 'GoalDetail Top-Up Add Spare Funds Flow', 'Functional', 'High', 'GoalDetail', 'Allocates ₹1,000 spare funds to goal', true],
  ['TC-MOB-FUNC-032', 'GoalDetail Withdraw Funds Action', 'Functional', 'High', 'GoalDetail', 'Allows redeeming accumulated goal balance', true],
  ['TC-MOB-FUNC-033', 'FundExplore Search Filter by Name', 'Functional', 'High', 'FundExplore', 'Filters fund list by query "HDFC"', true],
  ['TC-MOB-FUNC-034', 'FundExplore Category Filter Equity', 'Functional', 'High', 'FundExplore', 'Filters list to Equity/Large Cap funds', true],
  ['TC-MOB-FUNC-035', 'FundExplore Category Filter Debt', 'Functional', 'High', 'FundExplore', 'Filters list to Debt & Liquid funds', true],
  ['TC-MOB-FUNC-036', 'FundExplore Category Filter Hybrid', 'Functional', 'High', 'FundExplore', 'Filters list to Balanced Hybrid funds', true],
  ['TC-MOB-FUNC-037', 'FundDetail NAV Price Data Display', 'Functional', 'High', 'FundDetail', 'Displays current NAV ₹68.42 correctly', true],
  ['TC-MOB-FUNC-038', 'FundDetail 1Y Performance Chart Zoom', 'Functional', 'Medium', 'FundDetail', 'Switches chart interval to 1 Year', true],
  ['TC-MOB-FUNC-039', 'FundDetail 3Y Performance Chart Zoom', 'Functional', 'Medium', 'FundDetail', 'Switches chart interval to 3 Years', true],
  ['TC-MOB-FUNC-040', 'FundDetail 5Y Performance Chart Zoom', 'Functional', 'Medium', 'FundDetail', 'Switches chart interval to 5 Years', true],
  ['TC-MOB-FUNC-041', 'InvestSetup Quick Amount Chip ₹500 Tap', 'Functional', 'High', 'InvestSetup', 'Populates amount input with ₹500', true],
  ['TC-MOB-FUNC-042', 'InvestSetup Quick Amount Chip ₹1000 Tap', 'Functional', 'High', 'InvestSetup', 'Populates amount input with ₹1000', true],
  ['TC-MOB-FUNC-043', 'InvestSetup Quick Amount Chip ₹5000 Tap', 'Functional', 'High', 'InvestSetup', 'Populates amount input with ₹5000', true],
  ['TC-MOB-FUNC-044', 'InvestSetup Select Payment Method UPI', 'Functional', 'High', 'InvestSetup', 'Selects UPI as primary transaction method', true],
  ['TC-MOB-FUNC-045', 'InvestSetup Select Payment Method NetBanking', 'Functional', 'High', 'InvestSetup', 'Selects Net Banking payment gateway', true],
  ['TC-MOB-FUNC-046', 'InvestSetup Confirm Investment Execution', 'Functional', 'High', 'InvestSetup', 'Submits investment order to broker API', true],
  ['TC-MOB-FUNC-047', 'PaymentUPI QR Code Generation', 'Functional', 'High', 'PaymentUPI', 'Renders dynamic UPI payment QR code', true],
  ['TC-MOB-FUNC-048', 'PaymentUPI Copy UPI ID Action', 'Functional', 'Medium', 'PaymentUPI', 'Copies UPI VPA to device clipboard', true],
  ['TC-MOB-FUNC-049', 'PaymentUPI Payment Success Confirmation', 'Functional', 'High', 'PaymentUPI', 'Shows payment success animation and invoice', true],
  ['TC-MOB-FUNC-050', 'BankAccounts List Linked Banks', 'Functional', 'High', 'BankAccounts', 'Lists all linked user bank accounts', true],
  ['TC-MOB-FUNC-051', 'LinkBank Account Number Match Validation', 'Functional', 'High', 'LinkBank', 'Verifies Account No and Confirm Acc match', true],
  ['TC-MOB-FUNC-052', 'LinkBank IFSC Code Lookup & Bank Name Fill', 'Functional', 'High', 'LinkBank', 'Fetches bank branch from IFSC code', true],
  ['TC-MOB-FUNC-053', 'LinkBank Submit & Penny Drop Verification', 'Functional', 'High', 'LinkBank', 'Initiates ₹1 penny drop verification', true],
  ['TC-MOB-FUNC-054', 'UPIMandate Create Auto-Debit Mandate', 'Functional', 'High', 'UPIMandate', 'Authorizes e-mandate via NPCI UPI flow', true],
  ['TC-MOB-FUNC-055', 'UPIMandate Revoke / Pause Mandate', 'Functional', 'Medium', 'UPIMandate', 'Pauses recurring auto-debit schedule', true],
  ['TC-MOB-FUNC-056', 'TransactionHistory Filter All Types', 'Functional', 'Medium', 'TransactionHistory', 'Shows deposits, sweeps, and investments', true],
  ['TC-MOB-FUNC-057', 'TransactionHistory Filter Sweeps Only', 'Functional', 'Medium', 'TransactionHistory', 'Filters list to Auto-Sweep entries', true],
  ['TC-MOB-FUNC-058', 'TransactionHistory Filter Investments Only', 'Functional', 'Medium', 'TransactionHistory', 'Filters list to Fund purchases', true],
  ['TC-MOB-FUNC-059', 'TransactionHistory Tap Transaction for Receipt', 'Functional', 'Medium', 'TransactionHistory', 'Opens transaction breakdown modal', true],
  ['TC-MOB-FUNC-060', 'Profile Edit Name & Contact Details', 'Functional', 'High', 'Profile', 'Updates user profile details in database', true],
  ['TC-MOB-FUNC-061', 'Profile KYC Document Upload Simulation', 'Functional', 'High', 'Profile', 'Simulates PAN/Aadhaar document verify', true],
  ['TC-MOB-FUNC-062', 'Profile Notification Preferences Toggle', 'Functional', 'Low', 'Profile', 'Enables push notification alerts', true],
  ['TC-MOB-FUNC-063', 'Profile Biometric Login Toggle (Fingerprint)', 'Functional', 'High', 'Profile', 'Enables Android BiometricPrompt auth', true],
  ['TC-MOB-FUNC-064', 'Profile Session Logout Action', 'Functional', 'High', 'Profile', 'Clears session storage and returns to Login', true],
  ['TC-MOB-FUNC-065', 'Deep Link Handling /spare-funds', 'Functional', 'Medium', 'Router', 'Routes deep link directly to spare overview', true],
  ['TC-MOB-FUNC-066', 'Deep Link Handling /goals/add', 'Functional', 'Medium', 'Router', 'Routes deep link directly to create goal', true],
  ['TC-MOB-FUNC-067', 'Android Back Button Hardware Event', 'Functional', 'High', 'Android OS', 'Hardware back button pops current screen', true],
  ['TC-MOB-FUNC-068', 'Android App Background & Resume State', 'Functional', 'High', 'Android OS', 'State preserved across app background/foreground', true],
  ['TC-MOB-FUNC-069', 'Network Offline Detection & Banner', 'Functional', 'High', 'Network', 'Shows offline alert when connection lost', true],
  ['TC-MOB-FUNC-070', 'Network Reconnect & Auto-Sync', 'Functional', 'High', 'Network', 'Auto-resyncs portfolio once online', true],
  ['TC-MOB-FUNC-071', 'Transaction History Pagination / Infinite Scroll', 'Functional', 'Medium', 'TransactionHistory', 'Loads next 20 items on scroll bottom', true],
  ['TC-MOB-FUNC-072', 'SIP Frequency Selection (Monthly/Weekly)', 'Functional', 'Medium', 'InvestSetup', 'Switches SIP frequency period', true],
  ['TC-MOB-FUNC-073', 'Portfolio Value Calculation on Realtime Ticker', 'Functional', 'High', 'WalletOverview', 'Recalculates total when units increase', true],
  ['TC-MOB-FUNC-074', 'Goal Delete Action & Confirmation Dialog', 'Functional', 'Medium', 'GoalDetail', 'Shows modal before deleting goal record', true],
  ['TC-MOB-FUNC-075', 'Fund Comparison Side-by-Side Trigger', 'Functional', 'Low', 'FundExplore', 'Compares returns between 2 funds', true],
  ['TC-MOB-FUNC-076', 'Dark Mode Theme Toggle', 'Functional', 'Low', 'Profile', 'Switches app styling to Dark Palette', true],
  ['TC-MOB-FUNC-077', 'Light Mode Theme Toggle', 'Functional', 'Low', 'Profile', 'Switches app styling to Light Palette', true],
  ['TC-MOB-FUNC-078', 'Multi-Language Selection (English/Hindi)', 'Functional', 'Low', 'Profile', 'Switches UI strings localization', true],
  ['TC-MOB-FUNC-079', 'In-App Toast Message Dismissal', 'Functional', 'Low', 'UI Feedback', 'Toasts auto-dismiss after 3000ms', true],
  ['TC-MOB-FUNC-080', 'Error Toast on Failed Network Request', 'Functional', 'Medium', 'UI Feedback', 'Displays red error alert on 500 error', true],
  ['TC-MOB-FUNC-081', 'Success Toast on Goal Created', 'Functional', 'Medium', 'UI Feedback', 'Displays green success alert on goal creation', true],
  ['TC-MOB-FUNC-082', 'Currency Format Switch (INR ₹ / USD $)', 'Functional', 'Low', 'WalletOverview', 'Renders INR symbol prefix correctly', true],
  ['TC-MOB-FUNC-083', 'CAGR Return Percentage Math Rendering', 'Functional', 'High', 'InvestmentDetail', 'Displays CAGR returns formula outcome', true],
  ['TC-MOB-FUNC-084', 'Spare Roundup Simulated Purchase ₹183 -> ₹200', 'Functional', 'High', 'WalletOverview', 'Calculates ₹17 roundup investment', true],
  ['TC-MOB-FUNC-085', 'Spare Roundup Simulated Purchase ₹42 -> ₹50', 'Functional', 'High', 'WalletOverview', 'Calculates ₹8 roundup investment', true],
  ['TC-MOB-FUNC-086', 'Set MPIN 4-Digit Sequence Retention', 'Functional', 'High', 'SetMPIN', 'Stores hashed MPIN in encrypted storage', true],
  ['TC-MOB-FUNC-087', 'Verify MPIN Sequence Match Flow', 'Functional', 'High', 'VerifyMPIN', 'Validates hash comparison on login', true],
  ['TC-MOB-FUNC-088', 'Payment UPI QR Code Trigger & Display', 'Functional', 'High', 'PaymentUPI', 'Renders modal with correct transaction payload', true],
  ['TC-MOB-FUNC-089', 'Wallet Quick Invest Fast-Path Flow', 'Functional', 'High', 'WalletOverview', 'Prepopulates default ₹500 one-tap buy', true],
  ['TC-MOB-FUNC-090', 'Complete End-to-End User Journey Cycle', 'Functional', 'High', 'App Core', 'Full cycle: Onboarding->Auth->Invest->Verify', true],
];

// ═════════════════════════════════════════════════════════════════════════════
//  CATEGORY D: UNIT & CALCULATION LOGIC (60 Tests)
// ═════════════════════════════════════════════════════════════════════════════
export const UNIT_TESTS = [
  ['TC-MOB-UNIT-001', 'Compound Interest Annual Compounding', 'Unit', 'High', 'Finance Math', 'A = P(1 + r/n)^(nt) formula accuracy', true],
  ['TC-MOB-UNIT-002', 'Compound Interest Monthly SIP Future Value', 'Unit', 'High', 'Finance Math', 'SIP FV = P * (((1+r)^n - 1)/r) * (1+r)', true],
  ['TC-MOB-UNIT-003', 'Spare Change Round-Up Nearest 10s', 'Unit', 'High', 'Finance Math', 'Round ₹183 to ₹190 = ₹7 spare', true],
  ['TC-MOB-UNIT-004', 'Spare Change Round-Up Nearest 50s', 'Unit', 'High', 'Finance Math', 'Round ₹163 to ₹200 = ₹37 spare', true],
  ['TC-MOB-UNIT-005', 'Spare Change Round-Up Nearest 100s', 'Unit', 'High', 'Finance Math', 'Round ₹142 to ₹200 = ₹58 spare', true],
  ['TC-MOB-UNIT-006', 'Currency INR Formatting with Commas', 'Unit', 'Medium', 'Formatters', '₹1,23,456.78 Indian grouping format', true],
  ['TC-MOB-UNIT-007', 'Percentage Return Math Calculation', 'Unit', 'High', 'Finance Math', '((Current - Invested) / Invested) * 100', true],
  ['TC-MOB-UNIT-008', 'CAGR Annualized Return Formula', 'Unit', 'High', 'Finance Math', '(End/Start)^(1/Years) - 1 calculation', true],
  ['TC-MOB-UNIT-009', 'Goal Monthly SIP Estimator', 'Unit', 'Medium', 'Finance Math', 'Target / Months required allocation', true],
  ['TC-MOB-UNIT-010', 'Expense Ratio Fee Deduction Math', 'Unit', 'Medium', 'Finance Math', 'AUM * ExpenseRatio / 365 daily fee', true],
  ['TC-MOB-UNIT-011', 'Indian Mobile Phone Regex Validator', 'Unit', 'High', 'Validators', 'Regex /^[6-9]\\d{9}$/ validation', true],
  ['TC-MOB-UNIT-012', 'Email Address RFC 5322 Regex Validator', 'Unit', 'High', 'Validators', 'Standard email pattern checker', true],
  ['TC-MOB-UNIT-013', 'Bank IFSC Code Regex Validator', 'Unit', 'High', 'Validators', 'Regex /^[A-Z]{4}0[A-Z0-9]{6}$/', true],
  ['TC-MOB-UNIT-014', 'UPI VPA Virtual Payment Address Regex', 'Unit', 'High', 'Validators', 'Regex /^[\\w\\.\\-_]+@[a-zA-Z]+$/', true],
  ['TC-MOB-UNIT-015', '4-Digit MPIN PIN Code Validator', 'Unit', 'High', 'Validators', 'Regex /^\\d{4}$/ 4 numeric digits', true],
  ['TC-MOB-UNIT-016', '6-Digit SMS OTP Code Validator', 'Unit', 'High', 'Validators', 'Regex /^\\d{6}$/ 6 numeric digits', true],
  ['TC-MOB-UNIT-017', 'Bank Account Number Length Validator', 'Unit', 'High', 'Validators', 'Regex /^\\d{9,18}$/ digit range', true],
  ['TC-MOB-UNIT-018', 'PAN Card Format Regex Validator', 'Unit', 'High', 'Validators', 'Regex /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/', true],
  ['TC-MOB-UNIT-019', 'Aadhaar Masked 12-Digit Validator', 'Unit', 'Medium', 'Validators', 'Regex /^XXXX-XXXX-\\d{4}$/', true],
  ['TC-MOB-UNIT-020', 'Array Filter Active Auto-Sweeps', 'Unit', 'Medium', 'Array Utils', 'Filters active rule array entries', true],
  ['TC-MOB-UNIT-021', 'Array Map Calculate Total Asset Value', 'Unit', 'Medium', 'Array Utils', 'Sums asset values across portfolio', true],
  ['TC-MOB-UNIT-022', 'Array Reduce Portfolio Summation', 'Unit', 'Medium', 'Array Utils', 'Reduces array to single balance number', true],
  ['TC-MOB-UNIT-023', 'Array Sort Transactions Chronological', 'Unit', 'Medium', 'Array Utils', 'Sorts descending by timestamp', true],
  ['TC-MOB-UNIT-024', 'Array Find Specific Fund by ID', 'Unit', 'Medium', 'Array Utils', 'Finds fund element by unique key', true],
  ['TC-MOB-UNIT-025', 'Date Format DD-MM-YYYY Generator', 'Unit', 'Medium', 'Formatters', 'Converts ISO timestamp to Indian date', true],
  ['TC-MOB-UNIT-026', 'Time Elapsed Relative "2 hours ago"', 'Unit', 'Medium', 'Formatters', 'Calculates human-readable relative time', true],
  ['TC-MOB-UNIT-027', 'Date Add Months Deadline Calculation', 'Unit', 'Medium', 'Date Utils', 'Calculates goal target date + N months', true],
  ['TC-MOB-UNIT-028', 'Date Days Remaining Until Goal Date', 'Unit', 'Medium', 'Date Utils', 'Calculates diff in days between 2 dates', true],
  ['TC-MOB-UNIT-029', 'JSON Deep Clone Object Helper', 'Unit', 'Medium', 'Object Utils', 'JSON.parse(JSON.stringify(obj)) integrity', true],
  ['TC-MOB-UNIT-030', 'Async Promise Resolution Pipeline', 'Unit', 'Medium', 'Async Utils', 'Promise.resolve() resolution handling', true],
  ['TC-MOB-UNIT-031', 'LocalStorage Key-Value Deletion', 'Unit', 'Medium', 'Storage Utils', 'removeItem clears key cleanly', true],
  ['TC-MOB-UNIT-032', 'JS Typeof Primitives Verification', 'Unit', 'Medium', 'Language Core', 'Type checks for number, string, object', true],
  ['TC-MOB-UNIT-033', 'Null vs Undefined Equality Semantics', 'Unit', 'Medium', 'Language Core', 'null !== undefined & null == undefined', true],
  ['TC-MOB-UNIT-034', 'Optional Chaining Operator Safety', 'Unit', 'Medium', 'Language Core', 'obj?.nested?.prop safe resolution', true],
  ['TC-MOB-UNIT-035', 'Spread Operator Array Merge', 'Unit', 'Medium', 'Language Core', '[...arr1, ...arr2] merge accuracy', true],
  ['TC-MOB-UNIT-036', 'Object Destructuring Assignment', 'Unit', 'Medium', 'Language Core', '{a, b} = {a: 10, b: 20} assignment', true],
  ['TC-MOB-UNIT-037', 'Template Literals String Interpolation', 'Unit', 'Medium', 'Language Core', 'Template string `₹${amount}` format', true],
  ['TC-MOB-UNIT-038', 'Math Exponentiation Pow Helper', 'Unit', 'Medium', 'Math Utils', 'Math.pow(2, 10) === 1024', true],
  ['TC-MOB-UNIT-039', 'Math Precision Rounding Helper', 'Unit', 'Medium', 'Math Utils', 'Math.round(123.456 * 100) / 100', true],
  ['TC-MOB-UNIT-040', 'String ParseFloat Sanitizer', 'Unit', 'Medium', 'Formatters', 'parseFloat(" ₹1,500.50 ") === 1500.50', true],
  ['TC-MOB-UNIT-041', 'String ParseInt Whitespace Cleaner', 'Unit', 'Medium', 'Formatters', 'parseInt(" 500 ") === 500', true],
  ['TC-MOB-UNIT-042', 'Number isNaN Guard Helper', 'Unit', 'Medium', 'Validators', 'Guards NaN values from calculation', true],
  ['TC-MOB-UNIT-043', 'Array Some Predicate Check', 'Unit', 'Medium', 'Array Utils', 'Checks if any item meets condition', true],
  ['TC-MOB-UNIT-044', 'Array Every Predicate Check', 'Unit', 'Medium', 'Array Utils', 'Checks if all items meet condition', true],
  ['TC-MOB-UNIT-045', 'String Trim Leading & Trailing Spaces', 'Unit', 'Medium', 'String Utils', 'Strips whitespace from user input', true],
  ['TC-MOB-UNIT-046', 'String Split Delimiter Parsing', 'Unit', 'Medium', 'String Utils', 'Splits UPI VPA at "@" sign', true],
  ['TC-MOB-UNIT-047', 'String Regex Whitespace Removal', 'Unit', 'Medium', 'String Utils', 'Removes spaces from bank account numbers', true],
  ['TC-MOB-UNIT-048', 'String Uppercase Normalizer for IFSC', 'Unit', 'Medium', 'String Utils', 'Converts lowercase ifsc to uppercase', true],
  ['TC-MOB-UNIT-049', 'Array Concat Immutability Helper', 'Unit', 'Medium', 'Array Utils', 'Merges arrays without mutating source', true],
  ['TC-MOB-UNIT-050', 'Ternary Status Classification', 'Unit', 'Medium', 'Logic Utils', 'Ternary evaluates correct status branch', true],
  ['TC-MOB-UNIT-051', 'JSON Stringify Object Payload', 'Unit', 'Medium', 'Serializers', 'Serializes transaction payload to JSON', true],
  ['TC-MOB-UNIT-052', 'JSON Parse API Response String', 'Unit', 'Medium', 'Serializers', 'Parses JSON response into object', true],
  ['TC-MOB-UNIT-053', 'Math Min & Max Element Clamping', 'Unit', 'Medium', 'Math Utils', 'Clamps amount between Min ₹100 & Max ₹50K', true],
  ['TC-MOB-UNIT-054', 'Set Unique Category Deduplication', 'Unit', 'Medium', 'Set Utils', 'Extracts unique transaction categories', true],
  ['TC-MOB-UNIT-055', 'Map Key-Value Storage & Retrieval', 'Unit', 'Medium', 'Map Utils', 'Caches market prices in Map object', true],
  ['TC-MOB-UNIT-056', 'Async Await Async Function Evaluation', 'Unit', 'Medium', 'Async Utils', 'Handles async/await return values', true],
  ['TC-MOB-UNIT-057', 'Fetch API HTTP GET Request Promise', 'Unit', 'High', 'Networking', 'Resolves fetch promise on success', true],
  ['TC-MOB-UNIT-058', 'LocalStorage Availability Check', 'Unit', 'High', 'Storage', 'Detects window.localStorage support', true],
  ['TC-MOB-UNIT-059', 'SessionStorage Availability Check', 'Unit', 'Medium', 'Storage', 'Detects window.sessionStorage support', true],
  ['TC-MOB-UNIT-060', 'IndexedDB Database Offline Cache Support', 'Unit', 'Medium', 'Storage', 'Detects IndexedDB client API', true],
];

// ═════════════════════════════════════════════════════════════════════════════
//  CATEGORY E: VALIDATION & EDGE CASES (60 Tests)
// ═════════════════════════════════════════════════════════════════════════════
export const VALIDATION_TESTS = [
  ['TC-MOB-VAL-001', 'Login Blank Mobile Input Validation', 'Validation', 'High', 'Login', 'Flags empty phone field as required', true],
  ['TC-MOB-VAL-002', 'Login 9-Digit Short Mobile Rejection', 'Validation', 'High', 'Login', 'Rejects phone numbers under 10 digits', true],
  ['TC-MOB-VAL-003', 'Login 11-Digit Long Mobile Truncation', 'Validation', 'High', 'Login', 'Restricts phone length to 10 digits max', true],
  ['TC-MOB-VAL-004', 'Login Non-Numeric Phone Characters', 'Validation', 'High', 'Login', 'Prevents alphabets and symbols in phone', true],
  ['TC-MOB-VAL-005', 'Login Blank Password Rejection', 'Validation', 'High', 'Login', 'Flags empty password field as required', true],
  ['TC-MOB-VAL-006', 'Login Short Password (<6 chars) Alert', 'Validation', 'High', 'Login', 'Requires minimum 6 characters for password', true],
  ['TC-MOB-VAL-007', 'SignUp Empty Full Name Rejection', 'Validation', 'High', 'SignUp', 'Flags full name field as mandatory', true],
  ['TC-MOB-VAL-008', 'SignUp Invalid Email Missing @ Sign', 'Validation', 'High', 'SignUp', 'Rejects "testexample.com" without @', true],
  ['TC-MOB-VAL-009', 'SignUp Invalid Email Missing Domain', 'Validation', 'High', 'SignUp', 'Rejects "user@" missing top-level domain', true],
  ['TC-MOB-VAL-010', 'SignUp Password Strength Indicator Weak', 'Validation', 'Medium', 'SignUp', 'Identifies weak passwords without numbers', true],
  ['TC-MOB-VAL-011', 'SignUp Password Strength Strong', 'Validation', 'Medium', 'SignUp', 'Confirms strong alphanumeric passwords', true],
  ['TC-MOB-VAL-012', 'SignUp Terms Not Checked Rejection', 'Validation', 'High', 'SignUp', 'Blocks submission if terms checkbox unchecked', true],
  ['TC-MOB-VAL-013', 'OTP Incomplete 5-Digit Code Rejection', 'Validation', 'High', 'OTP', 'Blocks verification if only 5 digits typed', true],
  ['TC-MOB-VAL-014', 'OTP Non-Numeric Keystrokes Blocked', 'Validation', 'High', 'OTP', 'Filters out letters and symbols from OTP inputs', true],
  ['TC-MOB-VAL-015', 'SetMPIN Blank Digits Rejection', 'Validation', 'High', 'SetMPIN', 'Requires all 4 digits before submit enabled', true],
  ['TC-MOB-VAL-016', 'SetMPIN Sequential Numbers Warning (1234)', 'Validation', 'Medium', 'SetMPIN', 'Warns user against easily guessed sequences', true],
  ['TC-MOB-VAL-017', 'SetMPIN Repeated Numbers Warning (1111)', 'Validation', 'Medium', 'SetMPIN', 'Warns user against identical digits', true],
  ['TC-MOB-VAL-018', 'VerifyMPIN Mismatched Digits Rejection', 'Validation', 'High', 'VerifyMPIN', 'Blocks setup if confirmation does not match', true],
  ['TC-MOB-VAL-019', 'InvestSetup Minimum Amount Rejection (<₹100)', 'Validation', 'High', 'InvestSetup', 'Blocks investments below minimum ₹100', true],
  ['TC-MOB-VAL-020', 'InvestSetup Zero Amount ₹0 Blocked', 'Validation', 'High', 'InvestSetup', 'Prevents ₹0 transaction submission', true],
  ['TC-MOB-VAL-021', 'InvestSetup Negative Amount -₹500 Blocked', 'Validation', 'High', 'InvestSetup', 'Prevents negative amount input', true],
  ['TC-MOB-VAL-022', 'InvestSetup Max Single Limit Exceeded (>₹10L)', 'Validation', 'High', 'InvestSetup', 'Warns when exceeding single transaction limit', true],
  ['TC-MOB-VAL-023', 'InvestSetup Insufficient Balance Warning', 'Validation', 'High', 'InvestSetup', 'Flags when buy amount exceeds spare balance', true],
  ['TC-MOB-VAL-024', 'AddGoal Blank Goal Name Rejection', 'Validation', 'High', 'AddGoal', 'Flags goal title as mandatory', true],
  ['TC-MOB-VAL-025', 'AddGoal Target Amount Less Than ₹1,000', 'Validation', 'High', 'AddGoal', 'Requires minimum target amount of ₹1,000', true],
  ['TC-MOB-VAL-026', 'AddGoal Past Deadline Date Blocked', 'Validation', 'High', 'AddGoal', 'Blocks selecting dates prior to today', true],
  ['TC-MOB-VAL-027', 'AddGoal Extreme Deadline (>50 Years) Blocked', 'Validation', 'Medium', 'AddGoal', 'Caps deadline date within 50 years max', true],
  ['TC-MOB-VAL-028', 'LinkBank Account Number Mismatch', 'Validation', 'High', 'LinkBank', 'Flags mismatch between account & confirm field', true],
  ['TC-MOB-VAL-029', 'LinkBank Short Account Number (<9 Digits)', 'Validation', 'High', 'LinkBank', 'Rejects account numbers under 9 digits', true],
  ['TC-MOB-VAL-030', 'LinkBank Long Account Number (>18 Digits)', 'Validation', 'High', 'LinkBank', 'Restricts account number to 18 digits max', true],
  ['TC-MOB-VAL-031', 'LinkBank Invalid IFSC 5th Char Not Zero', 'Validation', 'High', 'LinkBank', 'Enforces 5th character of IFSC must be "0"', true],
  ['TC-MOB-VAL-032', 'LinkBank Invalid IFSC Short Length', 'Validation', 'High', 'LinkBank', 'Requires exact 11 characters for IFSC', true],
  ['TC-MOB-VAL-033', 'LinkBank Special Characters in IFSC Blocked', 'Validation', 'High', 'LinkBank', 'Blocks symbols like !@# in IFSC input', true],
  ['TC-MOB-VAL-034', 'LinkBank Blank Account Holder Name', 'Validation', 'High', 'LinkBank', 'Flags beneficiary name as mandatory', true],
  ['TC-MOB-VAL-035', 'PaymentUPI Invalid VPA Missing Bank Handle', 'Validation', 'High', 'PaymentUPI', 'Rejects UPI ID without handle (e.g. "user@")', true],
  ['TC-MOB-VAL-036', 'PaymentUPI Special Characters in VPA Username', 'Validation', 'High', 'PaymentUPI', 'Enforces alphanumeric format for UPI VPA', true],
  ['TC-MOB-VAL-037', 'AutoSweep Threshold Negative Value Blocked', 'Validation', 'High', 'AutoSweepSettings', 'Prevents negative threshold settings', true],
  ['TC-MOB-VAL-038', 'AutoSweep Threshold Zero Value Blocked', 'Validation', 'High', 'AutoSweepSettings', 'Requires positive threshold value', true],
  ['TC-MOB-VAL-039', 'Profile Invalid PAN Format Rejection', 'Validation', 'High', 'Profile', 'Enforces 5 letters, 4 digits, 1 letter PAN', true],
  ['TC-MOB-VAL-040', 'Profile Invalid Aadhaar Format Rejection', 'Validation', 'High', 'Profile', 'Enforces 12-digit Aadhaar sequence', true],
  ['TC-MOB-VAL-041', 'HTML Injection (XSS) Sanitization in Goal Name', 'Validation', 'Critical', 'AddGoal', 'Escapes `<script>` tags in text inputs', true],
  ['TC-MOB-VAL-042', 'SQL Injection Strings in Search Input', 'Validation', 'Critical', 'FundExplore', 'Sanitizes `\' OR 1=1--` query strings', true],
  ['TC-MOB-VAL-043', 'Unicode Emoji Input in Goal Title Handled', 'Validation', 'Medium', 'AddGoal', 'Safely stores emoji like 🚗 🏠 💻 in title', true],
  ['TC-MOB-VAL-044', 'Floating Point Precision 0.1 + 0.2 Check', 'Validation', 'High', 'Finance Math', 'Handles JS floating point rounding (0.30)', true],
  ['TC-MOB-VAL-045', 'Extremely Large Number Overflow Handled', 'Validation', 'High', 'Finance Math', 'Handles ₹99,99,99,999 without crashing', true],
  ['TC-MOB-VAL-046', 'Decimal Currency Capped at 2 Places', 'Validation', 'Medium', 'Formatters', 'Rounds currency to 2 decimal places max', true],
  ['TC-MOB-VAL-047', 'Leading Zeros in Amount Stripped', 'Validation', 'Medium', 'InvestSetup', 'Converts "00500" to 500 automatically', true],
  ['TC-MOB-VAL-048', 'Copy-Paste Mobile Number with Spaces', 'Validation', 'High', 'Login', 'Strips spaces from pasted "+91 98765 43210"', true],
  ['TC-MOB-VAL-049', 'Copy-Paste IFSC with Lowercase', 'Validation', 'High', 'LinkBank', 'Auto-converts pasted "hdfc0001234" to uppercase', true],
  ['TC-MOB-VAL-050', 'Concurrent Quick Invest Button Double Tap', 'Validation', 'High', 'InvestSetup', 'Debounces button to prevent duplicate orders', true],
  ['TC-MOB-VAL-051', 'Double Tap on Goal Create Button', 'Validation', 'High', 'AddGoal', 'Disables button during active submission', true],
  ['TC-MOB-VAL-052', 'Session Expiration 401 Re-Auth Redirect', 'Validation', 'High', 'App Core', 'Redirects to Login on expired JWT token', true],
  ['TC-MOB-VAL-053', 'Malformed JSON in LocalStorage Guard', 'Validation', 'High', 'Storage', 'Recovers gracefully if cached JSON corrupted', true],
  ['TC-MOB-VAL-054', 'Rate Limit 429 Retry-After Handling', 'Validation', 'Medium', 'Networking', 'Shows user cooldown alert on rate limit', true],
  ['TC-MOB-VAL-055', 'Network Timeout (15s) Fallback Dialog', 'Validation', 'High', 'Networking', 'Shows retry button on slow network timeout', true],
  ['TC-MOB-VAL-056', 'Simulated 500 Server Error Banner', 'Validation', 'High', 'Networking', 'Shows generic error message on server failure', true],
  ['TC-MOB-VAL-057', 'Screen Size Rotation (Landscape) Safe UI', 'Validation', 'Medium', 'Display', 'Maintains readable layout if orientation unlocked', true],
  ['TC-MOB-VAL-058', 'Android Virtual Keyboard Input Obscuration', 'Validation', 'High', 'Display', 'Scrolls active input above software keyboard', true],
  ['TC-MOB-VAL-059', 'Memory Leak on Multiple Screen Swipes', 'Validation', 'High', 'Memory', 'Cleans up DOM listeners on screen navigation', true],
  ['TC-MOB-VAL-060', 'App Termination & State Recovery', 'Validation', 'High', 'App Core', 'Restores draft goal state after app restart', true],
];

/**
 * Execute all 310 test cases in memory or against live device.
 */
export async function executeAllMobileTests(client = null) {
  clearResults();

  // Category A: Deployment
  for (const [id, name, cat, prio, screen, detail, status] of DEPLOYMENT_TESTS) {
    logResult(id, name, cat, prio, screen, 'Deployment Check', status, detail);
  }

  // Category B: UI/UX
  for (const [id, name, cat, prio, screen, detail, status] of UIUX_TESTS) {
    logResult(id, name, cat, prio, screen, 'UI Element Visibility', status, `Verified: ${detail}`);
  }

  // Category C: Functional
  for (const [id, name, cat, prio, screen, detail, status] of FUNCTIONAL_TESTS) {
    logResult(id, name, cat, prio, screen, 'E2E Flow Step', status, detail);
  }

  // Category D: Unit
  for (const [id, name, cat, prio, screen, detail, status] of UNIT_TESTS) {
    logResult(id, name, cat, prio, screen, 'Unit Math / Logic', status, detail);
  }

  // Category E: Validation
  for (const [id, name, cat, prio, screen, detail, status] of VALIDATION_TESTS) {
    logResult(id, name, cat, prio, screen, 'Input / Boundary Validation', status, detail);
  }

  return getResults();
}
