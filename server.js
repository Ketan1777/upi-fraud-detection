/**
 * UPI FraudGuard AI - Standalone Zero-Dependency Runner
 * Powered by Node.js built-in HTTP server.
 * Enables 1-click execution for college demo, hackathon presentation, and local testing
 * with ZERO package installation required!
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5173;
const HTML_FILE = path.join(__dirname, 'frontend', 'standalone-preview.html');

const server = http.createServer((req, res) => {
  // Serve CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' || req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'HEALTHY', app: 'UPI FraudGuard AI', timestamp: new Date() }));
    return;
  }

  // Serve Main UI
  fs.readFile(HTML_FILE, 'utf-8', (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error loading standalone preview: ${err.message}`);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(65));
  console.log('🚀 UPI FraudGuard AI - Live Platform Runner Active');
  console.log('='.repeat(65));
  console.log(`🌐 Web Console:        http://localhost:${PORT}`);
  console.log(`📡 Ingestion Bus:      Real-time synthetic transaction stream`);
  console.log(`🛡️  AI Engines:         Random Forest + Isolation Forest + NetworkX`);
  console.log(`📚 Dataset:            1,500 synthetic UPI records in dataset/`);
  console.log('='.repeat(65));
  console.log('Press Ctrl+C to stop the server.\n');
});
