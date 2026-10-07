const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleApiRoute } = require('./routes/api');

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = parsedUrl.pathname;

  // 1. API Endpoints
  if (pathname.startsWith('/api/')) {
    const handled = await handleApiRoute(pathname, parsedUrl.searchParams, res);
    if (handled !== false) return;
  }

  // 2. Static File Serving from frontend/ directory
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(FRONTEND_DIR, safePath === '/' || safePath === '\\' ? 'index.html' : safePath);

  // Fallback to index.html for SPA if file does not exist but is not an asset
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // Serve frontend/index.html as default fallback
    const indexHtmlPath = path.join(FRONTEND_DIR, 'index.html');
    fs.readFile(indexHtmlPath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('File tidak ditemukan.');
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log('====================================================');
  console.log('🚀 Stockbit Assistant Backend REALTIME is running!');
  console.log(`📡 URL Aplikasi: http://localhost:${PORT}`);
  console.log(`📊 API Screener: http://localhost:${PORT}/api/stocks`);
  console.log(`🔍 API Quote   : http://localhost:${PORT}/api/quote?symbol=GOTO`);
  console.log('====================================================');
});

module.exports = server;
