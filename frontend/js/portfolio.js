// Modul Portofolio Checker: Hold vs Cut Loss Analyzer

let currentPortfolioData = null;
let isPortfolioLoading = false;

// Inisialisasi Modul Portofolio
function initPortfolio() {
  const form = $('portfolioForm');
  const btnSubmit = $('btnAnalyzePortfolio');
  const inpTicker = $('portTicker');
  const inpBuyPrice = $('portBuyPrice');
  const inpLots = $('portLots');

  if (inpTicker) {
    inpTicker.addEventListener('input', e => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    });
    inpTicker.addEventListener('keydown', e => {
      if (e.key === 'Enter') runPortfolioAnalysis();
    });
  }

  if (inpBuyPrice) {
    inpBuyPrice.addEventListener('keydown', e => {
      if (e.key === 'Enter') runPortfolioAnalysis();
    });
  }

  if (inpLots) {
    inpLots.addEventListener('keydown', e => {
      if (e.key === 'Enter') runPortfolioAnalysis();
    });
  }

  if (btnSubmit) {
    btnSubmit.addEventListener('click', () => runPortfolioAnalysis());
  }

  // Quick ticker recommendation chips
  document.querySelectorAll('.port-quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const ticker = chip.dataset.ticker;
      const price = chip.dataset.price || '';
      const lot = chip.dataset.lot || '20';
      if (inpTicker) inpTicker.value = ticker;
      if (inpBuyPrice && price) inpBuyPrice.value = price;
      if (inpLots && lot) inpLots.value = lot;
      runPortfolioAnalysis();
    });
  });
}

// Menjalankan Analisis Hold vs Cut Loss
async function runPortfolioAnalysis() {
  if (isPortfolioLoading) return;

  const inpTicker = $('portTicker');
  const inpBuyPrice = $('portBuyPrice');
  const inpLots = $('portLots');

  const symbol = (inpTicker?.value || '').trim().toUpperCase();
  const buyPrice = parseFloat(inpBuyPrice?.value || 0);
  const lots = parseInt(inpLots?.value || 0, 10);

  if (!symbol) {
    toast('Masukkan kode saham terlebih dahulu (misal: ANTM)', true);
    inpTicker?.focus();
    return;
  }

  if (!buyPrice || buyPrice <= 0) {
    toast('Masukkan harga beli rata-rata (Avg Price) yang valid', true);
    inpBuyPrice?.focus();
    return;
  }

  if (!lots || lots <= 0) {
    toast('Masukkan jumlah lot yang dipegang (minimal 1 lot)', true);
    inpLots?.focus();
    return;
  }

  const btnSubmit = $('btnAnalyzePortfolio');
  const btnSpinner = $('portBtnSpinner');
  const btnText = $('portBtnText');
  const emptyState = $('portEmptyState');
  const resultCard = $('portResultContainer');
  const errorCard = $('portErrorState');

  isPortfolioLoading = true;
  if (btnSubmit) btnSubmit.disabled = true;
  if (btnSpinner) btnSpinner.classList.remove('hidden');
  if (btnText) btnText.textContent = 'Menganalisis...';
  if (errorCard) errorCard.classList.add('hidden');

  try {
    const res = await fetch(`/api/analyze?symbol=${encodeURIComponent(symbol)}`);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Data saham ${symbol} tidak ditemukan di Bursa Efek Indonesia.`);
    }

    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(`Data tidak valid untuk ${symbol}`);
    }

    const stockData = json.data;

    // Hitung evaluasi Hold vs Cut Loss
    const evaluation = analyzeHoldOrCutLoss({
      buyPrice,
      currentPrice: stockData.price,
      lots,
      bandar: stockData.bandar || {},
      chgPercent: stockData.chgPercent || 0,
      high: stockData.high || stockData.price,
      low: stockData.low || stockData.price,
      dayRange: stockData.dayRange || 0,
      volumeLot: stockData.volumeLot || 0
    });

    currentPortfolioData = {
      stock: stockData,
      eval: evaluation
    };

    renderPortfolioResult(stockData, evaluation);

    if (emptyState) emptyState.classList.add('hidden');
    if (resultCard) resultCard.classList.remove('hidden');

    toast(`Evaluasi portofolio ${symbol} selesai`);
  } catch (err) {
    console.error('Portfolio analysis error:', err);
    if (emptyState) emptyState.classList.add('hidden');
    if (resultCard) resultCard.classList.add('hidden');
    if (errorCard) {
      errorCard.classList.remove('hidden');
      $('portErrorMsg').textContent = err.message || 'Gagal menganalisis saham.';
    }
    toast(err.message, true);
  } finally {
    isPortfolioLoading = false;
    if (btnSubmit) btnSubmit.disabled = false;
    if (btnSpinner) btnSpinner.classList.add('hidden');
    if (btnText) btnText.textContent = '⚡ Analisis Hold atau Cut Loss';
  }
}

// Render Hasil Analisis Portofolio ke DOM
function renderPortfolioResult(stock, ev) {
  const isLoss = ev.lossPct < 0;
  const isProfit = ev.lossPct > 0;

  // 1. Header Ringkasan Saham & Live Price
  $('portResCode').textContent = stock.code;
  $('portResName').textContent = stock.name || stock.code;
  $('portResLivePrice').textContent = rp(stock.price);

  const logoEl = $('portResLogo');
  const fallbackEl = $('portResLogoFallback');
  if (logoEl) {
    logoEl.style.display = 'block';
    logoEl.src = `https://assets.stockbit.com/logos/companies/${stock.code}.png`;
    logoEl.alt = stock.code;
  }
  if (fallbackEl) {
    fallbackEl.classList.add('hidden');
    fallbackEl.textContent = stock.code.slice(0, 2);
  }
  const sectorEl = $('portResSector');
  if (sectorEl) {
    sectorEl.textContent = stock.sector || 'Saham IDX';
  }
  
  const chgEl = $('portResDayChg');
  const isDayUp = (stock.chgPercent || 0) >= 0;
  chgEl.textContent = `${isDayUp ? '+' : ''}${stock.chgPercent}% (${isDayUp ? '+' : ''}${stock.chgPrice || 0})`;
  chgEl.className = `text-xs font-mono font-semibold px-2 py-0.5 rounded ${
    isDayUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
  }`;

  // 2. Summary Card Posisi Portofolio
  $('portValInvested').textContent = rp(ev.totalInvested);
  $('portValCurrent').textContent = rp(ev.currentValue);
  $('portValShares').textContent = `${ev.lots.toLocaleString('id-ID')} lot (${(ev.totalShares).toLocaleString('id-ID')} lbr)`;
  $('portValAvgPrice').textContent = rp(ev.buyPrice);

  const pnlEl = $('portValPnL');
  pnlEl.textContent = `${ev.unrealizedPnL >= 0 ? '+' : '-'}${rp(Math.abs(ev.unrealizedPnL))} (${pct(ev.lossPct)})`;
  pnlEl.className = `text-base sm:text-lg font-bold font-mono ${
    ev.lossPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
  }`;

  // 3. Verdict Utama Banner
  const verdictBanner = $('portVerdictBanner');
  const verdictIcon = $('portVerdictIcon');
  const verdictTitle = $('portVerdictTitle');
  const verdictConfidence = $('portVerdictConfidence');
  const verdictSummary = $('portVerdictSummary');
  const verdictScoreVal = $('portVerdictScoreVal');
  const verdictScoreBar = $('portVerdictScoreBar');

  verdictTitle.textContent = ev.verdict;
  verdictConfidence.textContent = `Tingkat Keyakinan: ${ev.confidence}%`;
  verdictSummary.textContent = ev.summaryHeadline;
  verdictScoreVal.textContent = `${ev.scores.total}/100`;
  verdictScoreBar.style.width = `${Math.min(100, Math.max(5, ev.scores.total))}%`;

  // Styling sesuai tema warna verdict
  if (ev.verdictType === 'CUT_LOSS') {
    verdictBanner.className = 'p-5 sm:p-6 rounded-2xl bg-rose-950/40 border-2 border-rose-600/50 relative overflow-hidden shadow-xl shadow-rose-950/30';
    verdictIcon.innerHTML = `<svg class="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
    verdictTitle.className = 'text-xl sm:text-2xl font-black text-rose-300 tracking-tight';
    verdictScoreBar.className = 'h-full bg-rose-500 rounded-full transition-all duration-500';
  } else if (ev.verdictType === 'HOLD_MONITOR') {
    verdictBanner.className = 'p-5 sm:p-6 rounded-2xl bg-amber-950/40 border-2 border-amber-500/50 relative overflow-hidden shadow-xl shadow-amber-950/30';
    verdictIcon.innerHTML = `<svg class="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
    verdictTitle.className = 'text-xl sm:text-2xl font-black text-amber-300 tracking-tight';
    verdictScoreBar.className = 'h-full bg-amber-500 rounded-full transition-all duration-500';
  } else {
    verdictBanner.className = 'p-5 sm:p-6 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/50 relative overflow-hidden shadow-xl shadow-emerald-950/30';
    verdictIcon.innerHTML = `<svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    verdictTitle.className = 'text-xl sm:text-2xl font-black text-emerald-300 tracking-tight';
    verdictScoreBar.className = 'h-full bg-emerald-500 rounded-full transition-all duration-500';
  }

  // 4. Modul A: Kondisi Teknikal Presisi Fraksi
  const modTech = ev.modules.technical;
  $('portTechStatus').textContent = modTech.status;
  $('portTechScore').textContent = `${modTech.score}/35 Poin`;
  $('portTechDetail').textContent = modTech.detail;
  if ($('portTechTickSize')) $('portTechTickSize').textContent = `Fraksi Rp ${modTech.tickSize} / tick`;
  $('portTechSupport').textContent = `${rp(modTech.supportZone)} (${modTech.supportDistPct}%, ${modTech.supportTicks} fraksi)`;
  $('portTechResistance').textContent = `${rp(modTech.reboundTarget)} (+${modTech.reboundDistPct}%, ${modTech.reboundTicks} fraksi)`;
  $('portTechCritSL').textContent = `${rp(modTech.criticalStopLoss)} (${modTech.critDistPct}%, ${modTech.critTicks} fraksi)`;

  // 5. Modul B: Bandarmologi Real-Time
  const modBandar = ev.modules.bandar;
  $('portBandarScore').textContent = `${modBandar.score}/30 Poin`;
  $('portBandarDetail').textContent = modBandar.detail;
  if ($('portBandarTopBuyers')) $('portBandarTopBuyers').textContent = modBandar.topBuyerCodes || '-';
  if ($('portBandarTopSellers')) $('portBandarTopSellers').textContent = modBandar.topSellerCodes || '-';
  if ($('portBandarNetLot')) {
    const net = modBandar.netLot || 0;
    $('portBandarNetLot').textContent = `${net >= 0 ? '+' : ''}${net.toLocaleString('id-ID')} lot (${modBandar.flowVerdict})`;
    $('portBandarNetLot').className = `font-bold font-mono ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
  }

  const bandarBadge = $('portBandarBadge');
  if (modBandar.isAccum) {
    bandarBadge.textContent = 'AKUMULASI SMART MONEY';
    bandarBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold';
  } else {
    bandarBadge.textContent = modBandar.status && modBandar.status.toUpperCase().includes('BIG') ? 'DISTRIBUSI MASIF' : 'DISTRIBUSI / NETRAL';
    bandarBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold';
  }

  // 6. Modul C: Kalkulator Kerugian & Dana Recovery
  const modRec = ev.modules.recovery;
  $('portRecLossPct').textContent = pct(modRec.lossPct);
  $('portRecLossNominal').textContent = rp(modRec.lossAmount);
  $('portRecBepGain').textContent = `+${modRec.bepGainNeeded.toFixed(2)}%`;
  $('portRecSalvageFunds').textContent = rp(modRec.recycleCapital);
  $('portRecExplanation').textContent = modRec.detail;
  if ($('portRecSwingCycles')) {
    $('portRecSwingCycles').textContent = modRec.swingCyclesNeeded > 0
      ? `~${modRec.swingCyclesNeeded}x siklus swing (+10%)`
      : '0x (Posisi Profit)';
  }

  // Skenario simulasi recycle capital: jika sisa dana dipakai untuk swing di saham sehat (+10% gain)
  const recyclePotentialGain = Math.round(modRec.recycleCapital * 0.10);
  $('portRecycleSimVal').textContent = `+${rp(recyclePotentialGain)}`;

  // 7. Modul D: Batas Waktu Evaluasi & Deadline
  const modDead = ev.modules.deadline;
  $('portDeadDuration').textContent = modDead.evalDays;
  if ($('portDeadDate')) $('portDeadDate').textContent = modDead.deadlineDateStr || '-';
  $('portDeadBounceTarget').textContent = `${rp(modDead.bounceMustHitPrice)} (+${(((modDead.bounceMustHitPrice - stock.price) / stock.price) * 100).toFixed(1)}%)`;
  $('portDeadFloorPrice').textContent = `${rp(modDead.criticalStopLoss)} (${(((modDead.criticalStopLoss - stock.price) / stock.price) * 100).toFixed(1)}%)`;
  $('portDeadActionRule').textContent = modDead.actionRule;

  // 8. Modul E: Saran Averaging Down / Aturan Larangan
  const modAvg = ev.modules.averaging;
  const avgAllowedBox = $('portAvgAllowedBox');
  const avgForbiddenBox = $('portAvgForbiddenBox');

  if (modAvg.isAllowed) {
    avgAllowedBox.classList.remove('hidden');
    avgForbiddenBox.classList.add('hidden');

    $('portAvgBuyPrice').textContent = rp(modAvg.buyPrice);
    $('portAvgAddLots').textContent = `+${modAvg.additionalLots} lot (${(modAvg.additionalLots * 100).toLocaleString('id-ID')} lbr)`;
    $('portAvgAddCapital').textContent = rp(modAvg.additionalCapital);
    $('portAvgNewAvg').textContent = rp(modAvg.newAvgPrice);
    $('portAvgNewBep').textContent = `+${modAvg.newBepGainNeeded.toFixed(2)}% (Sebelumnya: +${ev.bepGainNeeded.toFixed(2)}%)`;
  } else {
    avgAllowedBox.classList.add('hidden');
    avgForbiddenBox.classList.remove('hidden');

    $('portAvgForbiddenMsg').textContent = modAvg.warning || 'Averaging down tidak direkomendasikan pada kondisi ini.';
  }

  // Breakdown 4 Dimensi Scoring Matrix
  $('portScoreTech').textContent = `${ev.scores.technical}/35`;
  $('portScoreBandar').textContent = `${ev.scores.bandar}/30`;
  $('portScoreLoss').textContent = `${ev.scores.loss}/20`;
  $('portScoreVol').textContent = `${ev.scores.volume}/15`;
}
