/**
 * collect_reports.js
 * ==================
 * Gathers and organizes all Excel test reports from all 4 testing suites
 * into a single unified directory `all-excel-reports/` ready for GitHub Actions artifact upload.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.join(__dirname, 'all-excel-reports');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const REPORT_MAPPINGS = [
  {
    source: path.join(__dirname, 'selenium-web-tests', 'reports', 'SpareGrow_Web_E2E_Test_Report.xlsx'),
    dest: path.join(targetDir, '01_SpareGrow_Selenium_Web_E2E_Test_Report.xlsx'),
    name: '1. Selenium Web E2E Test Report (310 Tests, 9 Sheets)'
  },
  {
    source: path.join(__dirname, 'appium-mobile-tests', 'reports', 'SpareGrow_Mobile_Appium_E2E_Test_Report.xlsx'),
    dest: path.join(targetDir, '02_SpareGrow_Appium_Mobile_E2E_Test_Report.xlsx'),
    name: '2. Appium Mobile E2E Test Report (310 Tests, 9 Sheets)'
  },
  {
    source: path.join(__dirname, 'load-tests', 'reports', 'SpareGrow_Baseline_Load_Test_Report.xlsx'),
    dest: path.join(targetDir, '03_SpareGrow_Baseline_Load_Test_Report.xlsx'),
    name: '3. Baseline & Load Test Report (100 VUs, 60s, 7 Sheets)'
  },
  {
    source: path.join(__dirname, 'Vulnerability Test Results', 'findings.xlsx'),
    dest: path.join(targetDir, '04_SpareGrow_Security_Findings_Report.xlsx'),
    name: '4. Application Security & Penetration Findings (305 Tests, 4 Sheets)'
  },
  {
    source: path.join(__dirname, 'Vulnerability Test Results', 'endpoint-inventory.xlsx'),
    dest: path.join(targetDir, '05_SpareGrow_API_Endpoint_Inventory.xlsx'),
    name: '5. API Endpoint Security Catalog & Inventory'
  }
];

console.log('======================================================================');
console.log('  📦  COLLECTING ALL TEST EXCEL REPORTS FOR ARTIFACT UPLOAD');
console.log('======================================================================');

let collected = 0;
for (const item of REPORT_MAPPINGS) {
  if (fs.existsSync(item.source)) {
    fs.copyFileSync(item.source, item.dest);
    const stat = fs.statSync(item.dest);
    const sizeKb = (stat.size / 1024).toFixed(1);
    console.log(`  ✅ [COPIED] ${item.name} (${sizeKb} KB)`);
    collected++;
  } else {
    console.warn(`  ⚠️ [MISSING] Source report not found: ${item.source}`);
  }
}

console.log('----------------------------------------------------------------------');
console.log(`  Total Reports Collected: ${collected} / ${REPORT_MAPPINGS.length}`);
console.log(`  Target Folder: ${targetDir}`);
console.log('======================================================================');
