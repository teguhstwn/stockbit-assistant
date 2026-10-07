const { UNIVERSE, CACHE_TTL_SCREENER_MS } = require('../config/universe');
const { cache, fetchYahooQuote } = require('./yahooFinance');
const { generateBandarmologi } = require('./bandarmologi');
const { generateOrderBook } = require('./orderBook');

// Logika dinamis penentuan strategi, sinyal, stoploss, dan kriteria BPJS/BSJP/Bandar
function analyzeDynamically(item) {
  const { price, prevClose, high, low, chgPercent, volumeLot, risk } = item;
  const dayRange = high > low ? ((high - low) / low) * 100 : 0;
  const nearHigh = high > 0 && price >= high * 0.985;
  const nearLow = low > 0 && price <= low * 1.015;

  // 1. Sinyal Teknikal Intraday
  let sig = 'WAIT & SEE';
  if (chgPercent >= 7 || (nearHigh && chgPercent >= 5)) {
    sig = 'TAKE PROFIT';
  } else if (chgPercent > 2.5 && volumeLot > 40000 && nearHigh) {
    sig = 'STRONG BUY';
  } else if (chgPercent > 0.5 && nearHigh) {
    sig = 'BUY ON BREAKOUT';
  } else if (chgPercent >= 0 && chgPercent <= 2 && !nearLow) {
    sig = 'BUY ON WEAKNESS';
  } else {
    sig = 'WAIT & SEE';
  }

  // 2. Stop Loss Adaptif berbasis volatilitas
  let sl = 0.02;
  if (dayRange >= 5 || risk === 'High') {
    sl = 0.03;
  } else if (dayRange <= 2 || risk === 'Low') {
    sl = 0.015;
  }

  // 3. Klasifikasi Preset Strategi
  const isBPJS = (dayRange >= 2.5 && volumeLot >= 15000 && chgPercent >= 0) || (volumeLot >= 40000 && chgPercent > 0.5);
  const isBSJP = (nearHigh && chgPercent >= 0.5 && chgPercent <= 7.5 && volumeLot >= 10000) || (chgPercent >= 2 && nearHigh);

  // 4. Bandarmologi
  const bandar = generateBandarmologi(item.code, price, chgPercent, volumeLot, high, low);

  // Calon Top Gainer Besok: momentum awal (+1.2% s/d +9.0%), closing bertahan di pucuk (>= 97% Day High), volume aktif (>= 15rb lot), terakumulasi Smart Money
  const isTopGainer = (high > 0 && price >= high * 0.97 && chgPercent >= 1.2 && chgPercent <= 9.0 && volumeLot >= 15000 && dayRange >= 2.5 && bandar.isAccum);

  // 5. Swing Rebound (1-4 Minggu): harga terdiskon/koreksi (chgPercent <= 1.0%), terakumulasi Smart Money serap bawah
  const isSwingRebound = (chgPercent <= 1.0 && bandar.isAccum && volumeLot >= 10000);

  const strategies = [];
  if (isBPJS) strategies.push('BPJS');
  if (isBSJP) strategies.push('BSJP');
  if (bandar.isAccum) strategies.push('BANDAR');
  if (isTopGainer) strategies.push('TOP_GAINER');
  if (isSwingRebound) strategies.push('SWING_REBOUND');
  if (!strategies.length && chgPercent >= 0) strategies.push('BPJS');

  // 5. Order Book 5 Fraksi
  const orderbook = generateOrderBook(item.code, price, volumeLot, chgPercent, high, low);

  return {
    ...item,
    sig,
    sl,
    dayRange: Number(dayRange.toFixed(2)),
    strategies,
    isBPJS,
    isBSJP,
    isBandar: bandar.isAccum,
    isTopGainer,
    isSwingRebound,
    bandar,
    orderbook,
    reasons: {
      bpjs: isBPJS ? `Volatilitas ${dayRange.toFixed(1)}% • Vol ${volumeLot.toLocaleString('id-ID')} lot` : null,
      bsjp: isBSJP ? `Closing di 99% Day High (${price}/${high}) • Akumulasi Kuat` : null,
      bandar: bandar.isAccum ? `${bandar.status}: Top Buyer ${bandar.topBuyerCodes}` : null,
      topGainer: isTopGainer ? 'Momentum Breakout & Big Accumulation' : null,
      swing: isSwingRebound ? 'Diskon Sehat & Serap Bawah Smart Money' : null
    }
  };
}

async function getScreenerStocks() {
  const now = Date.now();
  if (cache.stocks.data && now - cache.stocks.timestamp < CACHE_TTL_SCREENER_MS) {
    return cache.stocks.data;
  }

  const promises = UNIVERSE.map(async (meta) => {
    try {
      const q = await fetchYahooQuote(meta.code);
      return analyzeDynamically({
        ...meta,
        ...q,
        name: meta.name || q.name
      });
    } catch (err) {
      return analyzeDynamically({
        ...meta,
        price: 100,
        prevClose: 100,
        chgPercent: 0,
        chgPrice: 0,
        high: 100,
        low: 100,
        volumeLot: 10000,
        isFallback: true
      });
    }
  });

  const results = await Promise.all(promises);
  cache.stocks = { data: results, timestamp: now };
  return results;
}

module.exports = {
  analyzeDynamically,
  getScreenerStocks
};
