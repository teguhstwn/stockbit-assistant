const { CACHE_TTL_QUOTE_MS } = require('../config/universe');

const cache = {
  stocks: { data: null, timestamp: 0 },
  quotes: new Map()
};

async function fetchYahooQuote(rawCode) {
  const code = rawCode.trim().toUpperCase().replace('.JK', '');
  const now = Date.now();

  const cached = cache.quotes.get(code);
  if (cached && now - cached.timestamp < CACHE_TTL_QUOTE_MS) {
    return cached.data;
  }

  const symbol = `${code}.JK`;
  const endpoint = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) throw new Error(`Yahoo returned status ${res.status}`);

    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta || meta.regularMarketPrice === undefined) {
      throw new Error(`Data tidak ditemukan untuk ${code}`);
    }

    const price = meta.regularMarketPrice || 0;
    const prevClose = meta.chartPreviousClose || meta.previousClose || price;
    const chgPercent = meta.regularMarketChangePercent !== undefined
      ? meta.regularMarketChangePercent
      : (prevClose ? ((price - prevClose) / prevClose) * 100 : 0);
    const chgPrice = price - prevClose;
    const high = meta.regularMarketDayHigh || price;
    const low = meta.regularMarketDayLow || price;
    const rawVolume = meta.regularMarketVolume || 0;
    const volumeLot = Math.round(rawVolume / 100);

    const quoteData = {
      code,
      name: meta.longName || meta.shortName || code,
      price,
      prevClose,
      chgPercent: Number(chgPercent.toFixed(2)),
      chgPrice: Math.round(chgPrice),
      high,
      low,
      volumeLot,
      marketTime: meta.regularMarketTime,
      updatedAt: new Date().toISOString()
    };

    if (cache.quotes.size > 100) cache.quotes.clear();
    cache.quotes.set(code, { data: quoteData, timestamp: now });
    return quoteData;
  } catch (err) {
    console.error(`Error fetching quote for ${code}:`, err.message);
    if (cached) return cached.data;
    throw err;
  }
}

module.exports = {
  cache,
  fetchYahooQuote
};
