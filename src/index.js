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
const PUBLIC  = path.join(__dirname, '../docs');

// ── MIME types ─────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html', '.css': 'text/css',
  '.js': 'application/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
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
const requestHandler = async (req, res) => {
  const url = req.url.split('?')[0];

  // CORS
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // ── Serve static UI ───────────────────────────────────────────────────
  if (!url.startsWith('/api')) {
    // Resolve file path — fallback chain: exact → index.html → landing.html
    const candidates = [];
    if (url === '/' || url === '') {
      candidates.push(path.join(PUBLIC, 'index.html'));
      candidates.push(path.join(PUBLIC, 'landing.html'));
    } else {
      candidates.push(path.join(PUBLIC, url));
      // If the path has no extension, try .html
      if (!path.extname(url)) candidates.push(path.join(PUBLIC, url + '.html'));
    }

    for (const filePath of candidates) {
      // Basic path traversal guard
      if (!filePath.startsWith(PUBLIC)) { res.writeHead(403); return res.end('Forbidden'); }
      const ext = path.extname(filePath) || '.html';
      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        return res.end(content);
      } catch (_) { /* try next candidate */ }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not found');
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
};

const server = http.createServer(requestHandler);

if (!process.env.VERCEL) {
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
}

module.exports = requestHandler;
