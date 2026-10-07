const { handleApiRoute } = require('../backend/routes/api');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const searchParams = new URLSearchParams(req.query || {});
  await handleApiRoute('/api/health', searchParams, res);
};
