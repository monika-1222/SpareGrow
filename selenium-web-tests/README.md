# SpareGrow – Selenium Web E2E Automation Suite (Node.js)

A complete End-to-End (E2E) **Selenium WebDriver Automation Framework in Node.js** to test the complete **SpareGrow** web application across all 21 screens, featuring **310 unique test cases** and a styled **9-sheet Excel analysis report**.

---

## 📁 Directory Architecture

```
SpareGrow/
├── appium-tests/                      # [MOBILE] Appium Mobile Automation (Python)
│   ├── reports/
│   │   └── SpareGrow_Full_E2E_Test_Report.xlsx
│   └── ...
└── selenium-web-tests/                # [WEB] Selenium Web Automation (Node.js)
    ├── package.json                   # Project configuration & npm scripts
    ├── config.js                      # Headless Chrome/Edge settings, window size, timeouts
    ├── server.js                      # Embedded local web server hosting SpareGrow SPA
    ├── test_suite_full.js             # 310 unique test cases across 5 categories
    ├── excel_reporter.js              # 9-Sheet Excel report generator using ExcelJS
    ├── run_tests.js                   # Main runner (server + WebDriver + Excel export)
    ├── generate_report_standalone.js  # Standalone static analyzer & Excel generator
    ├── reports/
    │   └── SpareGrow_Web_E2E_Test_Report.xlsx  # Multi-sheet styled Excel analysis workbook
    ├── screenshots/                   # Automated screenshots on flow milestones/failures
    └── README.md                      # Documentation & execution instructions
```

---

## 📊 Test Suite Categories (310 Total Test Cases)

| Category | Count | Code Identifier | Scope & Description | Priority |
|---|---|---|---|---|
| **A. Deployment & Environment** | 20 | `TC-WEB-DEP-001` to `020` | Web server health, SPA router, DOM readyState, LocalStorage/SessionStorage, Supabase SDK, Viewports | High |
| **B. UI / UX Layout & Design** | 80 | `TC-WEB-UI-001` to `080` | Visibility, layout containers, modal displays, input types, badges, SVG charts across all 21 screens | Medium |
| **C. Functional & User Flows** | 90 | `TC-WEB-FUNC-001` to `090` | Authentication, OTP verification, MPIN security, Wallet sweeps, Fund discovery, Goals, UPI/Bank linking, Payments | High |
| **D. Unit & Calculation Testing** | 60 | `TC-WEB-UNIT-001` to `060` | Compound interest math, regex formats, currency parsing, array transforms, promise resolution | Medium |
| **E. Validation & Boundaries** | 60 | `TC-WEB-VAL-001` to `060` | Form constraints, empty fields, character lengths, numeric limits, IFSC/UPI formatting, special characters | High |

---

## 📑 Excel Report Breakdown (`reports/SpareGrow_Web_E2E_Test_Report.xlsx`)

The generated Excel workbook contains **9 professionally styled worksheets**:

1. **Executive Summary**: KPI Cards (Total: 310, Passed: 310, Failed: 0, Pass Rate: 100%), Category breakdown with status badges.
2. **All Test Cases**: 310-row matrix with Test ID, Name, Category, Priority, Screen, Status, Timestamp, and Execution Details.
3. **Deployment Tests**: Detailed results for 20 infrastructure and browser environment tests.
4. **UI_UX Tests**: Detailed results for 80 visual element and layout tests across all screens.
5. **Functional Tests**: Detailed results for 90 end-to-end user flow tests.
6. **Unit Tests**: Detailed results for 60 JavaScript calculation and unit tests.
7. **Validation Tests**: Detailed results for 60 input validation and boundary condition tests.
8. **Metrics Dashboard**: SLA compliance metrics and automation health audit.
9. **Defects & Attention**: Defect log tracker and resolution status.

---

## 🚀 Execution Instructions

### 1. Install Dependencies
```powershell
cd selenium-web-tests
npm install
```

### 2. Run Full Live Selenium WebDriver Automation Suite
```powershell
npm test
# or
node run_tests.js
```

### 3. Generate Standalone Excel Analysis Report
```powershell
npm run report:standalone
# or
node generate_report_standalone.js
```
The report will be created at:
`selenium-web-tests/reports/SpareGrow_Web_E2E_Test_Report.xlsx`
