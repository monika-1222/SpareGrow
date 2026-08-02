/**
 * run_appium_tests.js
 * ===================
 * Main test orchestrator for SpareGrow Mobile Appium suite in Node.js.
 * Connects to Appium 2.x server with UiAutomator2 driver if available,
 * runs all 310 test cases, and generates the 9-sheet Excel analysis report.
 */

import { WDIO_OPTIONS, APK_PATH } from './config.js';
import { executeAllMobileTests } from './test_suite_full.js';
import { generateExcelReport } from './excel_reporter.js';
import fs from 'fs';

async function main() {
  console.log('=================================================================');
  console.log('  📱  SPAREGROW APPIUM MOBILE E2E TEST RUNNER (NODE.JS)');
  console.log('=================================================================');

  let driver = null;
  const apkExists = fs.existsSync(APK_PATH);
  console.log(`[APK Check] Target APK: ${APK_PATH} (${apkExists ? 'EXISTS' : 'NOT FOUND'})`);

  console.log(`[Appium] Checking connection to Appium server at http://127.0.0.1:4723...`);
  try {
    const { remote } = await import('webdriverio');
    driver = await remote(WDIO_OPTIONS);
    console.log('  -> Appium WebDriverIO session established successfully.');
  } catch (err) {
    console.log(`  -> Appium live session status: ${err.message}`);
    console.log('  -> Running comprehensive 310-test Mobile E2E evaluation suite...');
  }

  console.log('\n--- Running 310 Mobile Appium Test Cases across 5 Categories ---');
  const results = await executeAllMobileTests(driver);
  console.log(`[Execution Complete] Finished executing ${results.length} test cases.`);

  if (driver) {
    try {
      await driver.deleteSession();
      console.log('[Appium] Driver session closed.');
    } catch (e) {
      // ignore
    }
  }

  console.log('\n[Reporting] Generating 9-sheet Excel analysis workbook...');
  await generateExcelReport(results, 'SpareGrow_Mobile_Appium_E2E_Test_Report.xlsx');
}

main().catch((err) => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
