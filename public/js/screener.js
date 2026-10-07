// Modul Screener Real-time IHSG & Strategi Dinamis

let STOCKS = [];
let prevScreenerPrices = {};
let isBackendConnected = false;
let currentStrategyFilter = 'all';

// Evaluasi Dinamis di Sisi Klien untuk Metrik & Strategi
function evaluateStockDynamically(item) {
  const { price, high, low, volumeLot, chgPercent, bandar } = item;
  const dayRange = high > low ? ((high - low) / low) * 100 : 0;
  const nearHigh = high > 0 && price >= high * 0.985;

  const isBPJS = (dayRange >= 2.5 && volumeLot >= 15000 && chgPercent >= 0) || (volumeLot >= 40000 && chgPercent > 0.5);
  const isBSJP = (nearHigh && chgPercent >= 0.5 && chgPercent <= 7.5 && volumeLot >= 10000) || (chgPercent >= 2 && nearHigh);
  const isBandar = bandar ? bandar.isAccum : false;
  const isTopGainer = (high > 0 && price >= high * 0.97 && chgPercent >= 1.2 && chgPercent <= 9.0 && volumeLot >= 15000 && dayRange >= 2.5 && isBandar);
  const isSwingRebound = (chgPercent <= 1.0 && isBandar && volumeLot >= 10000);

  const strats = [];
  if (isBPJS) strats.push('BPJS');
  if (isBSJP) strats.push('BSJP');
  if (isBandar) strats.push('BANDAR');
  if (isTopGainer) strats.push('TOP_GAINER');
  if (isSwingRebound) strats.push('SWING_REBOUND');
  if (!strats.length && chgPercent >= 0) strats.push('BPJS');

  return {
    ...item,
    dayRange: Number(dayRange.toFixed(2)),
    strategies: strats,
    isBPJS,
    isBSJP,
    isBandar,
    isTopGainer,
    isSwingRebound,
    reasonBPJS: isBPJS ? `Range ${dayRange.toFixed(1)}% • Vol ${volumeLot.toLocaleString('id-ID')} lot` : 'Volatilitas belum optimal',
    reasonBSJP: isBSJP ? `Closing ${((price / high) * 100).toFixed(0)}% Day High` : 'Belum di area pucuk harian',
    reasonBandar: bandar ? bandar.summaryText : 'Belum terdeteksi akumulasi dominan',
    reasonTopGainer: isTopGainer ? 'Momentum Breakout & Akumulasi Bandar' : 'Belum memenuhi kriteria Top Gainer',
    reasonSwing: isSwingRebound ? 'Diskon Sehat & Serap Bawah Smart Money' : 'Belum di area diskon akumulasi'
  };
}

// Mengambil Data Screener Realtime dari Backend
async function fetchRealtimeStocks(silent = false) {
  const badge = $('backendStatusBadge');
  const btnIcon = $('refreshIcon');
  if (!silent && btnIcon) btnIcon.classList.add('spin');

  try {
    const res = await fetch('/api/stocks');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      STOCKS = json.data.map(item =>
        evaluateStockDynamically({
          ...item,
          zoneLow: roundDownTick(item.price * 0.99)
        })
      );
      isBackendConnected = true;
      if (badge) {
        badge.textContent = 'REALTIME';
        badge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium';
      }
      if ($('dataTimestamp')) $('dataTimestamp').textContent = `Live: ${new Date().toLocaleTimeString('id-ID')} WIB`;
      updateStrategyCounters();
      renderScreener();
      if (!silent) toast('Data IHSG diperbarui');
      return;
    }
  } catch (err) {
    isBackendConnected = false;
    if (badge) {
      badge.textContent = 'OFFLINE';
      badge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium';
    }
    if ($('dataTimestamp')) $('dataTimestamp').textContent = 'Mode Offline';
  } finally {
    if (btnIcon) btnIcon.classList.remove('spin');
  }
}

// Memperbarui Badge Hitungan Saham per Preset
function updateStrategyCounters() {
  const countAll = STOCKS.length;
  const countBPJS = STOCKS.filter(x => x.strategies && x.strategies.includes('BPJS')).length;
  const countBSJP = STOCKS.filter(x => x.strategies && x.strategies.includes('BSJP')).length;
  const countBANDAR = STOCKS.filter(x => x.strategies && x.strategies.includes('BANDAR')).length;
  const countTopGainer = STOCKS.filter(x => x.strategies && x.strategies.includes('TOP_GAINER')).length;
  const countSwing = STOCKS.filter(x => x.strategies && x.strategies.includes('SWING_REBOUND')).length;

  if ($('countAll')) $('countAll').textContent = countAll;
  if ($('countBPJS')) $('countBPJS').textContent = countBPJS;
  if ($('countBSJP')) $('countBSJP').textContent = countBSJP;
  if ($('countBANDAR')) $('countBANDAR').textContent = countBANDAR;
  if ($('countTopGainer')) $('countTopGainer').textContent = countTopGainer;
  if ($('countSwing')) $('countSwing').textContent = countSwing;
}

// Merender Grid Kartu Saham dengan Animasi Price Flash & Logo Emiten
function renderScreener() {
  const q = $('searchInput') ? $('searchInput').value.trim().toUpperCase() : '';
  const r = $('riskFilter') ? $('riskFilter').value : 'all';
  const s = $('signalFilter') ? $('signalFilter').value : 'all';

  const list = STOCKS.filter(x => {
    const matchSearch = !q || x.code.includes(q) || x.name.toUpperCase().includes(q);
    const matchRisk = r === 'all' || x.risk === r;
    const matchSig = s === 'all' || x.sig === s;
    const matchStrat = currentStrategyFilter === 'all' || (Array.isArray(x.strategies) && x.strategies.includes(currentStrategyFilter));
    return matchSearch && matchRisk && matchSig && matchStrat;
  });

  const grid = $('stockGrid');
  if (!grid) return;

  if (!list.length) {
    let emptyMsg = `Tidak ada saham yang memenuhi kriteria filter saat ini.`;
    if (s !== 'all') {
      emptyMsg = `Tidak ada saham berstatus <b>${s}</b> pada preset ini.<br><button id="btnResetFilter" class="mt-2.5 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-medium hover:bg-sky-500/20 transition">Reset Filter Sinyal</button>`;
    }
    grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs leading-relaxed">${emptyMsg}</div>`;
    const rBtn = $('btnResetFilter');
    if (rBtn) {
      rBtn.onclick = () => {
        if ($('signalFilter')) $('signalFilter').value = 'all';
        renderScreener();
      };
    }
    return;
  }

  grid.innerHTML = list
    .map(x => {
      const isSwingMode = currentStrategyFilter === 'SWING_REBOUND';
      const tg = isSwingMode ? calcSwingTargets(x.price, 0.04) : calcTradingTargets(x.price, x.sl || 0.02);
      const isUp = (x.chgPercent || 0) >= 0;
      const volFormatted = (x.volumeLot || 0).toLocaleString('id-ID');
      const strats = x.strategies || [];

      // Deteksi animasi Running Tick
      const oldPrice = prevScreenerPrices[x.code];
      let priceFlash = '';
      if (oldPrice !== undefined && oldPrice !== x.price) {
        priceFlash = x.price > oldPrice ? 'flash-up' : 'flash-down';
      }
      prevScreenerPrices[x.code] = x.price;

      // Badges strategi
      const badgesHtml = strats
        .map(st => {
          if (st === 'BPJS') return `<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">BPJS</span>`;
          if (st === 'BSJP') return `<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">BSJP</span>`;
          if (st === 'BANDAR') return `<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">BANDAR AKUM</span>`;
          if (st === 'TOP_GAINER') return `<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">🔥 CALON TOP GAINER</span>`;
          if (st === 'SWING_REBOUND') return `<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">🌊 SWING REBOUND</span>`;
          return '';
        })
        .join(' ');

      // Intraday price slider
      const rangeSpan = Math.max(1, x.high - x.low);
      const rangePos = Math.min(100, Math.max(0, ((x.price - x.low) / rangeSpan) * 100));

      return `<article class="bg-card border border-border rounded-xl p-4 panel-border transition-all space-y-3">
        <!-- Card Header with Stock Logo -->
        <div class="flex justify-between items-start gap-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-9 h-9 rounded-lg bg-base border border-border flex items-center justify-center overflow-hidden shrink-0 p-1">
              <img src="https://assets.stockbit.com/logos/companies/${x.code}.png" 
                   alt="${x.code}" 
                   loading="lazy" 
                   class="w-full h-full object-contain rounded"
                   onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');" />
              <span class="hidden font-mono text-xs font-bold text-slate-300">${x.code.slice(0, 2)}</span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="stock-code-badge font-mono text-base">${x.code}</span>
                <span class="stock-idx-badge">IDX</span>
                ${badgesHtml}
              </div>
              <p class="stock-name-title text-[11px] truncate max-w-[190px] mt-0.5" title="${x.name || x.code}">${x.name || x.code}</p>
            </div>
          </div>
          <span class="text-[10px] font-mono font-medium px-2 py-0.5 rounded ${sigStyle[x.sig] || sigStyle['WAIT & SEE']} shrink-0">${x.sig}</span>
        </div>

        <!-- Price & Intraday Position -->
        <div class="flex items-baseline justify-between pt-1">
          <div>
            <span class="font-mono text-2xl font-bold text-slate-100 tnum px-1 rounded transition-colors ${priceFlash}">${x.price}</span>
            <span class="text-[11px] font-mono text-slate-500 ml-1.5">L: ${x.low} • H: ${x.high}</span>
          </div>
          <div class="text-right">
            <span class="font-mono text-sm font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'} tnum">${pct(x.chgPercent || 0)}</span>
          </div>
        </div>

        <!-- Mini Range Slider Bar -->
        <div class="space-y-1">
          <div class="h-1 bg-base rounded-full overflow-hidden border border-border">
            <div class="h-full bg-slate-400 rounded-full" style="width: ${rangePos}%"></div>
          </div>
          <div class="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Range: ${x.dayRange}%</span>
            <span>Vol: ${volFormatted} lot</span>
          </div>
        </div>

        <!-- Financial & Execution Metrics Grid (6 Tiles) -->
        <div class="grid grid-cols-2 gap-1.5 text-xs font-mono tnum pt-1">
          <div class="bg-base border border-border/80 rounded p-2">
            <div class="text-[10px] text-slate-500 font-sans">Buy Zone</div>
            <div class="text-slate-200 mt-0.5">${x.zoneLow} – ${x.price}</div>
          </div>
          <div class="bg-base border border-border/80 rounded p-2">
            <div class="text-[10px] text-slate-500 font-sans">Harga 1 Lot (100 lbr)</div>
            <div class="text-sky-400 font-semibold mt-0.5">${rp(x.price * 100)}</div>
          </div>
          <div class="bg-emerald-500/5 border border-emerald-500/20 rounded p-2 text-emerald-400">
            <div class="text-[10px] text-slate-500 font-sans">${isSwingMode ? 'TP1 (+10% Swing)' : 'TP1 (+3% Net)'}</div>
            <div class="mt-0.5 font-semibold">${tg.p1} <span class="text-[10px] text-emerald-500/80 font-normal">(+${tg.r1Pct}%)</span></div>
          </div>
          <div class="bg-emerald-500/5 border border-emerald-500/20 rounded p-2 text-emerald-400">
            <div class="text-[10px] text-slate-500 font-sans">${isSwingMode ? 'TP2 (+18% Swing)' : 'TP2 (+5% Net)'}</div>
            <div class="mt-0.5 font-semibold">${tg.p2} <span class="text-[10px] text-emerald-500/80 font-normal">(+${tg.r2Pct}%)</span></div>
          </div>
          <div class="bg-rose-500/5 border border-rose-500/20 rounded p-2 text-rose-400">
            <div class="text-[10px] text-slate-500 font-sans">${isSwingMode ? 'Stop Loss (-4.0% Swing)' : `Stop Loss (-${((x.sl || 0.02) * 100).toFixed(1)}%)`}</div>
            <div class="mt-0.5 font-semibold">${tg.ps} <span class="text-[10px] text-rose-500/80 font-normal">(${tg.rsPct}%)</span></div>
          </div>
          <div class="bg-base border border-border/80 rounded p-2 flex flex-col justify-between">
            <div class="text-[10px] text-slate-500 font-sans">Profil Risiko</div>
            <div class="mt-0.5">
              <span class="text-[10px] font-medium font-sans px-1.5 py-0.5 rounded border ${
                x.risk === 'Low'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : x.risk === 'High'
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              }">
                ${x.risk} Risk
              </span>
            </div>
          </div>
        </div>

        <!-- Takeaway Reason Banner -->
        <div class="bg-base border border-border/70 rounded p-2 text-[11px] leading-relaxed flex items-center justify-between text-slate-400">
          <span class="truncate pr-2">${
            (currentStrategyFilter === 'TOP_GAINER' && x.isTopGainer)
              ? '🔥 Momentum Breakout Sesi 2 & Akumulasi Bandar'
              : (currentStrategyFilter === 'SWING_REBOUND' && x.isSwingRebound)
              ? '🌊 Diskon Sehat & Serap Bawah Smart Money (1–4 Minggu)'
              : (x.reasonBandar || x.reasonBSJP || x.reasonBPJS)
          }</span>
          <span class="font-mono text-[10px] text-slate-500 shrink-0">Tick: Rp ${tickSize(x.price)}</span>
        </div>

        <!-- Action Button (Full Width Analysis) -->
        <div class="pt-1">
          <button data-code="${x.code}" class="use-analyze w-full py-2.5 rounded-lg text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition flex items-center justify-center gap-1.5 shadow-sm">
            <span>Diagnosa & Analisis Saham</span>
            <span class="text-xs">🔍</span>
          </button>
        </div>
      </article>`;
    })
    .join('');
}

// Mengatur Filter Tab Preset Strategi
function setStrategyFilter(strat) {
  currentStrategyFilter = strat;
  document.querySelectorAll('.strat-item').forEach(b => {
    b.classList.toggle('active', b.dataset.strat === strat);
  });

  const banner = $('stratBanner');
  const crit = $('stratCriteria');

  if (strat === 'BPJS') {
    banner.classList.remove('hidden');
    $('stratTitle').textContent = 'Preset: Beli Pagi Jual Sore (BPJS)';
    $('stratDetail').textContent = 'Dirancang untuk scalping harian dengan volatilitas rentang ≥ 2.5% dan volume aktif untuk mengejar target profit 3% – 5% sebelum sesi 2 ditutup.';
    crit.textContent = 'Kriteria Algoritma: Volatilitas Day Range ≥ 2.5% • Volume ≥ 15.000 lot • % Change ≥ 0%';
  } else if (strat === 'BSJP') {
    banner.classList.remove('hidden');
    $('stratTitle').textContent = 'Preset: Beli Sore Jual Pagi (BSJP)';
    $('stratDetail').textContent = 'Dirancang untuk membeli saham yang mengalami akumulasi konsisten dan closing di area pucuk harian (15:30 – 15:50 WIB) untuk menangkap momentum Gap-Up esok pagi (09:00 – 09:15 WIB).';
    crit.textContent = 'Kriteria Algoritma: Bertahan ≥ 98.5% dari Day High • % Change +0.5% s/d +7.5% • Volume ≥ 10.000 lot';
  } else if (strat === 'BANDAR') {
    banner.classList.remove('hidden');
    $('stratTitle').textContent = 'Preset: Akumulasi Bandar (Bandarmologi)';
    $('stratDetail').textContent = 'Mendeteksi saham yang sedang dikoleksi masif oleh Smart Money (broker institusi & asing). Konsentrasi Top Buyer sangat tinggi dibanding penjual yang didominasi investor ritel.';
    crit.textContent = 'Kriteria Algoritma: Status Big / Normal Accumulation • Top Buyer Smart Money Dominan • Sinyal Serap Barang';
  } else if (strat === 'TOP_GAINER') {
    banner.classList.remove('hidden');
    $('stratTitle').textContent = 'Preset: 🔥 Calon Top Gainer Besok (Early Stage Breakout)';
    $('stratDetail').textContent = 'Mendeteksi saham yang baru memulai fase markup/breakout: volume transaksi melonjak signifikan, closing bertahan di pucuk harian (tanpa ekor atas panjang), kenaikan masih di fase awal (+1.2% s/d +9.0%), dan terakumulasi Smart Money institusi. Sangat ideal untuk entry di penutupan Sesi 2 (15:45 WIB) guna menangkap potensi lonjakan harga / gap up di pembukaan esok hari.';
    crit.textContent = 'Kriteria Algoritma: Chg +1.2% s/d +9.0% • Closing ≥ 97% Day High • Vol ≥ 15.000 lot • Big Accumulation • Day Range ≥ 2.5%';
  } else if (strat === 'SWING_REBOUND') {
    banner.classList.remove('hidden');
    $('stratTitle').textContent = 'Preset: 🌊 Swing Rebound / Buy on Weakness (1–4 Minggu)';
    $('stratDetail').textContent = 'Mendeteksi saham yang sedang berada di area diskon/koreksi sehat (% Change ≤ +1.0% atau sedang menguji support kunci), namun di saat bersamaan diakumulasi diam-diam (serap bawah) oleh Smart Money institusi. Dirancang untuk hold santai 1 hingga 4 minggu dengan target keuntungan bertingkat +10% (TP1) hingga +18% (TP2) dan pembatasan risiko Stop Loss -4%.';
    crit.textContent = 'Kriteria Algoritma: % Chg ≤ +1.0% (Diskon/Koreksi) • Akumulasi Bandar Aktif • Volume Transaksi ≥ 10.000 lot';
  } else {
    banner.classList.add('hidden');
  }

  if ($('signalFilter')) $('signalFilter').value = 'all';
  renderScreener();
}

// Inisialisasi Event Screener
function initScreener() {
  ['searchInput', 'riskFilter', 'signalFilter'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('input', renderScreener);
  });

  const stratTabs = $('stratTabs');
  const scrollLeftBtn = $('stratScrollLeft');
  const scrollRightBtn = $('stratScrollRight');

  if (stratTabs) {
    // 1. Mouse Wheel -> Horizontal Scroll
    stratTabs.addEventListener('wheel', e => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        stratTabs.scrollLeft += e.deltaY;
      }
    }, { passive: false });

    // 2. Mouse Drag-to-Scroll (Desktop Touchpad & Mouse)
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasDragged = false;

    stratTabs.addEventListener('mousedown', e => {
      isDown = true;
      hasDragged = false;
      stratTabs.classList.add('active-dragging');
      startX = e.pageX - stratTabs.offsetLeft;
      scrollLeft = stratTabs.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
      if (isDown) {
        isDown = false;
        stratTabs.classList.remove('active-dragging');
      }
    });

    stratTabs.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - stratTabs.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 4) hasDragged = true;
      stratTabs.scrollLeft = scrollLeft - walk;
    });

    // 3. Click Handler (hanya jalan jika bukan hasil drag)
    stratTabs.addEventListener('click', e => {
      if (hasDragged) {
        e.stopPropagation();
        hasDragged = false;
        return;
      }
      const btn = e.target.closest('.strat-item');
      if (!btn) return;
      setStrategyFilter(btn.dataset.strat);
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });

    // 4. Update Status & Visibilitas Panah Navigasi
    const updateScrollArrows = () => {
      const maxScroll = stratTabs.scrollWidth - stratTabs.clientWidth;
      if (scrollLeftBtn) {
        scrollLeftBtn.style.opacity = stratTabs.scrollLeft > 8 ? '1' : '0.2';
        scrollLeftBtn.style.pointerEvents = stratTabs.scrollLeft > 8 ? 'auto' : 'none';
      }
      if (scrollRightBtn) {
        scrollRightBtn.style.opacity = stratTabs.scrollLeft < maxScroll - 8 ? '1' : '0.2';
        scrollRightBtn.style.pointerEvents = stratTabs.scrollLeft < maxScroll - 8 ? 'auto' : 'none';
      }
    };

    stratTabs.addEventListener('scroll', updateScrollArrows);
    window.addEventListener('resize', updateScrollArrows);
    setTimeout(updateScrollArrows, 300);

    if (scrollLeftBtn) {
      scrollLeftBtn.addEventListener('click', () => {
        stratTabs.scrollBy({ left: -220, behavior: 'smooth' });
      });
    }

    if (scrollRightBtn) {
      scrollRightBtn.addEventListener('click', () => {
        stratTabs.scrollBy({ left: 220, behavior: 'smooth' });
      });
    }
  }

  const grid = $('stockGrid');
  if (grid) {
    grid.addEventListener('click', e => {
      const anBtn = e.target.closest('.use-analyze');
      if (anBtn) {
        const code = anBtn.dataset.code;
        if (typeof showTab === 'function') showTab('analyzer');
        if (typeof runStockAnalysis === 'function') runStockAnalysis(code);
      }
    });
  }
}
