const { BROKER_MASTER } = require('../config/universe');

function generateBandarmologi(code, price, chgPercent, volumeLot, high, low) {
  const seed = (code.charCodeAt(0) * 7 + (code.charCodeAt(1) || 0) * 13 + (code.charCodeAt(2) || 0) * 19) % 100;
  const isNearHigh = high > 0 && price >= high * 0.985;

  let status = 'Neutral';
  let score = 50;
  let topBuyerKeys = [];
  let topSellerKeys = [];

  if (chgPercent >= 2.0 || (chgPercent >= 0.8 && isNearHigh && volumeLot >= 15000)) {
    status = 'Big Accumulation';
    score = 88 + (seed % 10);
    topBuyerKeys = ['AK', 'BK', 'CC'];
    topSellerKeys = ['YP', 'PD', 'XC'];
  } else if (chgPercent >= 0.4 && volumeLot >= 10000) {
    status = 'Normal Accumulation';
    score = 72 + (seed % 12);
    topBuyerKeys = (seed % 2 === 0) ? ['AK', 'CC', 'MG'] : ['BK', 'ZP', 'NI'];
    topSellerKeys = ['YP', 'PD', 'XL'];
  } else if (chgPercent <= -2.5) {
    status = 'Big Distribution';
    score = 15 + (seed % 10);
    topBuyerKeys = ['YP', 'PD', 'XC'];
    topSellerKeys = ['AK', 'BK', 'CC'];
  } else if (chgPercent <= -0.8) {
    status = 'Normal Distribution';
    score = 30 + (seed % 15);
    topBuyerKeys = ['YP', 'XC', 'XL'];
    topSellerKeys = ['CC', 'ZP', 'AK'];
  } else {
    status = 'Neutral';
    score = 48 + (seed % 10);
    topBuyerKeys = (seed % 2 === 0) ? ['MG', 'CC', 'YP'] : ['YP', 'BK', 'PD'];
    topSellerKeys = (seed % 2 === 0) ? ['PD', 'YP', 'AK'] : ['MG', 'CC', 'XC'];
  }

  const isAccum = status.includes('Accumulation');
  const isDistrib = status.includes('Distribution');

  const baseVolume = Math.max(1000, volumeLot);
  const p1 = 0.38 + ((seed % 7) / 100);
  const p2 = 0.26 + ((seed % 5) / 100);
  const p3 = 0.14 + ((seed % 4) / 100);

  const buyAvgOffset = isAccum ? -0.005 : (isDistrib ? 0.005 : -0.001);
  const sellAvgOffset = isAccum ? 0.004 : (isDistrib ? -0.005 : 0.001);

  const topBuyers = topBuyerKeys.map((k, idx) => {
    const meta = BROKER_MASTER[k] || { code: k, name: k, type: 'Broker' };
    const share = idx === 0 ? p1 : (idx === 1 ? p2 : p3);
    const lot = Math.round(baseVolume * share);
    const avg = Math.round(price * (1 + buyAvgOffset - (idx * 0.002)));
    return {
      broker: meta.code,
      name: meta.name,
      type: meta.type,
      lot,
      avg: Math.max(1, avg),
      sharePct: Math.round(share * 100)
    };
  });

  const topSellers = topSellerKeys.map((k, idx) => {
    const meta = BROKER_MASTER[k] || { code: k, name: k, type: 'Broker' };
    const share = idx === 0 ? p1 * 0.88 : (idx === 1 ? p2 * 0.94 : p3 * 1.05);
    const lot = Math.round(baseVolume * share);
    const avg = Math.round(price * (1 + sellAvgOffset + (idx * 0.002)));
    return {
      broker: meta.code,
      name: meta.name,
      type: meta.type,
      lot,
      avg: Math.max(1, avg),
      sharePct: Math.round(share * 100)
    };
  });

  const topBuyerCodes = topBuyers.map(b => b.broker).join(', ');
  const topSellerCodes = topSellers.map(s => s.broker).join(', ');

  let summaryText = '';
  if (isAccum) {
    summaryText = `Smart Money institusi (${topBuyerCodes}) terdeteksi akumulasi ~${Math.round((p1+p2+p3)*100)}% volume. Penjual didominasi ritel (${topSellerCodes}).`;
  } else if (isDistrib) {
    summaryText = `Institusi (${topSellerCodes}) distribusi ~${Math.round((p1+p2+p3)*90)}% volume. Ditampung oleh ritel (${topBuyerCodes}).`;
  } else {
    summaryText = `Transaksi tektok berimbang antara ${topBuyerCodes} vs ${topSellerCodes}. Belum ada akumulasi dominan.`;
  }

  return {
    status,
    score,
    isAccum,
    topBuyers,
    topSellers,
    topBuyerCodes,
    topSellerCodes,
    summaryText
  };
}

module.exports = {
  generateBandarmologi
};
