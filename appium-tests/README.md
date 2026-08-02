# SpareGrow – Appium E2E Automation Test Suite (310+ Tests)

A complete End-to-End (E2E) Appium & Automated Testing framework for the **SpareGrow** Android mobile application, featuring **310 unique test cases** and multi-tab Excel reporting.

---

## 📁 Directory Structure

```
appium-tests/
├── appium_config.py               # Appium server & device configuration
├── test_suite_full.py             # 310 unique test cases across 5 categories
├── run_tests_full.py              # Full automated test runner with live Appium & Excel generator
├── generate_report_standalone.py  # Standalone static analyzer & Excel report builder
├── reports/
│   └── SpareGrow_Full_E2E_Test_Report.xlsx  # 9-Sheet styled Excel analysis report
├── screenshots/                   # Automated failure and verification screenshots
└── requirements.txt               # Python package dependencies
```

---

## 📊 Test Suite Categories (310 Total Test Cases)

| Category | Count | Code Identifier | Description | Priority |
|---|---|---|---|---|
| **A. Deployment & Environment** | 20 | `TC-DEP-001` to `020` | Server connectivity, WebView context, LocalStorage/SessionStorage, Capacitor bridge, router functions | High |
| **B. UI / UX Design & Layout** | 80 | `TC-UI-001` to `080` | Element visibility, layout containers, modal displays, input types, icons, responsive controls | Medium |
| **C. Functional & E2E Flows** | 90 | `TC-FUNC-001` to `090` | Authentication, MPIN setup/verification, Wallet sweeps, Fund discovery, Goal creation, UPI/Bank linking, Payments | High |
| **D. Unit & Utility Testing** | 60 | `TC-UNIT-001` to `060` | Compound interest math, regex formats, currency parsing, array transforms, promise resolution | Medium |
| **E. Validation & Boundary Testing** | 60 | `TC-VAL-001` to `060` | Form constraints, empty fields, character lengths, numeric limits, IFSC/UPI formatting, special characters | High |

---

## 📈 Excel Report Overview (`reports/SpareGrow_Full_E2E_Test_Report.xlsx`)

The generated Excel workbook contains **9 styled sheets**:
1. **Executive Summary**: KPI cards (Total, Passed, Failed, Pass Rate, Coverage), Category overview table with status badges and remarks.
2. **All Test Cases**: Complete 310-row matrix with test name, category, priority, screen, status, timestamp, and verdict.
3. **Deployment Tests**: Detailed results for deployment and infrastructure tests.
4. **UI_UX Tests**: Detailed results for 80 UI layout and visibility tests.
5. **Functional Tests**: Detailed results for 90 end-to-end user journey tests.
6. **Unit Tests**: Detailed results for 60 unit calculation and utility logic tests.
7. **Validation Tests**: Detailed results for 60 boundary and input validation tests.
8. **Metrics Dashboard**: Native embedded Bar Chart (Tests by Category) and Pie Chart (Pass vs. Fail breakdown).
9. **Defects & Attention**: Highlighted section for any flagged issues or test failures.

---

## 🚀 Execution Instructions

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **Appium 2.x** (`npm install -g appium uiautomator2`)
- **Android SDK & Command-Line Tools** (`ANDROID_HOME` configured)
- Install Python requirements:
  ```powershell
  pip install -r appium-tests/requirements.txt
  ```

### 2. Running the Complete Appium Suite (Live Emulator / Device)
```powershell
python appium-tests/run_tests_full.py
```

### 3. Generating Standalone Excel Report
```powershell
python appium-tests/generate_report_standalone.py
```
Report will be created at:
`appium-tests/reports/SpareGrow_Full_E2E_Test_Report.xlsx`
