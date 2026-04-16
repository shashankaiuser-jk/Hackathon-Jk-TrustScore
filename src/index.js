// ─────────────────────────────────────────────────────────────────────────────
// src/index.js  —  CreditLens AI Server (pure Node built-in http — zero deps)
// ─────────────────────────────────────────────────────────────────────────────
const http = require('http');
const fs   = require('fs');
const path = require('path');

// Load .env manually (no dotenv package needed)
try {
  const env = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch (_) { /* .env optional */ }

const { handleRequest } = require('./api/routes');

const PORT    = process.env.PORT || 3000;
const PUBLIC  = path.join(__dirname, '../public');

// ── MIME types ─────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html', '.css': 'text/css',
  '.js': 'application/javascript', '.json': 'application/json',
  '.png': 'image/png', '.ico': 'image/x-icon',
};

// ── Read body ──────────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((res, rej) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end',  () => {
      try { res(data ? JSON.parse(data) : {}); }
      catch(e) { rej(e); }
    });
    req.on('error', rej);
  });
}

// ── Server ─────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];

  // CORS
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // ── Serve static UI ───────────────────────────────────────────────────
  if (!url.startsWith('/api')) {
    const filePath = path.join(PUBLIC, url === '/' ? 'landing.html' : url);
    const ext      = path.extname(filePath);
    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
      return res.end(content);
    } catch (_) {
      // Fall through to 404
      res.writeHead(404); return res.end('Not found');
    }
  }

  // ── API routes ─────────────────────────────────────────────────────────
  try {
    const body   = req.method === 'POST' ? await readBody(req) : {};
    const result = await handleRequest(req.method, url, body);
    res.writeHead(result.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.data, null, 2));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success:false, error: e.message }));
  }
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║          CreditLens AI  —  Credit Intelligence v2.0          ║
╠══════════════════════════════════════════════════════════════╣
║  UI      :  http://localhost:${PORT}                           ║
║  Demo API:  http://localhost:${PORT}/api/demo                  ║
║  Health  :  http://localhost:${PORT}/api/health                ║
╚══════════════════════════════════════════════════════════════╝

  API key: ${process.env.ANTHROPIC_API_KEY ? '✓ Found' : '✗ Not set — fallback reasoning active'}
  `);
});
