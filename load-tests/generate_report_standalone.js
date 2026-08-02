/**
 * generate_report_standalone.js
 * ==============================
 * Fast standalone generator for SpareGrow Baseline / Load Testing Excel Report.
 */

import { executeLoadTest } from './load_test_engine.js';
import { generateLoadExcelReport } from './excel_reporter.js';
import { startServer } from './server.js';
import { SERVER_PORT } from './config.js';

async function main() {
  console.log('--- Generating Standalone Load Testing Report ---');
  let server = null;
  try {
    server = await startServer(SERVER_PORT);
  } catch (e) {
    // ignore
  }

  const results = await executeLoadTest({ virtualUsers: 100, durationSeconds: 60 });
  const reportPath = await generateLoadExcelReport(results, 'SpareGrow_Baseline_Load_Test_Report.xlsx');

  if (server) server.close();
  console.log(`[Success] Standalone report generated at: ${reportPath}`);
}

main().catch(console.error);
