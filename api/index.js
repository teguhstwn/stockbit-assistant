const { handleApiRoute } = require('../backend/routes/api');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const host = req.headers.host || 'localhost';
  const parsedUrl = new URL(req.url, `https://${host}`);
  const pathname = parsedUrl.pathname;

  const searchParams = new URLSearchParams(req.query || parsedUrl.searchParams);
  const handled = await handleApiRoute(pathname, searchParams, res);
  if (handled === false) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint API tidak ditemukan' }));
  }
};
