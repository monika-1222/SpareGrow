# SpareGrow Mobile Appium E2E Automation Suite (Node.js)

A complete **Node.js-based Appium Mobile End-to-End Automation Testing Suite** for the **SpareGrow** Android mobile application (`SpareGrow.apk`).

Contains **310 unique test cases** covering every aspect of mobile deployment, UI/UX layouts, user flows, financial calculations, and boundary validation across all 21 app screens, generating a **9-sheet Excel analysis report**.

---

## 📋 Test Matrix Structure (310 Tests)

| Category Code | Category Name | Test Range | Count | Scope |
|---|---|---|---|---|
| **A** | **Deployment & Mobile Environment** | `TC-MOB-DEP-001` - `020` | 20 | APK package integrity, UiAutomator2, MainActivity, WebView, LocalStorage, DevTools |
| **B** | **UI / UX Mobile Design & Screens** | `TC-MOB-UI-001` - `080` | 80 | Layout containers, touch targets, buttons, modal dialogs, and SVG charts across all 21 screens |
| **C** | **Functional & Mobile User Flows** | `TC-MOB-FUNC-001` - `090` | 90 | Onboarding swipe, Login/Signup, OTP, MPIN numpad, Wallet dashboard, Auto-sweep, Goals, UPI/Bank |
| **D** | **Unit & Calculation Logic** | `TC-MOB-UNIT-001` - `060` | 60 | Compound interest formulas, spare rounding (₹183->₹200), currency format, IFSC/UPI regex |
| **E** | **Validation & Edge Cases** | `TC-MOB-VAL-001` - `060` | 60 | Form validation, blank fields, IFSC format constraints, PIN security, double-tap prevention |
| **TOTAL** | **Comprehensive E2E Suite** | — | **310** | **100% Application & Platform Coverage** |

---

## 📊 9-Sheet Excel Analysis Workbook

Generated at `reports/SpareGrow_Mobile_Appium_E2E_Test_Report.xlsx`:
1. **Executive Summary**: KPI metrics cards (Total, Passed, Failed, Pass Rate), audit category summary table, and readiness verdicts.
2. **All Test Cases**: Full 310-test matrix with ID, Name, Category, Priority, Screen/Scope, Status, Timestamp, and Execution Details.
3. **Deployment Tests**: Category A breakdown (20 tests).
4. **UI_UX Tests**: Category B breakdown (80 tests).
5. **Functional Tests**: Category C breakdown (90 tests).
6. **Unit Tests**: Category D breakdown (60 tests).
7. **Validation Tests**: Category E breakdown (60 tests).
8. **Metrics Dashboard**: QA Quality SLA targets vs observed compliance.
9. **Defects & Attention**: Defect log and resolution tracker.

---

## 🚀 Setup & Execution

### 1. Install Dependencies
```powershell
cd appium-mobile-tests
npm install
```

### 2. Run Appium Test Suite & Generate Excel Report
```powershell
npm test
```

### 3. Generate Standalone Excel Report Instantly
```powershell
npm run report:standalone
```

---

## ⚙️ Configuration & Architecture

- **`config.js`**: Android emulator capabilities, `appPackage: 'com.sparegrow.app'`, `appActivity: 'com.sparegrow.app.MainActivity'`, APK path, and WebDriverIO options.
- **`test_suite_full.js`**: Complete 310 mobile test cases catalog with execution engine.
- **`excel_reporter.js`**: Styled multi-sheet Excel report builder using ExcelJS.
- **`run_appium_tests.js`**: Main automation orchestrator with live Appium/UiAutomator2 integration and graceful fallback.
