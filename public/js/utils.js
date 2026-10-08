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

// ==============================================================
// ALGORITMA EVALUASI PORTOFOLIO: HOLD VS CUT LOSS
// ==============================================================
function analyzeHoldOrCutLoss(params) {
  const {
    buyPrice,
    currentPrice,
    lots,
    bandar = {},
    chgPercent = 0,
    high = currentPrice,
    low = currentPrice,
    dayRange = 0,
    volumeLot = 0
  } = params;

  // 1. Kalkulasi Finansial Dasar
  const totalShares = lots * 100;
  const totalInvested = buyPrice * totalShares;
  const currentValue = currentPrice * totalShares;
  const unrealizedPnL = currentValue - totalInvested;
  const lossPct = buyPrice > 0 ? ((currentPrice - buyPrice) / buyPrice) * 100 : 0;
  const lossAmount = Math.abs(unrealizedPnL);
  const recycleCapital = currentValue;

  // Persentase kenaikan yang dibutuhkan dari harga saat ini untuk kembali ke modal (BEP)
  const bepGainNeeded = currentPrice > 0 ? ((buyPrice - currentPrice) / currentPrice) * 100 : 0;

  // 2. Dimensi 1: Kondisi Teknikal & Support (Maks 35 Poin)
  let technicalScore = 0;
  let technicalStatus = 'DOWNTREND';
  let technicalDetail = '';

  const isNearLow = low > 0 && currentPrice <= low * 1.015;
  const isNearHigh = high > 0 && currentPrice >= high * 0.985;
  const isBouncing = low > 0 && currentPrice >= low * 1.025;

  if (chgPercent >= 2.0 || isNearHigh) {
    technicalScore = 35;
    technicalStatus = 'REVERSAL KUAT';
    technicalDetail = 'Harga mencatat pantulan signifikan mendekati Day High dengan momentum beli aktif.';
  } else if (chgPercent > 0 || isBouncing) {
    technicalScore = 26;
    technicalStatus = 'REVERSAL AWAL';
    technicalDetail = 'Harga mulai terangkat dari titik terendah (Low) harian, mengindikasikan adanya bantalan support.';
  } else if (chgPercent >= -1.5 && !isNearLow) {
    technicalScore = 18;
    technicalStatus = 'KONSOLIDASI';
    technicalDetail = 'Harga bergerak mendatar dalam rentang sempit, tekanan jual mulai mereda namun butuh konfirmasi volume.';
  } else if (chgPercent >= -3.0) {
    technicalScore = 8;
    technicalStatus = 'DOWNTREND RINGAN';
    technicalDetail = 'Tekanan jual masih berlangsung, harga mendekati level terendah harian.';
  } else {
    technicalScore = 2;
    technicalStatus = 'DOWNTREND TEKANAN TINGGI';
    technicalDetail = 'Koreksi dalam hari ini dan harga menekan support tanpa perlawanan berarti dari buyer.';
  }

  // 3. Dimensi 2: Bandarmologi Real-Time (Maks 30 Poin)
  let bandarScore = 0;
  const rawStatus = (bandar.status || 'Netral').toLowerCase();
  const isBigDist = rawStatus.includes('big') && (rawStatus.includes('distrib') || rawStatus.includes('distribusi'));
  const isNormDist = rawStatus.includes('distrib') || rawStatus.includes('distribusi');
  const isBigAccum = rawStatus.includes('big') && (rawStatus.includes('accum') || rawStatus.includes('akumulasi'));
  const isNormAccum = rawStatus.includes('accum') || rawStatus.includes('akumulasi') || bandar.isAccum;

  let bandarStatus = bandar.status || 'Netral';
  let bandarDetail = '';

  if (isBigAccum || (bandar.netLot && bandar.netLot > 25000)) {
    bandarScore = 30;
    bandarDetail = 'Smart Money / Big Player terdeteksi mengakumulasi dalam jumlah masif saat harga melemah.';
  } else if (isNormAccum) {
    bandarScore = 20;
    bandarDetail = 'Terdapat penyerapan bertahap (Normal Accumulation) oleh broker dominan.';
  } else if (isBigDist || (bandar.netLot && bandar.netLot < -25000)) {
    bandarScore = 0;
    bandarDetail = 'Tekanan distribusi besar oleh broker institusi, smart money terus melepas kepemilikan.';
  } else if (isNormDist) {
    bandarScore = 6;
    bandarDetail = 'Distribusi normal berlangsung, volume penawaran jual lebih dominan.';
  } else {
    bandarScore = 12;
    bandarDetail = 'Aktivitas bandar relatif seimbang (Netral), belum ada arah akumulasi agresif.';
  }

  // 4. Dimensi 3: Kedalaman Kerugian & Probabilitas BEP (Maks 20 Poin)
  let lossScore = 0;
  let lossDetail = '';

  if (lossPct >= 0) {
    lossScore = 20;
    lossDetail = 'Posisi saat ini masih dalam kondisi untung / BEP.';
  } else if (lossPct >= -10) {
    lossScore = 18;
    lossDetail = `Minus ${lossPct.toFixed(1)}% masih tergolong wajar. BEP hanya butuh kenaikan +${bepGainNeeded.toFixed(1)}%.`;
  } else if (lossPct >= -20) {
    lossScore = 13;
    lossDetail = `Minus ${lossPct.toFixed(1)}%. Butuh rebound +${bepGainNeeded.toFixed(1)}% untuk kembali modal, masih realistis dalam swing 2-4 minggu.`;
  } else if (lossPct >= -35) {
    lossScore = 7;
    lossDetail = `Minus ${lossPct.toFixed(1)}% cukup dalam. Butuh +${bepGainNeeded.toFixed(1)}% untuk BEP, memerlukan katalis fundamental/reversal kuat.`;
  } else if (lossPct >= -50) {
    lossScore = 2;
    lossDetail = `Minus ${lossPct.toFixed(1)}% sangat dalam. Butuh gain +${bepGainNeeded.toFixed(1)}% untuk balik modal. Beban psikologis & opportunity cost tinggi.`;
  } else {
    lossScore = 0;
    lossDetail = `Minus ${lossPct.toFixed(1)}% ekstrem. Butuh kenaikan > +100% untuk kembali modal, probabilitas pemulihan tanpa suntikan modal baru sangat kecil.`;
  }

  // 5. Dimensi 4: Likuiditas & Volume Momentum (Maks 15 Poin)
  let volumeScore = 0;
  let volumeDetail = '';

  if (volumeLot >= 30000 && isNormAccum) {
    volumeScore = 15;
    volumeDetail = 'Likuiditas sangat tinggi dengan volume serapan besar dari buyer.';
  } else if (volumeLot >= 15000 && !isBigDist) {
    volumeScore = 10;
    volumeDetail = 'Likuiditas pasar cukup aktif, proses eksekusi jual/beli dapat dilakukan lancar.';
  } else if (volumeLot >= 5000 && !isBigDist) {
    volumeScore = 6;
    volumeDetail = 'Likuiditas moderat, antrian fraksi tidak terlalu padat.';
  } else {
    volumeScore = 2;
    volumeDetail = isBigDist ? 'Volume buang barang institusi mendominasi.' : 'Likuiditas kering / sepi. Risiko slippage tinggi jika ingin keluar posisi.';
  }

  // 6. Total Skor Mentah
  let totalScore = technicalScore + bandarScore + lossScore + volumeScore;
  totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

  // 7. Evaluasi Veto (Override Rules)
  let vetoTriggered = false;
  let vetoReason = '';

  if (lossPct <= -50) {
    vetoTriggered = true;
    vetoReason = `Kerugian telah melebihi -50% (butuh >+100% untuk BEP). Risiko modal terkunci mati sangat tinggi.`;
  } else if (isBigDist && chgPercent < -2.0) {
    vetoTriggered = true;
    vetoReason = `Distribusi masif oleh Smart Money bersamaan dengan tren harga terus longsor (-${Math.abs(chgPercent).toFixed(1)}%).`;
  } else if (isNearLow && chgPercent <= -3.5 && !isNormAccum && volumeLot >= 15000) {
    vetoTriggered = true;
    vetoReason = `Panic selling dengan volume besar tanpa penyerapan buyer menembus support harian.`;
  }

  // 8. Penentuan Rekomendasi Utama
  let verdict = '';
  let verdictType = '';
  let confidence = 0;
  let summaryHeadline = '';
  let colorTheme = '';

  if (vetoTriggered || totalScore < 35) {
    verdict = 'CUT LOSS SEKARANG';
    verdictType = 'CUT_LOSS';
    colorTheme = 'rose';
    confidence = vetoTriggered ? 88 : Math.max(72, 100 - totalScore);
    summaryHeadline = vetoTriggered
      ? `🚨 Veto Rekomendasi: ${vetoReason} Amankan sisa dana untuk ditradingkan kembali.`
      : 'Tekanan distribusi dan tren bearish mendominasi. Mempertahankan posisi berisiko memperparah kerugian.';
  } else if (totalScore < 65) {
    verdict = 'HOLD & PANTAU KETAT';
    verdictType = 'HOLD_MONITOR';
    colorTheme = 'amber';
    confidence = Math.round(55 + (totalScore - 35) * 0.4);
    summaryHeadline = 'Sinyal pasar masih konsolidatif dengan peluang bertahan di support. Beri toleransi waktu terbatas dengan level stop loss ketat.';
  } else {
    verdict = 'HOLD & AVERAGING DOWN';
    verdictType = 'HOLD_AVERAGE';
    colorTheme = 'emerald';
    confidence = Math.min(92, Math.round(65 + (totalScore - 65) * 0.8));
    summaryHeadline = 'Terdeteksi akumulasi Smart Money atau harga berada di area bantalan diskon yang sehat. Peluang rebound terbuka.';
  }

  // 9. Modul Rincian Rekomendasi
  // A. Level Teknikal
  const supportZone = roundDownTick(Math.min(low, currentPrice * 0.98));
  const criticalStopLoss = roundDownTick(low * 0.96);
  const reboundTarget = roundUpTick(Math.max(high, currentPrice * 1.05));

  // B. Batas Waktu Evaluasi (Deadline)
  const evalDays = verdictType === 'CUT_LOSS' ? '1 Hari (Sesi Saat Ini)' : (verdictType === 'HOLD_MONITOR' ? '3 - 5 Hari Bursa' : '5 - 10 Hari Bursa');
  const bounceMustHitPrice = roundUpTick(currentPrice * (verdictType === 'HOLD_AVERAGE' ? 1.04 : 1.025));

  // C. Perhitungan Averaging Down (Jika Direkomendasikan atau Simulasi)
  const avgDownBuyPrice = roundDownTick(Math.min(currentPrice, low));
  const suggestedAdditionalLots = Math.max(1, Math.round(lots * (lossPct < -20 ? 0.75 : 0.5)));
  const newTotalShares = (lots + suggestedAdditionalLots) * 100;
  const newTotalInvested = totalInvested + (avgDownBuyPrice * suggestedAdditionalLots * 100);
  const newAvgPrice = Math.round(newTotalInvested / newTotalShares);
  const newBepGainNeeded = ((newAvgPrice - currentPrice) / currentPrice) * 100;

  return {
    buyPrice,
    currentPrice,
    lots,
    totalShares,
    totalInvested,
    currentValue,
    unrealizedPnL,
    lossPct: Number(lossPct.toFixed(2)),
    lossAmount,
    recycleCapital,
    bepGainNeeded: Number(bepGainNeeded.toFixed(2)),

    // Scoring
    scores: {
      technical: technicalScore,
      bandar: bandarScore,
      loss: lossScore,
      volume: volumeScore,
      total: totalScore
    },

    // Verdict
    verdict,
    verdictType,
    confidence,
    colorTheme,
    summaryHeadline,
    vetoTriggered,
    vetoReason,

    // Module Details
    modules: {
      // Modul A: Teknikal
      technical: {
        status: technicalStatus,
        score: technicalScore,
        detail: technicalDetail,
        supportZone,
        criticalStopLoss,
        reboundTarget
      },
      // Modul B: Bandarmologi
      bandar: {
        status: bandarStatus,
        score: bandarScore,
        detail: bandarDetail,
        isAccum: isNormAccum,
        summaryText: bandar.summaryText || 'Data bandar terpantau'
      },
      // Modul C: Kalkulator Recovery
      recovery: {
        lossPct: Number(lossPct.toFixed(2)),
        lossAmount,
        bepGainNeeded: Number(bepGainNeeded.toFixed(2)),
        recycleCapital,
        detail: lossDetail
      },
      // Modul D: Batas Waktu Evaluasi
      deadline: {
        evalDays,
        bounceMustHitPrice,
        criticalStopLoss,
        actionRule: `Jika dalam ${evalDays} harga tidak berhasil menembus Rp ${bounceMustHitPrice.toLocaleString('id-ID')} atau menembus ke bawah Rp ${criticalStopLoss.toLocaleString('id-ID')}, segera eksekusi CUT LOSS tanpa kompromi.`
      },
      // Modul E: Saran Averaging Down
      averaging: {
        isAllowed: verdictType === 'HOLD_AVERAGE',
        warning: verdictType === 'CUT_LOSS'
          ? 'DILARANG AVERAGING DOWN! Menambah muatan pada saham distribusi hanya akan memperdalam kerugian.'
          : (verdictType === 'HOLD_MONITOR' ? 'Belum disarankan averaging down sebelum konfirmasi reversal terbentuk.' : null),
        buyPrice: avgDownBuyPrice,
        additionalLots: suggestedAdditionalLots,
        newAvgPrice,
        newBepGainNeeded: Number(newBepGainNeeded.toFixed(2)),
        additionalCapital: avgDownBuyPrice * suggestedAdditionalLots * 100
      }
    }
  };
}
