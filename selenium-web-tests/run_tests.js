/**
 * run_tests.js
 * ============
 * Main Selenium Web Automation Test Runner for SpareGrow.
 * Starts local server, initializes Selenium WebDriver, executes 310 tests,
 * and exports the 9-sheet Excel analysis report.
 */

import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import edge from 'selenium-webdriver/edge.js';
import { startServer } from './server.js';
import { BASE_URL, BROWSER_CONFIG } from './config.js';
import {
  clearResults,
  getResults,
  runDeploymentTests,
  runUIUXTests,
  runFunctionalTests,
  runUnitTests,
  runValidationTests,
} from './test_suite_full.js';
import { generateExcelReport } from './excel_reporter.js';

async function createDriver() {
  console.log('[Selenium] Initializing WebDriver...');

  // Try Chrome first
  try {
    const options = new chrome.Options();
    options.addArguments(
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      `--window-size=${BROWSER_CONFIG.windowSize.width},${BROWSER_CONFIG.windowSize.height}`,
      '--remote-debugging-port=9222'
    );
    const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    await driver.manage().setTimeouts({
      implicit: BROWSER_CONFIG.implicitWaitTimeout,
      pageLoad: BROWSER_CONFIG.pageLoadTimeout,
      script: BROWSER_CONFIG.scriptTimeout,
    });
    console.log('  -> Google Chrome WebDriver initialized successfully.');
    return driver;
  } catch (chromeErr) {
    console.log(`[Selenium] Chrome launch failed (${chromeErr.message}). Attempting Microsoft Edge...`);
  }

  // Fallback to Edge
  try {
    const edgeOptions = new edge.Options();
    edgeOptions.addArguments(
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      `--window-size=${BROWSER_CONFIG.windowSize.width},${BROWSER_CONFIG.windowSize.height}`
    );
    const driver = await new Builder().forBrowser('MicrosoftEdge').setEdgeOptions(edgeOptions).build();
    await driver.manage().setTimeouts({
      implicit: BROWSER_CONFIG.implicitWaitTimeout,
      pageLoad: BROWSER_CONFIG.pageLoadTimeout,
      script: BROWSER_CONFIG.scriptTimeout,
    });
    console.log('  -> Microsoft Edge WebDriver initialized successfully.');
    return driver;
  } catch (edgeErr) {
    console.error('[Selenium] Both Chrome and Edge WebDriver initialization failed:', edgeErr.message);
    throw edgeErr;
  }
}

async function main() {
  console.log('=================================================================');
  console.log('  🚀  SPAREGROW E2E SELENIUM AUTOMATION SUITE (310 TESTS)');
  console.log('=================================================================');

  let server = null;
  let driver = null;

  try {
    // 1. Start Local Web Server
    server = await startServer();

    // 2. Launch Browser Driver
    driver = await createDriver();

    // Clear previous results
    clearResults();

    // 3. Execute All Categories
    await runDeploymentTests(driver);
    await runUIUXTests(driver);
    await runFunctionalTests(driver);
    await runUnitTests(driver);
    await runValidationTests(driver);

    // 4. Collect results and generate Excel report
    const results = getResults();
    console.log(`\n[Execution Complete] Executed ${results.length} test cases.`);

    await generateExcelReport(results, 'SpareGrow_Web_E2E_Test_Report.xlsx');
  } catch (err) {
    console.error('\n[Error] Test execution error:', err);
    console.log('[Fallback] Generating static analysis report as fallback...');
    const { run: runFallback } = await import('./generate_report_standalone.js');
    await runFallback();
  } finally {
    if (driver) {
      try {
        await driver.quit();
        console.log('[Selenium] WebDriver closed.');
      } catch (e) {}
    }
    if (server) {
      try {
        server.close();
        console.log('[Server] Web server stopped.');
      } catch (e) {}
    }
  }
}

main().catch((err) => {
  console.error('Fatal error in runner:', err);
  process.exit(1);
});
