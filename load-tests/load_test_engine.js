/**
 * load_test_engine.js
 * ====================
 * High-performance asynchronous load testing engine simulating concurrent Virtual Users (VUs).
 * Tracks high-resolution response times, percentiles, throughput (RPS), and second-by-second metrics.
 */

import http from 'http';
import { performance } from 'perf_hooks';
import { TEST_ENDPOINTS, DEFAULT_LOAD_CONFIG } from './config.js';

// HTTP Agent with keepAlive for realistic connection pooling
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 300,
  maxFreeSockets: 100,
  timeout: 10000
});

/**
 * Calculates statistical percentiles from an array of latencies
 */
export function calculatePercentiles(latencies) {
  if (!latencies || latencies.length === 0) {
    return { min: 0, max: 0, avg: 0, median: 0, p75: 0, p90: 0, p95: 0, p99: 0 };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);

  const getPercentile = (p) => {
    const index = Math.ceil((p / 100) * count) - 1;
    return Number(sorted[Math.max(0, Math.min(index, count - 1))].toFixed(2));
  };

  return {
    min: Number(sorted[0].toFixed(2)),
    max: Number(sorted[count - 1].toFixed(2)),
    avg: Number((sum / count).toFixed(2)),
    median: getPercentile(50),
    p75: getPercentile(75),
    p90: getPercentile(90),
    p95: getPercentile(95),
    p99: getPercentile(99)
  };
}

/**
 * Sends a single HTTP request and measures latency
 */
function sendRequest(endpoint, baseUrl) {
  return new Promise((resolve) => {
    const urlObj = new URL(endpoint.path.startsWith('/#') ? '/' : endpoint.path, baseUrl);
    const postData = endpoint.body ? JSON.stringify(endpoint.body) : null;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: endpoint.method || 'GET',
      agent: httpAgent,
      headers: {
        'User-Agent': 'SpareGrow-LoadTest-VU/1.0',
        'Accept': '*/*',
        ...(postData ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        } : {})
      },
      timeout: 8000
    };

    const startTime = performance.now();
    let bytesReceived = 0;

    const req = http.request(options, (res) => {
      res.on('data', (chunk) => {
        bytesReceived += chunk.length;
      });

      res.on('end', () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        resolve({
          statusCode: res.statusCode,
          duration: Number(duration.toFixed(2)),
          bytes: bytesReceived,
          success: res.statusCode >= 200 && res.statusCode < 400,
          endpoint: endpoint.name,
          path: endpoint.path,
          method: endpoint.method
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const endTime = performance.now();
      resolve({
        statusCode: 408,
        duration: Number((endTime - startTime).toFixed(2)),
        bytes: 0,
        success: false,
        error: 'Timeout',
        endpoint: endpoint.name,
        path: endpoint.path,
        method: endpoint.method
      });
    });

    req.on('error', (err) => {
      const endTime = performance.now();
      resolve({
        statusCode: 500,
        duration: Number((endTime - startTime).toFixed(2)),
        bytes: 0,
        success: false,
        error: err.message,
        endpoint: endpoint.name,
        path: endpoint.path,
        method: endpoint.method
      });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

/**
 * Weighted random endpoint selector
 */
function pickWeightedEndpoint(endpoints) {
  const totalWeight = endpoints.reduce((sum, e) => sum + (e.weight || 1), 0);
  let random = Math.random() * totalWeight;
  for (const ep of endpoints) {
    if (random < (ep.weight || 1)) return ep;
    random -= (ep.weight || 1);
  }
  return endpoints[0];
}

/**
 * Executes full concurrent load test
 */
export async function executeLoadTest(options = {}) {
  const config = { ...DEFAULT_LOAD_CONFIG, ...options };
  const { virtualUsers, durationSeconds, rampUpSeconds, targetUrl, endpoints = TEST_ENDPOINTS } = config;

  console.log('======================================================================');
  console.log('  ⚡  SPAREGROW BASELINE / LOAD TESTING ENGINE');
  console.log('======================================================================');
  console.log(`  Target Base URL   : ${targetUrl}`);
  console.log(`  Virtual Users     : ${virtualUsers} Concurrent VUs`);
  console.log(`  Duration          : ${durationSeconds} seconds (1 minute continuous)`);
  console.log(`  Ramp-up Time      : ${rampUpSeconds} seconds`);
  console.log(`  Endpoints Tested  : ${endpoints.length} unique endpoints/routes`);
  console.log('======================================================================\n');

  const testStartTime = Date.now();
  const testEndTime = testStartTime + durationSeconds * 1000;

  const allRequests = [];
  const statusCodes = {};
  const perEndpointStats = {};
  const timelineSeconds = [];

  for (const ep of endpoints) {
    perEndpointStats[ep.name] = {
      name: ep.name,
      path: ep.path,
      method: ep.method,
      total: 0,
      passed: 0,
      failed: 0,
      durations: [],
      bytes: 0
    };
  }

  let isRunning = true;
  let currentSecond = 0;
  let activeVUs = 0;

  // Real-time live monitor ticker (runs every second)
  const ticker = setInterval(() => {
    if (!isRunning) return;
    currentSecond++;
    const now = Date.now();
    const secWindowStart = now - 1000;
    const recentReqs = allRequests.filter((r) => r.timestamp >= secWindowStart);
    const rps = recentReqs.length;
    const avgLatency = recentReqs.length > 0
      ? (recentReqs.reduce((a, b) => a + b.duration, 0) / recentReqs.length).toFixed(1)
      : 0;

    timelineSeconds.push({
      second: currentSecond,
      timestamp: new Date().toLocaleTimeString(),
      activeVUs,
      requestsCount: rps,
      avgDurationMs: Number(avgLatency),
      errorsCount: recentReqs.filter((r) => !r.success).length
    });

    const elapsed = Math.min(currentSecond, durationSeconds);
    const progressPct = ((elapsed / durationSeconds) * 100).toFixed(0);
    const bar = '█'.repeat(Math.floor(progressPct / 5)) + '░'.repeat(20 - Math.floor(progressPct / 5));

    process.stdout.write(
      `\r  [${bar}] ${progressPct}% | Time: ${elapsed}s/${durationSeconds}s | VUs: ${activeVUs}/${virtualUsers} | Throughput: ${rps} req/sec | Latency: ${avgLatency}ms`
    );
  }, 1000);

  // Virtual User worker routine
  const runVirtualUser = async (vuId) => {
    activeVUs++;
    // Stagger ramp-up
    const rampDelay = (vuId / virtualUsers) * (rampUpSeconds * 1000);
    await new Promise((r) => setTimeout(r, rampDelay));

    while (Date.now() < testEndTime) {
      const endpoint = pickWeightedEndpoint(endpoints);
      const reqStart = Date.now();
      const res = await sendRequest(endpoint, targetUrl);
      const reqRecord = {
        vuId,
        timestamp: reqStart,
        ...res
      };

      allRequests.push(reqRecord);

      // Track status codes
      statusCodes[res.statusCode] = (statusCodes[res.statusCode] || 0) + 1;

      // Track per endpoint stats
      const epStat = perEndpointStats[endpoint.name];
      if (epStat) {
        epStat.total++;
        if (res.success) epStat.passed++;
        else epStat.failed++;
        epStat.durations.push(res.duration);
        epStat.bytes += res.bytes || 0;
      }

      // Micro-pause (think time 10-30ms) for natural concurrency
      const thinkTime = 10 + Math.floor(Math.random() * 20);
      await new Promise((r) => setTimeout(r, thinkTime));
    }
    activeVUs--;
  };

  // Launch all Virtual Users concurrently
  const vuPromises = [];
  for (let i = 1; i <= virtualUsers; i++) {
    vuPromises.push(runVirtualUser(i));
  }

  await Promise.all(vuPromises);
  isRunning = false;
  clearInterval(ticker);
  console.log('\n\n[Engine] Load execution finished. Compiling statistical metrics...\n');

  const totalDurationMs = Date.now() - testStartTime;
  const totalRequests = allRequests.length;
  const successfulRequests = allRequests.filter((r) => r.success).length;
  const failedRequests = totalRequests - successfulRequests;
  const errorRatePercent = totalRequests > 0 ? Number(((failedRequests / totalRequests) * 100).toFixed(2)) : 0;
  const overallRps = Number((totalRequests / (totalDurationMs / 1000)).toFixed(1));
  const allDurations = allRequests.map((r) => r.duration);
  const percentiles = calculatePercentiles(allDurations);
  const totalBytesTransferred = allRequests.reduce((acc, r) => acc + (r.bytes || 0), 0);

  // Compile per-endpoint summary table
  const endpointSummaries = Object.values(perEndpointStats).map((ep) => {
    const stats = calculatePercentiles(ep.durations);
    return {
      name: ep.name,
      path: ep.path,
      method: ep.method,
      totalRequests: ep.total,
      passed: ep.passed,
      failed: ep.failed,
      passRate: ep.total > 0 ? `${((ep.passed / ep.total) * 100).toFixed(1)}%` : '0%',
      ...stats,
      dataTransferredKB: Number((ep.bytes / 1024).toFixed(1))
    };
  });

  return {
    summary: {
      virtualUsers,
      durationSeconds,
      totalRequests,
      successfulRequests,
      failedRequests,
      errorRatePercent,
      overallRps,
      totalBytesTransferredMB: Number((totalBytesTransferred / (1024 * 1024)).toFixed(2)),
      ...percentiles,
      statusCodes,
      timestamp: new Date().toISOString()
    },
    endpoints: endpointSummaries,
    timeline: timelineSeconds,
    rawDurations: allDurations
  };
}
