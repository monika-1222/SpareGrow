# SpareGrow Baseline / Load Testing Suite (Node.js)

A high-performance **Concurrent Load Testing and Performance Benchmarking Framework** for the **SpareGrow** Web & API application.

Simulates normal and peak expected user loads (**100 concurrent Virtual Users for 1 continuous minute**), measuring throughput (Requests Per Second - RPS), response time distribution (Min, Max, Avg, p50, p90, p95, p99), error rates, and generating a **7-sheet Excel analysis workbook**.

---

## 📋 Baseline / Load Test Specifications

- **Virtual Users (VUs)**: 100 concurrent virtual users
- **Duration**: 60 seconds (1 minute continuous load execution)
- **Total Requests**: Thousands of requests sent during the minute across endpoints
- **Endpoints Simulated**:
  - SPA Landing & Layout (`/`, `/src/main.js`, `/src/index.css`)
  - Authenticated Routes (`/#/login`, `/#/dashboard`, `/#/wallet`, `/#/goals`)
  - REST API Endpoints (`/api/health`, `/api/auth/verify-otp`, `/api/calc/roundup`, `/api/wallet/summary`)

---

## 📊 7-Sheet Excel Analysis Report

Generated at `load-tests/reports/SpareGrow_Baseline_Load_Test_Report.xlsx`:
1. **Executive Summary**: KPI Cards (`Total Requests`, `RPS`, `Avg Latency`, `Success Rate`), Execution Overview Table, and SLA Verdicts.
2. **Latency Percentiles**: Full statistical percentile table (`Min`, `p50/Median`, `p75`, `p90`, `p95`, `p99`, `Max`, `Average`).
3. **Endpoint Analysis**: Performance breakdown by endpoint (Method, Path, Requests, Pass %, Min, Avg, p95, Max, KB transferred).
4. **Timeline Data**: Second-by-second throughput and latency timeline (Seconds 1 to 60).
5. **Status Codes**: Distribution of HTTP status codes (`200 OK`, `304`, `4xx`, `5xx`).
6. **SLA Targets**: QA Performance SLA targets vs observed compliance.
7. **Capacity & Recommendations**: Concurrency headroom and infrastructure scaling plans.

---

## 🚀 Setup & Execution

### 1. Install Dependencies
```powershell
cd load-tests
npm install
```

### 2. Run Default 100 VU 1-Minute Baseline Load Test
```powershell
npm test
```

### 3. Run Custom Scenarios
```powershell
# Run 100 VUs for 60 seconds
npm run load:baseline

# Quick test: 100 VUs for 10 seconds
npm run load:quick

# Stress test: 250 VUs for 60 seconds
npm run load:stress
```
