const { handleApiRoute } = require('../backend/routes/api');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const searchParams = new URLSearchParams(req.query || {});
  await handleApiRoute('/api/quote', searchParams, res);
};
