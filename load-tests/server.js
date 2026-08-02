/**
 * server.js
 * =========
 * Express server for SpareGrow Load Testing.
 * Serves the SPA static bundle and responsive REST API simulation endpoints.
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { ROOT_DIR, SERVER_PORT } from './config.js';

export function startServer(port = SERVER_PORT) {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(express.json());

    const distDir = path.join(ROOT_DIR, 'dist');
    const serveDir = fs.existsSync(distDir) ? distDir : ROOT_DIR;

    // Static assets
    app.use('/src', express.static(path.join(ROOT_DIR, 'src')));
    app.use('/public', express.static(path.join(ROOT_DIR, 'public')));
    app.use(express.static(serveDir));
    app.use(express.static(ROOT_DIR));

    // API Endpoints for Load Testing
    app.get('/api/health', (req, res) => {
      res.status(200).json({ status: 'UP', service: 'SpareGrow-API', timestamp: Date.now() });
    });

    app.post('/api/auth/verify-otp', (req, res) => {
      const { phone, otp } = req.body || {};
      if (otp === '1234' || otp === '9999' || otp?.length === 4) {
        res.status(200).json({ success: true, token: 'mock-jwt-token-xyz', user: { phone, name: 'SpareGrow User' } });
      } else {
        res.status(400).json({ success: false, error: 'Invalid OTP code' });
      }
    });

    app.post('/api/calc/roundup', (req, res) => {
      const { amounts = [183, 442, 99, 1250] } = req.body || {};
      const results = amounts.map((amt) => {
        const nextMultiple = Math.ceil(amt / 10) * 10;
        const spare = nextMultiple - amt;
        return { original: amt, rounded: nextMultiple, spare };
      });
      const totalSpare = results.reduce((acc, curr) => acc + curr.spare, 0);
      res.status(200).json({ success: true, items: results, totalSpare });
    });

    app.get('/api/wallet/summary', (req, res) => {
      res.status(200).json({
        walletBalance: 4250.75,
        totalSaved: 18450.0,
        currentReturns: 14.8,
        activeGoals: 3
      });
    });

    // Fallback for SPA Routing
    app.get('*', (req, res) => {
      const indexPath = fs.existsSync(path.join(distDir, 'index.html'))
        ? path.join(distDir, 'index.html')
        : path.join(ROOT_DIR, 'index.html');
      res.sendFile(indexPath);
    });

    const server = app.listen(port, () => {
      console.log(`[Server] SpareGrow Load Testing Server active at http://127.0.0.1:${port}`);
      resolve(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Server] Port ${port} already active, reusing existing instance.`);
        resolve(null);
      } else {
        reject(err);
      }
    });
  });
}

if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer().then(() => console.log('[Server] Press Ctrl+C to stop.'));
}
