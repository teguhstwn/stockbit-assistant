const { UNIVERSE } = require('../config/universe');
const { fetchYahooQuote } = require('../services/yahooFinance');
const { analyzeDynamically, getScreenerStocks } = require('../services/strategyEngine');

async function handleApiRoute(pathname, searchParams, res) {
  if (pathname === '/api/health') {
    const mem = process.memoryUsage();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'ok',
      uptime: Math.round(process.uptime()),
      ramHeapMb: (mem.heapUsed / 1024 / 1024).toFixed(2),
      ramRssMb: (mem.rss / 1024 / 1024).toFixed(2),
      serverTime: new Date().toISOString(),
      provider: 'Yahoo Finance Realtime IDX'
    }));
  }

  if (pathname === '/api/stocks') {
    try {
      const stocks = await getScreenerStocks();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        count: stocks.length,
        timestamp: new Date().toISOString(),
        data: stocks
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  if (pathname === '/api/quote') {
    const symbol = searchParams.get('symbol');
    if (!symbol) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Parameter symbol diperlukan (misal: ?symbol=GOTO)' }));
    }

    try {
      const quote = await fetchYahooQuote(symbol);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, data: quote }));
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  if (pathname === '/api/analyze') {
    const symbol = searchParams.get('symbol');
    if (!symbol) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Parameter symbol diperlukan (misal: ?symbol=ANTM)' }));
    }

    try {
      const quote = await fetchYahooQuote(symbol);
      const foundMeta = UNIVERSE.find(u => u.code.toUpperCase() === quote.code.toUpperCase());
      const analyzed = analyzeDynamically({
        ...quote,
        sector: foundMeta?.sector || 'Saham IDX',
        risk: foundMeta?.risk || (quote.price < 200 ? 'High' : (quote.price > 2000 ? 'Low' : 'Medium'))
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, data: analyzed }));
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  return false;
}

module.exports = {
  handleApiRoute
};
