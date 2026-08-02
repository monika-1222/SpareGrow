import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.join(__dirname, 'downloadable-excel-reports');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const FILES_TO_PACKAGE = [
  {
    src: path.join(__dirname, 'selenium-web-tests', 'reports', 'SpareGrow_Web_E2E_Test_Report.xlsx'),
    dest: path.join(targetDir, 'SpareGrow_1_Selenium_Web_E2E_Test_Report.xlsx')
  },
  {
    src: path.join(__dirname, 'appium-mobile-tests', 'reports', 'SpareGrow_Mobile_Appium_E2E_Test_Report.xlsx'),
    dest: path.join(targetDir, 'SpareGrow_2_Appium_Mobile_E2E_Test_Report.xlsx')
  },
  {
    src: path.join(__dirname, 'load-tests', 'reports', 'SpareGrow_Baseline_Load_Test_Report.xlsx'),
    dest: path.join(targetDir, 'SpareGrow_3_Baseline_Load_Test_Report.xlsx')
  },
  {
    src: path.join(__dirname, 'Vulnerability Test Results', 'findings.xlsx'),
    dest: path.join(targetDir, 'SpareGrow_4_Application_Security_Test_Report.xlsx')
  }
];

console.log('Preparing 4 downloadable Excel test reports...');
FILES_TO_PACKAGE.forEach(({ src, dest }, idx) => {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    const size = (fs.statSync(dest).size / 1024).toFixed(1);
    console.log(`[${idx + 1}/4] Copied -> ${path.basename(dest)} (${size} KB)`);
  } else {
    console.warn(`[!] File not found: ${src}`);
  }
});
console.log('Done! All 4 files ready in downloadable-excel-reports/');
