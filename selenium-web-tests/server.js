import express from 'express';
import fs from 'fs';
import path from 'path';
import { ROOT_DIR, SERVER_PORT } from './config.js';

export function startServer(port = SERVER_PORT) {
  return new Promise((resolve, reject) => {
    const app = express();

    const distDir = path.join(ROOT_DIR, 'dist');
    const serveDir = fs.existsSync(distDir) ? distDir : ROOT_DIR;

    // Serve static files
    app.use(express.static(serveDir));
    app.use(express.static(ROOT_DIR));

    // Fallback for SPA routing to index.html
    app.get('*', (req, res) => {
      const indexPath = fs.existsSync(path.join(distDir, 'index.html'))
        ? path.join(distDir, 'index.html')
        : path.join(ROOT_DIR, 'index.html');
      res.sendFile(indexPath);
    });

    const server = app.listen(port, () => {
      console.log(`[Server] SpareGrow Web App running at http://localhost:${port}`);
      resolve(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Server] Port ${port} is already in use, assuming server is running.`);
        resolve(null);
      } else {
        reject(err);
      }
    });
  });
}

// Standalone execution
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer().then(() => {
    console.log('[Server] Press Ctrl+C to stop.');
  });
}
