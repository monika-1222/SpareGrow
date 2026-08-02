/**
 * config.js
 * =========
 * Configuration for SpareGrow Baseline / Load Testing Suite.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '..');
export const SERVER_PORT = 3005;
export const BASE_URL = `http://127.0.0.1:${SERVER_PORT}`;

export const DEFAULT_LOAD_CONFIG = {
  virtualUsers: 100,      // 100 concurrent Virtual Users
  durationSeconds: 60,    // 60 seconds (1 minute continuous execution)
  rampUpSeconds: 5,       // 5 seconds smooth ramp-up
  targetUrl: BASE_URL,
  slaThresholds: {
    maxAvgResponseTimeMs: 250,   // SLA: Target avg response time <= 250ms
    maxP95ResponseTimeMs: 500,   // SLA: 95th percentile <= 500ms
    maxP99ResponseTimeMs: 1200,  // SLA: 99th percentile <= 1200ms
    maxErrorRatePercent: 0.5,    // SLA: Error rate < 0.5%
    minRps: 100                  // SLA: Minimum throughput >= 100 req/sec
  }
};

// Endpoints simulated across the 100 VUs
export const TEST_ENDPOINTS = [
  { name: 'Home Landing Page', path: '/', method: 'GET', weight: 20 },
  { name: 'App Bundle (main.js)', path: '/src/main.js', method: 'GET', weight: 15 },
  { name: 'Stylesheet (index.css)', path: '/src/index.css', method: 'GET', weight: 10 },
  { name: 'Auth Portal Route', path: '/#/login', method: 'GET', weight: 10 },
  { name: 'Dashboard View', path: '/#/dashboard', method: 'GET', weight: 15 },
  { name: 'Wallet & Sweep View', path: '/#/wallet', method: 'GET', weight: 10 },
  { name: 'Goals & Targets View', path: '/#/goals', method: 'GET', weight: 5 },
  { name: 'API: Health Check', path: '/api/health', method: 'GET', weight: 5 },
  { name: 'API: Auth OTP Verification', path: '/api/auth/verify-otp', method: 'POST', body: { phone: '9876543210', otp: '1234' }, weight: 5 },
  { name: 'API: Calculate Spare Roundups', path: '/api/calc/roundup', method: 'POST', body: { amounts: [183, 442, 99, 1250] }, weight: 5 }
];
