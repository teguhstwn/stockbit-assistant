// Utility Helper & Formatter Functions

const $ = id => document.getElementById(id);

// Format Rupiah
const rp = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');

// Format Persentase
const pct = n => (n >= 0 ? '+' : '') + Number(n).toFixed(2) + '%';

// Matriks Fraksi Harga Resmi BEI (IDX)
function tickSize(p) {
  if (p < 200) return 1;
  if (p < 500) return 2;
  if (p < 2000) return 5;
  if (p < 5000) return 10;
  return 25;
}

// Pembulatan ke Atas Fraksi Harga IDX (untuk Target Profit)
function roundUpTick(p) {
  const t = tickSize(p);
  return Math.ceil(p / t) * t;
}

// Pembulatan ke Bawah Fraksi Harga IDX (untuk Stop Loss)
function roundDownTick(p) {
  const t = tickSize(p);
  return Math.max(1, Math.floor(p / t) * t);
}

// Validasi apakah harga tepat berada di fraksi BEI
function isValidTick(p) {
  const t = tickSize(p);
  return p % t === 0;
}

// Perhitungan Harga Stop Loss presisi fraksi
function stopLossPrice(entry, slPercent) {
  const rawPrice = entry * (1 - slPercent);
  return roundDownTick(rawPrice);
}

// Kompensasi Fee Bolak-balik: Entry * (1 + feeBeli) * (1 + target) / (1 - feeJual)
function calcTargetPrice(entry, targetPct) {
  const feeBuy = typeof FEE_BUY !== 'undefined' ? FEE_BUY : 0.0015;
  const feeSell = typeof FEE_SELL !== 'undefined' ? FEE_SELL : 0.0025;
  const rawTarget = (entry * (1 + feeBuy) * (1 + targetPct)) / (1 - feeSell);
  return roundUpTick(rawTarget);
}

// Menghitung target harga TP1, TP2, dan SL presisi fraksi BEI & net return
function calcTradingTargets(entry, slPercent = 0.02) {
  const feeBuy = typeof FEE_BUY !== 'undefined' ? FEE_BUY : 0.0015;
  const feeSell = typeof FEE_SELL !== 'undefined' ? FEE_SELL : 0.0025;

  const p1 = calcTargetPrice(entry, 0.03);
  const p2 = calcTargetPrice(entry, 0.05);
  const ps = stopLossPrice(entry, slPercent);

  const calcNetPct = exitPrice => {
    const cost = entry * (1 + feeBuy);
    const proceeds = exitPrice * (1 - feeSell);
    return ((proceeds - cost) / cost) * 100;
  };

  const r1Pct = calcNetPct(p1);
  const r2Pct = calcNetPct(p2);
  const rsPct = calcNetPct(ps);

  const rrRatio = Math.abs(rsPct) > 0 ? (r1Pct / Math.abs(rsPct)).toFixed(1) : '1.5';

  return {
    p1,
    p2,
    ps,
    r1Pct: Number(r1Pct.toFixed(2)),
    r2Pct: Number(r2Pct.toFixed(2)),
    rsPct: Number(rsPct.toFixed(2)),
    rrRatio
  };
}

// Menghitung target harga Swing Rebound (Horizon 1-4 Minggu: TP1 +10%, TP2 +18%, SL -4%)
function calcSwingTargets(entry, slPercent = 0.04) {
  const feeBuy = typeof FEE_BUY !== 'undefined' ? FEE_BUY : 0.0015;
  const feeSell = typeof FEE_SELL !== 'undefined' ? FEE_SELL : 0.0025;

  const p1 = calcTargetPrice(entry, 0.10); // Target 1: +10%
  const p2 = calcTargetPrice(entry, 0.18); // Target 2: +18%
  const ps = stopLossPrice(entry, slPercent); // SL Swing: -4%

  const calcNetPct = exitPrice => {
    const cost = entry * (1 + feeBuy);
    const proceeds = exitPrice * (1 - feeSell);
    return ((proceeds - cost) / cost) * 100;
  };

  const r1Pct = calcNetPct(p1);
  const r2Pct = calcNetPct(p2);
  const rsPct = calcNetPct(ps);

  const rrRatio = Math.abs(rsPct) > 0 ? (r1Pct / Math.abs(rsPct)).toFixed(1) : '2.5';

  return {
    p1,
    p2,
    ps,
    r1Pct: Number(r1Pct.toFixed(2)),
    r2Pct: Number(r2Pct.toFixed(2)),
    rsPct: Number(rsPct.toFixed(2)),
    rrRatio,
    isSwing: true
  };
}

// Clipboard Copy Helper
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const t = document.createElement('textarea');
    t.value = text;
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }
  toast('Disalin ke clipboard');
}

// Toast Notification
function toast(msg, err = false) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg ${
    err ? 'bg-rose-950 border-rose-800 text-rose-200' : 'bg-slate-800 border-slate-700 text-slate-100'
  } border font-medium text-xs shadow-2xl transition-opacity duration-200 z-50`;
  t.style.opacity = 1;
  clearTimeout(t._h);
  t._h = setTimeout(() => {
    t.style.opacity = 0;
  }, 2200);
}
