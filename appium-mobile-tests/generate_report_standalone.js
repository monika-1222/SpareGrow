/**
 * generate_report_standalone.js
 * ==============================
 * Instantly executes all 310 SpareGrow Mobile Appium test cases and generates the 9-sheet Excel analysis report.
 */

import { executeAllMobileTests } from './test_suite_full.js';
import { generateExcelReport } from './excel_reporter.js';

console.log('=================================================================');
console.log('  📱  SPAREGROW MOBILE APPIUM TEST RUNNER (NODE.JS)');
console.log('=================================================================');
console.log('[1/2] Executing 310 End-to-End Mobile Test Cases...');

const results = await executeAllMobileTests();
console.log(`[2/2] Test execution complete. Total results: ${results.length}`);

console.log('[Report] Generating 9-sheet Excel analysis report...');
const reportPath = await generateExcelReport(results, 'SpareGrow_Mobile_Appium_E2E_Test_Report.xlsx');
console.log(`[Success] Finished. File saved to: ${reportPath}`);
