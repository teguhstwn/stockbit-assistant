// Matriks Fraksi Harga Resmi Bursa Efek Indonesia (BEI / IDX)
function tickSize(p) {
  if (p < 200) return 1;
  if (p < 500) return 2;
  if (p < 2000) return 5;
  if (p < 5000) return 10;
  return 25;
}

function generateOrderBook(code, price, volumeLot, chgPercent, high, low) {
  const t = tickSize(price);
  const timeSlice = Math.floor(Date.now() / 3000);
  const seed = (code.charCodeAt(0) * 11 + Math.round(price) * 7 + Math.round(volumeLot) * 13 + timeSlice * 17) % 100;
  const isUp = chgPercent >= 0;

  const avgQueueLot = Math.max(300, Math.round(volumeLot / 25));

  const bids = [];
  const offers = [];

  const bidBias = isUp ? (1.15 + ((seed % 20) / 100)) : (0.8 + ((seed % 15) / 100));
  const offerBias = isUp ? (0.85 + ((seed % 15) / 100)) : (1.2 + ((seed % 20) / 100));

  for (let i = 1; i <= 5; i++) {
    const bPrice = Math.max(1, price - (i * t));
    const bVariance = 0.65 + (((seed * i + 19) % 70) / 100);
    const bLot = Math.round(avgQueueLot * bidBias * bVariance);
    bids.push({ price: bPrice, lot: bLot });

    const oPrice = price + ((i - 1) * t);
    const oVariance = 0.65 + (((seed * (i + 4) + 37) % 70) / 100);
    const oLot = Math.round(avgQueueLot * offerBias * oVariance);
    offers.push({ price: oPrice, lot: oLot });
  }

  const totalBidLot = bids.reduce((acc, b) => acc + b.lot, 0);
  const totalOfferLot = offers.reduce((acc, o) => acc + o.lot, 0);
  const maxLot = Math.max(...bids.map(b => b.lot), ...offers.map(o => o.lot), 1);

  bids.forEach(b => b.barPct = Math.round((b.lot / maxLot) * 100));
  offers.forEach(o => o.barPct = Math.round((o.lot / maxLot) * 100));

  const totalAll = totalBidLot + totalOfferLot;
  const bidPct = totalAll > 0 ? Math.round((totalBidLot / totalAll) * 100) : 50;
  const offerPct = 100 - bidPct;

  return {
    bids,
    offers,
    totalBidLot,
    totalOfferLot,
    bidPct,
    offerPct,
    ratio: (totalBidLot / Math.max(1, totalOfferLot)).toFixed(2),
    verdict: totalBidLot >= totalOfferLot 
      ? `Bid Dominan (${bidPct}%) • Bantalan beli tebal menahan penurunan`
      : `Offer Dominan (${offerPct}%) • Antrian jual tebal di atas, butuh volume dorongan`,
    tickTime: new Date().toLocaleTimeString('id-ID') + ' WIB'
  };
}

module.exports = {
  tickSize,
  generateOrderBook
};
