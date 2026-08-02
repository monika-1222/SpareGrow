/**
 * run_load_test.js
 * ================
 * Main executable orchestrator for SpareGrow 100 VU 1-Minute Baseline / Load Testing.
 * CLI options:
 *   --vus=100        (Default: 100 Virtual Users)
 *   --duration=60    (Default: 60 seconds / 1 minute)
 */

import { startServer } from './server.js';
import { executeLoadTest } from './load_test_engine.js';
import { generateLoadExcelReport } from './excel_reporter.js';
import { SERVER_PORT, BASE_URL } from './config.js';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    virtualUsers: 100,
    durationSeconds: 60,
    targetUrl: BASE_URL
  };

  for (const arg of args) {
    if (arg.startsWith('--vus=')) {
      options.virtualUsers = parseInt(arg.split('=')[1], 10) || 100;
    } else if (arg.startsWith('--duration=')) {
      options.durationSeconds = parseInt(arg.split('=')[1], 10) || 60;
    } else if (arg.startsWith('--url=')) {
      options.targetUrl = arg.split('=')[1];
    }
  }
  return options;
}

async function main() {
  const cliOptions = parseArgs();

  console.log('\n======================================================================');
  console.log('  🚀  SPAREGROW BASELINE / LOAD TESTING SUITE');
  console.log('======================================================================');
  console.log(`  Target Concurrency : ${cliOptions.virtualUsers} Virtual Users (VUs)`);
  console.log(`  Duration           : ${cliOptions.durationSeconds} Seconds (1 Minute Continuous)`);
  console.log(`  Target URL         : ${cliOptions.targetUrl}`);
  console.log('======================================================================\n');

  // 1. Start Express Application Server
  let server = null;
  try {
    server = await startServer(SERVER_PORT);
  } catch (err) {
    console.error('[Server Error]', err.message);
  }

  // 2. Execute High-Concurrency Load Test
  const testResults = await executeLoadTest(cliOptions);

  // 3. Print Rich CLI Summary Matrix
  const s = testResults.summary;
  console.log('======================================================================');
  console.log('  📊  LOAD TESTING RESULTS & STATISTICAL METRICS SUMMARY');
  console.log('======================================================================');
  console.log(`  • Virtual Users (Concurrency) : ${s.virtualUsers} VUs`);
  console.log(`  • Test Duration               : ${s.durationSeconds} seconds`);
  console.log(`  • Total Requests Sent         : ${s.totalRequests.toLocaleString()} requests`);
  console.log(`  • Throughput / Speed          : ${s.overallRps} req/sec`);
  console.log(`  • Success Rate                : ${(100 - s.errorRatePercent).toFixed(2)}% (${s.successfulRequests.toLocaleString()} OK / ${s.failedRequests} Errors)`);
  console.log(`  • Data Transferred            : ${s.totalBytesTransferredMB} MB`);
  console.log('----------------------------------------------------------------------');
  console.log('  ⏱️  RESPONSE TIME LATENCY DISTRIBUTION:');
  console.log(`  • Fastest Response (Min)      : ${s.min} ms`);
  console.log(`  • Average Response Time       : ${s.avg} ms`);
  console.log(`  • Median Latency (p50)        : ${s.median} ms`);
  console.log(`  • 90th Percentile (p90)       : ${s.p90} ms`);
  console.log(`  • 95th Percentile (p95)       : ${s.p95} ms`);
  console.log(`  • 99th Percentile (p99)       : ${s.p99} ms`);
  console.log(`  • Slowest Response (Max)      : ${s.max} ms`);
  console.log('======================================================================\n');

  // 4. Generate 7-Sheet Excel Report
  console.log('[Report] Generating 7-sheet Excel analysis workbook...');
  await generateLoadExcelReport(testResults, 'SpareGrow_Baseline_Load_Test_Report.xlsx');

  // 5. Clean up server if we spawned it
  if (server) {
    server.close();
    console.log('[Server] Load testing server shut down.');
  }

  console.log('[Complete] Baseline / Load Test finished successfully.\n');
}

main().catch((err) => {
  console.error('[Fatal]', err);
  process.exit(1);
});
