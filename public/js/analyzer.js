// Modul Analisis Saham Komprehensif, Order Book 5 Fraksi, Bandarmologi & SOP Sesi 2

let currentAnalyzed = null;
let currentAnalyzedTicker = null;
let analyzerIntervalTimer = null;
let azIntervalSec = 3;
let isAzLivePaused = false;

// Generator Order Book Sisi Klien (Fallback jika belum ada di data)
function generateOrderBookClient(price, volumeLot, chgPercent) {
  const t = tickSize(price);
  const avgLot = Math.max(300, Math.round((volumeLot || 10000) / 25));
  const isUp = (chgPercent || 0) >= 0;
  const bids = [];
  const offers = [];

  for (let i = 1; i <= 5; i++) {
    const bPrice = Math.max(1, price - i * t);
    const bLot = Math.round(avgLot * (isUp ? 1.2 : 0.8) * (0.8 + i * 0.05));
    bids.push({ price: bPrice, lot: bLot });

    const oPrice = price + (i - 1) * t;
    const oLot = Math.round(avgLot * (isUp ? 0.85 : 1.25) * (0.8 + i * 0.05));
    offers.push({ price: oPrice, lot: oLot });
  }

  const totalBidLot = bids.reduce((a, b) => a + b.lot, 0);
  const totalOfferLot = offers.reduce((a, o) => a + o.lot, 0);
  const maxLot = Math.max(...bids.map(b => b.lot), ...offers.map(o => o.lot), 1);

  bids.forEach(b => (b.barPct = Math.round((b.lot / maxLot) * 100)));
  offers.forEach(o => (o.barPct = Math.round((o.lot / maxLot) * 100)));

  const totalAll = totalBidLot + totalOfferLot;
  const bidPct = totalAll > 0 ? Math.round((totalBidLot / totalAll) * 100) : 50;

  return {
    bids,
    offers,
    totalBidLot,
    totalOfferLot,
    bidPct,
    offerPct: 100 - bidPct,
    ratio: (totalBidLot / Math.max(1, totalOfferLot)).toFixed(2),
    verdict:
      totalBidLot >= totalOfferLot
        ? `Bid Dominan (${bidPct}%) • Bantalan beli tebal menahan penurunan`
        : `Offer Dominan (${100 - bidPct}%) • Antrian jual tebal di atas, butuh volume dorongan`
  };
}

// Merender Seluruh Dossier Analisis Saham (Header, 4 Pilar, Order Book, Bandarmologi, SOP Sesi 2)
function renderAnalysisDossier(x, preservedBuyPrice = null) {
  currentAnalyzed = x;
  const tg = calcTradingTargets(x.price, x.sl || 0.02);
  const tgSwing = calcSwingTargets(x.price, 0.04);
  const isUp = (x.chgPercent || 0) >= 0;
  const volFormatted = (x.volumeLot || 0).toLocaleString('id-ID');
  const lotPrice = x.price * 100;
  const rangeSpan = Math.max(1, x.high - x.low);
  const rangePos = Math.min(100, Math.max(0, ((x.price - x.low) / rangeSpan) * 100));
  const distHighPct = x.high > 0 ? (((x.high - x.price) / x.high) * 100).toFixed(1) : '0';

  // Badges Strategi
  const stratBadges = (x.strategies || []).map(st => {
    if (st === 'BPJS') return `<span class="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">BPJS (Intraday)</span>`;
    if (st === 'BSJP') return `<span class="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">BSJP (BTST)</span>`;
    if (st === 'BANDAR') return `<span class="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">Akumulasi: ${x.bandar?.topBuyerCodes || 'Smart Money'}</span>`;
    if (st === 'TOP_GAINER') return `<span class="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">🔥 Calon Top Gainer Besok</span>`;
    if (st === 'SWING_REBOUND') return `<span class="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">🌊 Swing Rebound (1-4 Mg)</span>`;
    return '';
  }).join(' ');

  const isRangeIdeal = x.dayRange >= 2.5;
  const isNearHigh = x.high > 0 && x.price >= x.high * 0.985;
  const ob = x.orderbook || generateOrderBookClient(x.price, x.volumeLot, x.chgPercent);

  // Rows Order Book 5 Fraksi
  const obRowsHtml = [0, 1, 2, 3, 4].map(idx => {
    const b = ob.bids[idx] || { price: 0, lot: 0, barPct: 0 };
    const o = ob.offers[idx] || { price: 0, lot: 0, barPct: 0 };
    return `
      <tr class="hover:bg-slate-800/30 transition text-xs">
        <td class="p-2.5 text-right font-mono text-emerald-300 relative">
          <div class="absolute inset-y-0 right-0 bg-emerald-500/15 rounded-l transition-all duration-500 pointer-events-none" style="width: ${b.barPct || 0}%;"></div>
          <span class="relative z-10 font-medium">${(b.lot || 0).toLocaleString('id-ID')}</span>
        </td>
        <td class="p-2.5 text-right font-mono font-bold text-slate-100 border-r border-border/80">${b.price || '—'}</td>
        <td class="p-2.5 text-left font-mono font-bold text-slate-100 border-l border-border/80">${o.price || '—'}</td>
        <td class="p-2.5 text-left font-mono text-rose-300 relative">
          <div class="absolute inset-y-0 left-0 bg-rose-500/15 rounded-r transition-all duration-500 pointer-events-none" style="width: ${o.barPct || 0}%;"></div>
          <span class="relative z-10 font-medium">${(o.lot || 0).toLocaleString('id-ID')}</span>
        </td>
      </tr>
    `;
  }).join('');

  $('azResultContainer').innerHTML = `
    <!-- 1. Executive Summary Dossier Header -->
    <div class="bg-card border border-border rounded-xl p-5 space-y-4">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <!-- Stock Title & Profile with Official Logo -->
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-xl bg-base border border-border flex items-center justify-center overflow-hidden shrink-0 p-1.5 shadow-sm">
            <img src="https://assets.stockbit.com/logos/companies/${x.code}.png" 
                 alt="${x.code}" 
                 class="w-full h-full object-contain rounded-lg"
                 onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');" />
            <span class="hidden font-mono text-sm font-bold text-slate-300">${x.code.slice(0, 2)}</span>
          </div>
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="stock-code-badge font-mono text-2xl font-extrabold tracking-tight">${x.code}</span>
              <span class="stock-idx-badge text-xs px-2 py-0.5">${x.sector || 'Saham IDX'}</span>
              <span class="text-xs font-mono font-medium px-2 py-0.5 rounded border ${x.risk === 'Low' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : (x.risk === 'High' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20')}">
                ${x.risk} Risk
              </span>
              ${stratBadges}
            </div>
            <p class="stock-name-title text-xs mt-1" title="${x.name || x.code}">${x.name || x.code} • Bursa Efek Indonesia (IDX)</p>
          </div>
        </div>

        <!-- Realtime Price & Intraday Change -->
        <div class="grid grid-cols-3 gap-2 pt-3 border-t border-border/80 lg:border-t-0 lg:pt-0 lg:flex lg:items-center lg:gap-4 lg:text-right">
          <div class="bg-base/70 lg:bg-transparent p-2.5 lg:p-0 rounded-lg border border-border/80 lg:border-0 text-center lg:text-right">
            <div class="text-[10px] sm:text-[11px] text-slate-400 font-medium">Harga Terakhir</div>
            <div id="azLivePrice" class="font-mono text-base sm:text-2xl font-bold text-slate-100 tnum px-1 py-0.5 rounded transition-colors">Rp ${x.price.toLocaleString('id-ID')}</div>
          </div>
          <div class="bg-base/70 lg:bg-transparent p-2.5 lg:p-0 rounded-lg border border-border/80 lg:border-0 lg:border-l lg:border-border lg:pl-4 text-center lg:text-right">
            <div class="text-[10px] sm:text-[11px] text-slate-400 font-medium">Perubahan</div>
            <div id="azLiveChange" class="font-mono text-xs sm:text-lg font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'} tnum">
              ${pct(x.chgPercent || 0)} <span class="hidden sm:inline text-xs font-normal">(${x.chgPrice >= 0 ? '+' : ''}${x.chgPrice || 0})</span>
            </div>
          </div>
          <div class="bg-base/70 lg:bg-transparent p-2.5 lg:p-0 rounded-lg border border-border/80 lg:border-0 lg:border-l lg:border-border lg:pl-4 text-center lg:text-right flex flex-col justify-center">
            <div class="text-[10px] sm:text-[11px] text-slate-400 font-medium">Sinyal</div>
            <span id="azLiveSig" class="inline-block mt-0.5 text-[10px] sm:text-xs font-mono font-semibold px-2 py-0.5 sm:py-1 rounded ${sigStyle[x.sig] || sigStyle['WAIT & SEE']} truncate">${x.sig}</span>
          </div>
        </div>
      </div>

      <!-- Real-Time Streaming Toolbar -->
      <div class="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-border/70 text-xs">
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded ${isAzLivePaused ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'} font-mono text-[11px]">
            <span class="w-2 h-2 rounded-full ${isAzLivePaused ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}"></span>
            <span class="font-semibold" id="azLiveStatusBadge">${isAzLivePaused ? 'PAUSED' : 'LIVE TICKING'}</span>
          </div>
          <span class="text-[11px] text-slate-400 font-mono hidden sm:inline" id="azLiveTickTimestamp">Terakhir: ${ob.tickTime || new Date().toLocaleTimeString('id-ID') + ' WIB'}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1.5 bg-base border border-border rounded-lg px-2 py-1">
            <span class="text-[10px] text-slate-400 font-medium">Sync:</span>
            <select id="azLiveIntervalSelect" class="!bg-transparent !border-0 text-slate-200 text-xs font-mono font-medium p-0 cursor-pointer focus:!ring-0">
              <option value="3" ${azIntervalSec === 3 ? 'selected' : ''}>3s (Ultra)</option>
              <option value="5" ${azIntervalSec === 5 ? 'selected' : ''}>5s</option>
              <option value="10" ${azIntervalSec === 10 ? 'selected' : ''}>10s</option>
            </select>
          </div>
          <button id="azLiveToggleBtn" type="button" class="px-2.5 py-1 rounded-lg bg-elevated hover:bg-slate-700 text-slate-200 text-xs font-mono border border-border flex items-center gap-1.5 transition" title="Jeda atau lanjutkan streaming live">
            <span>${isAzLivePaused ? '▶ Lanjutkan' : '⏸ Jeda'}</span>
          </button>
          <button id="azLiveSyncNowBtn" type="button" class="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-mono border border-sky-500/30 flex items-center gap-1.5 transition" title="Sync manual sekarang">
            <svg id="azSyncIcon" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            <span class="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 2. The 4 Analytical Pillars (2x2 Grid) -->
    <div class="grid md:grid-cols-2 gap-4">
      
      <!-- PILLAR 1: Struktur Fraksi & Likuiditas Transaksi -->
      <div class="bg-card border border-border rounded-xl p-4 space-y-3.5">
        <div class="flex items-center justify-between pb-2 border-b border-border">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-sky-400"></span>
            <h3 class="text-xs font-bold text-slate-200">1. Struktur Fraksi & Nilai Transaksi</h3>
          </div>
          <span class="font-mono text-[11px] text-sky-400 font-medium">Market Structure</span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs font-mono tnum">
          <div class="bg-base border border-border/80 rounded p-2.5">
            <div class="text-[10px] text-slate-400 font-sans">Harga 1 Lot (100 lbr)</div>
            <div class="font-bold text-slate-200 mt-1">${rp(lotPrice)}</div>
          </div>
          <div class="bg-base border border-border/80 rounded p-2.5">
            <div class="text-[10px] text-slate-400 font-sans">Fraksi Harga (Tick)</div>
            <div class="font-bold text-sky-400 mt-1">Rp ${tickSize(x.price)} / tick</div>
          </div>
          <div class="bg-base border border-border/80 rounded p-2.5">
            <div class="text-[10px] text-slate-400 font-sans">Nilai Transaksi (Turnover)</div>
            <div class="font-bold text-slate-200 mt-1">${rp(x.price * (x.volumeLot || 0) * 100)}</div>
          </div>
          <div class="bg-base border border-border/80 rounded p-2.5">
            <div class="text-[10px] text-slate-400 font-sans">Karakter Volatilitas</div>
            <div class="font-bold ${x.dayRange >= 3 ? 'text-emerald-400' : 'text-slate-300'} mt-1">${x.dayRange >= 3 ? 'High Volatility' : (x.dayRange >= 1.5 ? 'Normal Intraday' : 'Konsolidasi / Sempit')}</div>
          </div>
        </div>

        <div class="p-3 rounded-lg bg-base border border-border/80 text-xs flex items-start gap-2.5 text-slate-300">
          <span class="text-sm">⚡</span>
          <div>
            <b class="font-semibold text-slate-200">Fraksi IDX Rp ${tickSize(x.price)} (${((tickSize(x.price) / x.price) * 100).toFixed(2)}% per Tick)</b>
            <p class="mt-0.5 text-[11px] leading-relaxed text-slate-400">Kenaikan 1 tick menghasilkan persentase profit bersih setelah fee. Sangat efisien untuk strategi scalping cepat dan swing harian.</p>
          </div>
        </div>
      </div>

      <!-- PILLAR 2: Volatilitas & Posisi Intraday -->
      <div class="bg-card border border-border rounded-xl p-4 space-y-3.5">
        <div class="flex items-center justify-between pb-2 border-b border-border">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <h3 class="text-xs font-bold text-slate-200">2. Momentum & Rentang Intraday</h3>
          </div>
          <span class="font-mono text-[11px] text-emerald-400 font-medium">Volatility Check</span>
        </div>

        <div class="grid grid-cols-3 gap-2 text-xs font-mono tnum">
          <div class="bg-base border border-border/80 rounded p-2">
            <div class="text-[10px] text-slate-400 font-sans">Rentang Hari Ini</div>
            <div class="font-bold text-slate-200 mt-1">${x.low} – ${x.high}</div>
          </div>
          <div class="bg-base border border-border/80 rounded p-2">
            <div class="text-[10px] text-slate-400 font-sans">Day Range (%)</div>
            <div class="font-bold ${isRangeIdeal ? 'text-emerald-400' : 'text-amber-400'} mt-1">${x.dayRange}%</div>
          </div>
          <div class="bg-base border border-border/80 rounded p-2">
            <div class="text-[10px] text-slate-400 font-sans">Volume Sesi Ini</div>
            <div class="font-bold text-slate-200 mt-1">${volFormatted} lot</div>
          </div>
        </div>

        <!-- Price Range Slider -->
        <div class="space-y-1.5 bg-base border border-border/80 p-3 rounded-lg">
          <div class="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Low: ${x.low}</span>
            <span class="text-sky-300 font-semibold">Posisi: ${x.price} (${distHighPct}% dari High)</span>
            <span>High: ${x.high}</span>
          </div>
          <div class="h-2 bg-slate-800 rounded-full overflow-hidden border border-border">
            <div class="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full" style="width: ${rangePos}%"></div>
          </div>
          <p class="text-[11px] text-slate-400 leading-relaxed pt-1">
            ${isRangeIdeal ? '✅ Volatilitas memadai (≥ 2.5%), terdapat ruang cukup untuk target TP 3%–5%.' : '⚠️ Volatilitas tergolong sempit (< 2.5%), pergerakan terbatas untuk scalping agresif.'}
            ${isNearHigh ? '🔥 Harga bertahan di pucuk harian (≥ 98.5% High), mencerminkan akumulasi kuat.' : ''}
          </p>
        </div>
      </div>

      <!-- PILLAR 3: Evaluasi Preset BPJS, BSJP & Swing -->
      <div class="bg-card border border-border rounded-xl p-4 space-y-3.5">
        <div class="flex items-center justify-between pb-2 border-b border-border">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-purple-400"></span>
            <h3 class="text-xs font-bold text-slate-200">3. Uji Kesesuaian Strategi & Preset</h3>
          </div>
          <span class="font-mono text-[11px] text-purple-400 font-medium">Algorithmic Match</span>
        </div>

        <div class="space-y-2.5 text-xs">
          <!-- BPJS Sub-card -->
          <div class="p-3 rounded-lg bg-base border ${x.isBPJS ? 'border-amber-500/30 bg-amber-950/10' : 'border-border'} space-y-1.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <b class="text-slate-200">Beli Pagi Jual Sore (BPJS)</b>
                <span class="text-[10px] font-mono text-slate-500">09:00 – 15:45 WIB</span>
              </div>
              <span class="font-mono text-[10px] px-2 py-0.5 rounded ${x.isBPJS ? 'bg-amber-500/20 text-amber-300 font-bold' : 'bg-slate-800 text-slate-500'}">
                ${x.isBPJS ? 'COCOK (PASS)' : 'TIDAK DISARANKAN'}
              </span>
            </div>
            <p class="text-[11px] text-slate-400 leading-relaxed">${x.reasonBPJS}</p>
          </div>

          <!-- BSJP Sub-card -->
          <div class="p-3 rounded-lg bg-base border ${x.isBSJP ? 'border-purple-500/30 bg-purple-950/10' : 'border-border'} space-y-1.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <b class="text-slate-200">Beli Sore Jual Pagi (BSJP)</b>
                <span class="text-[10px] font-mono text-slate-500">15:30 WIB – Besok Pagi</span>
              </div>
              <span class="font-mono text-[10px] px-2 py-0.5 rounded ${x.isBSJP ? 'bg-purple-500/20 text-purple-300 font-bold' : 'bg-slate-800 text-slate-500'}">
                ${x.isBSJP ? 'COCOK (PASS)' : 'TIDAK DISARANKAN'}
              </span>
            </div>
            <p class="text-[11px] text-slate-400 leading-relaxed">${x.reasonBSJP}</p>
          </div>

          <!-- Swing Rebound Sub-card -->
          <div class="p-3 rounded-lg bg-base border ${x.isSwingRebound ? 'border-indigo-500/30 bg-indigo-950/10' : 'border-border'} space-y-1.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <b class="text-slate-200">🌊 Swing Rebound (Buy on Weakness)</b>
                <span class="text-[10px] font-mono text-indigo-400">1 – 4 Minggu</span>
              </div>
              <span class="font-mono text-[10px] px-2 py-0.5 rounded ${x.isSwingRebound ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'bg-slate-800 text-slate-500'}">
                ${x.isSwingRebound ? 'COCOK (PASS)' : 'TIDAK DISARANKAN'}
              </span>
            </div>
            <p class="text-[11px] text-slate-400 leading-relaxed">${x.reasonSwing || (x.isSwingRebound ? 'Diskon Sehat & Serap Bawah Smart Money' : 'Harga belum di area diskon koreksi sehat')}</p>
          </div>
        </div>
      </div>

      <!-- PILLAR 4: Rencana Eksekusi Trading Plan -->
      <div class="bg-card border border-border rounded-xl p-4 space-y-3.5">
        <div class="flex items-center justify-between pb-2 border-b border-border">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <h3 class="text-xs font-bold text-slate-200">4. Precision Trading Plan (IDX Ticks)</h3>
          </div>
          <span class="font-mono text-[11px] text-amber-400 font-medium">Scalp RR 1 : ${tg.rrRatio}</span>
        </div>

        <!-- Scalping Plan (BPJS / BSJP) -->
        <div class="grid grid-cols-3 gap-2 text-xs font-mono tnum">
          <div class="bg-emerald-500/5 border border-emerald-500/20 rounded p-2.5 text-emerald-400">
            <div class="text-[10px] text-slate-400 font-sans">Target 1 (+3% Net)</div>
            <div class="text-base font-bold mt-0.5">${tg.p1}</div>
            <div class="text-[10px] text-emerald-400 font-sans mt-0.5">+${tg.r1Pct}% Net</div>
          </div>
          <div class="bg-emerald-500/5 border border-emerald-500/20 rounded p-2.5 text-emerald-400">
            <div class="text-[10px] text-slate-400 font-sans">Target 2 (+5% Net)</div>
            <div class="text-base font-bold mt-0.5">${tg.p2}</div>
            <div class="text-[10px] text-emerald-400 font-sans mt-0.5">+${tg.r2Pct}% Net</div>
          </div>
          <div class="bg-rose-500/5 border border-rose-500/20 rounded p-2.5 text-rose-400">
            <div class="text-[10px] text-slate-400 font-sans">Stop Loss (-${((x.sl || 0.02) * 100).toFixed(1)}%)</div>
            <div class="text-base font-bold mt-0.5">${tg.ps}</div>
            <div class="text-[10px] text-rose-400 font-sans mt-0.5">${tg.rsPct}% Net</div>
          </div>
        </div>

        <!-- Swing Rebound Plan (1-4 Minggu) -->
        <div class="p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-xs space-y-1.5">
          <div class="flex items-center justify-between text-indigo-300 font-semibold text-[11px]">
            <span>🌊 Swing Target Plan (Horizon 1–4 Minggu)</span>
            <span class="font-mono text-[10px] text-indigo-400">RR 1 : ${tgSwing.rrRatio}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 font-mono tnum">
            <div class="bg-base/70 border border-border rounded p-2 text-emerald-400 text-center">
              <div class="text-[10px] text-slate-400 font-sans">TP1 (+10%)</div>
              <div class="font-bold text-xs mt-0.5">${tgSwing.p1}</div>
              <div class="text-[9px] text-emerald-400/80 font-sans">+${tgSwing.r1Pct}%</div>
            </div>
            <div class="bg-base/70 border border-border rounded p-2 text-emerald-400 text-center">
              <div class="text-[10px] text-slate-400 font-sans">TP2 (+18%)</div>
              <div class="font-bold text-xs mt-0.5">${tgSwing.p2}</div>
              <div class="text-[9px] text-emerald-400/80 font-sans">+${tgSwing.r2Pct}%</div>
            </div>
            <div class="bg-base/70 border border-border rounded p-2 text-rose-400 text-center">
              <div class="text-[10px] text-slate-400 font-sans">SL (-4.0%)</div>
              <div class="font-bold text-xs mt-0.5">${tgSwing.ps}</div>
              <div class="text-[9px] text-rose-400/80 font-sans">${tgSwing.rsPct}%</div>
            </div>
          </div>
        </div>

        <p class="text-[10px] text-slate-500 font-mono">
          * Fee beli 0.15% & fee jual 0.25% dihitung bersih. Harga TP dibulatkan ke atas, SL dibulatkan ke bawah ke fraksi IDX (Rp ${tickSize(x.price)}).
        </p>
      </div>

    </div>

    <!-- ORDER BOOK & MARKET DEPTH (5 FRAKSI BID VS OFFER) -->
    <div class="bg-card border border-border rounded-xl p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs font-mono">OB</div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Order Book & Market Depth</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-base text-slate-400 border border-border">5 Fraksi Teratas</span>
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Antrian beli (Bid) vs antrian jual (Offer) real-time bursa IDX.</p>
          </div>
        </div>
        <div class="flex items-center gap-3 font-mono text-xs">
          <span class="text-slate-400 text-[11px]">Rasio Bid/Offer:</span>
          <span class="font-bold px-2.5 py-1 rounded bg-base border border-border ${ob.totalBidLot >= ob.totalOfferLot ? 'text-emerald-400' : 'text-rose-400'}">${ob.ratio} : 1</span>
        </div>
      </div>

      <!-- Ratio Visual Distribution Strip -->
      <div class="space-y-1.5">
        <div class="flex justify-between text-[11px] font-mono">
          <span class="text-emerald-400 font-semibold flex items-center gap-1">
            <span>BID ${ob.bidPct}%</span>
            <span class="text-slate-500 font-normal">(${ob.totalBidLot.toLocaleString('id-ID')} lot)</span>
          </span>
          <span class="text-rose-400 font-semibold flex items-center gap-1">
            <span class="text-slate-500 font-normal">(${ob.totalOfferLot.toLocaleString('id-ID')} lot)</span>
            <span>OFFER ${ob.offerPct}%</span>
          </span>
        </div>
        <div class="h-2 bg-slate-900 rounded-full overflow-hidden flex border border-border">
          <div class="bg-emerald-500 transition-all duration-500" style="width: ${ob.bidPct}%"></div>
          <div class="bg-rose-500 transition-all duration-500" style="width: ${ob.offerPct}%"></div>
        </div>
      </div>

      <!-- Order Book Dual Table -->
      <div class="overflow-hidden rounded-lg border border-border bg-base text-xs">
        <table class="w-full text-xs font-mono tnum">
          <thead class="border-b border-border text-[10px] sm:text-[11px] bg-card/60">
            <tr>
              <th class="p-1.5 sm:p-2.5 text-right font-semibold text-emerald-400/90 w-1/4">
                <span class="hidden sm:inline">Antrian </span>Bid<span class="hidden sm:inline"> (Lot)</span>
                <span class="inline sm:hidden">Lot</span>
              </th>
              <th class="p-1.5 sm:p-2.5 text-right font-semibold text-emerald-400 w-1/4 border-r border-border/80">Bid</th>
              <th class="p-1.5 sm:p-2.5 text-left font-semibold text-rose-400 w-1/4 border-l border-border/80">Offer</th>
              <th class="p-1.5 sm:p-2.5 text-left font-semibold text-rose-400/90 w-1/4">
                <span class="inline sm:hidden">Lot</span>
                <span class="hidden sm:inline">Antrian </span>Offer<span class="hidden sm:inline"> (Lot)</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y border-border">
            ${obRowsHtml}
          </tbody>
          <tfoot class="border-t border-border bg-card/40 font-bold text-[10px] sm:text-[11px]">
            <tr>
              <td class="p-1.5 sm:p-2.5 text-right text-emerald-400">${ob.totalBidLot.toLocaleString('id-ID')}</td>
              <td class="p-1.5 sm:p-2.5 text-right text-slate-400 border-r border-border/80 font-sans">Total Bid</td>
              <td class="p-1.5 sm:p-2.5 text-left text-slate-400 border-l border-border/80 font-sans">Total Offer</td>
              <td class="p-1.5 sm:p-2.5 text-left text-rose-400">${ob.totalOfferLot.toLocaleString('id-ID')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Order Book Insight Box -->
      <div class="p-3 rounded-lg bg-base border border-border text-[11px] flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full ${ob.totalBidLot >= ob.totalOfferLot ? 'bg-emerald-400' : 'bg-rose-400'}"></span>
          <span class="text-slate-300">${ob.verdict}</span>
        </div>
        <span class="font-mono text-slate-500 text-[10px]">Spread Fraksi: Rp ${tickSize(x.price)}</span>
      </div>
    </div>

    <!-- BANDARMOLOGI & BROKER SUMMARY (TOP BUYERS VS TOP SELLERS) -->
    <div class="bg-card border border-border rounded-xl p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div class="flex items-center gap-2.5">
          <span class="w-2.5 h-2.5 rounded-full ${x.bandar?.isAccum ? 'bg-emerald-400 animate-pulse' : (x.bandar?.status.includes('Distribution') ? 'bg-rose-400 animate-pulse' : 'bg-slate-400')}"></span>
          <div>
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Bandarmologi & Broker Summary</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded ${x.bandar?.isAccum ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (x.bandar?.status.includes('Distribution') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-base text-slate-400 border border-border')} font-semibold">
                ${x.bandar?.status || 'Neutral'}
              </span>
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Peta serap Smart Money (Top Buyers) vs aksi jual (Top Sellers) pada sesi berjalan.</p>
          </div>
        </div>
        <div class="flex items-center gap-2 font-mono text-xs">
          <span class="text-slate-400 text-[11px]">Skor Akumulasi:</span>
          <span class="font-bold px-2.5 py-1 rounded bg-base border border-border ${x.bandar?.score >= 70 ? 'text-emerald-400' : (x.bandar?.score <= 35 ? 'text-rose-400' : 'text-slate-200')}">${x.bandar?.score || 50}/100</span>
        </div>
      </div>

      <!-- Top Buyers vs Top Sellers Dual Tables -->
      <div class="grid lg:grid-cols-2 gap-4">
        <!-- Top Buyers Table -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-semibold text-emerald-400">
            <span class="flex items-center gap-1.5">
              <span>▲ TOP 3 BUYERS (AKUMULASI / SERAP)</span>
            </span>
            <span class="text-[10px] font-mono text-slate-400 font-normal">Porsi Serap: ~${(x.bandar?.topBuyers || []).reduce((a, b) => a + b.sharePct, 0)}%</span>
          </div>
          <div class="overflow-x-auto rounded-lg border border-border bg-base text-xs">
            <table class="w-full text-xs">
              <thead class="border-b border-border text-slate-400 text-[11px] bg-card/60">
                <tr>
                  <th class="p-2.5 text-left font-semibold">Broker</th>
                  <th class="p-2.5 text-left font-semibold">Tipe</th>
                  <th class="p-2.5 text-right font-semibold">Volume (Lot)</th>
                  <th class="p-2.5 text-right font-semibold">Avg Buy</th>
                  <th class="p-2.5 text-right font-semibold">Porsi</th>
                </tr>
              </thead>
              <tbody class="divide-y border-border font-mono tnum text-[11px]">
                ${(x.bandar?.topBuyers || []).map(b => `
                  <tr>
                    <td class="p-2.5 font-bold text-emerald-400">${b.broker} <span class="font-normal text-[10px] text-slate-500 font-sans">${b.name}</span></td>
                    <td class="p-2.5 text-slate-400 font-sans text-[10px]">${b.type}</td>
                    <td class="p-2.5 text-right text-slate-200">${b.lot.toLocaleString('id-ID')}</td>
                    <td class="p-2.5 text-right font-bold text-slate-100">${rp(b.avg)}</td>
                    <td class="p-2.5 text-right text-emerald-400 font-semibold">${b.sharePct}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Sellers Table -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-semibold text-rose-400">
            <span class="flex items-center gap-1.5">
              <span>▼ TOP 3 SELLERS (DISTRIBUSI / PELEPAS)</span>
            </span>
            <span class="text-[10px] font-mono text-slate-400 font-normal">Porsi Jual: ~${(x.bandar?.topSellers || []).reduce((a, b) => a + b.sharePct, 0)}%</span>
          </div>
          <div class="overflow-x-auto rounded-lg border border-border bg-base text-xs">
            <table class="w-full text-xs">
              <thead class="border-b border-border text-slate-400 text-[11px] bg-card/60">
                <tr>
                  <th class="p-2.5 text-left font-semibold">Broker</th>
                  <th class="p-2.5 text-left font-semibold">Tipe</th>
                  <th class="p-2.5 text-right font-semibold">Volume (Lot)</th>
                  <th class="p-2.5 text-right font-semibold">Avg Sell</th>
                  <th class="p-2.5 text-right font-semibold">Porsi</th>
                </tr>
              </thead>
              <tbody class="divide-y border-border font-mono tnum text-[11px]">
                ${(x.bandar?.topSellers || []).map(s => `
                  <tr>
                    <td class="p-2.5 font-bold text-rose-400">${s.broker} <span class="font-normal text-[10px] text-slate-500 font-sans">${s.name}</span></td>
                    <td class="p-2.5 text-slate-400 font-sans text-[10px]">${s.type}</td>
                    <td class="p-2.5 text-right text-slate-200">${s.lot.toLocaleString('id-ID')}</td>
                    <td class="p-2.5 text-right font-bold text-slate-100">${rp(s.avg)}</td>
                    <td class="p-2.5 text-right text-rose-400 font-semibold">${s.sharePct}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Bandarmologi Takeaway Insight Box -->
      <div class="p-3.5 rounded-lg bg-base border border-border/80 text-xs space-y-1.5 leading-relaxed">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full ${x.bandar?.isAccum ? 'bg-emerald-400' : 'bg-slate-400'}"></span>
          <b class="text-slate-200">Takeaway Smart Money & Arus Dana:</b>
        </div>
        <p class="text-slate-300 text-[11px] leading-relaxed">
          ${x.bandar?.summaryText || 'Peta transaksi berimbang antara broker pembeli dan penjual.'}
        </p>
      </div>
    </div>

    <!-- 4. SOP EVALUASI SESI 2 & PENANGANAN SAHAM STAGNAN / FLOATING LOSS -->
    <div class="bg-card border border-border rounded-xl p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">S2</div>
          <div>
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>SOP Evaluasi Sesi 2 & Penanganan Saham Stagnan</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">EXIT PROTOCOL</span>
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Panduan keputusan jika harga tidak kunjung naik atau mulai turun menjelang penutupan sesi 2 (15:30 – 16:00 WIB).</p>
          </div>
        </div>

        <!-- Interactive Buy Price Input -->
        <div class="flex items-center gap-2 bg-base border border-border px-3 py-1.5 rounded-lg">
          <label for="sopBuyPrice" class="text-[11px] text-slate-400 whitespace-nowrap">Harga Beli Anda:</label>
          <div class="flex items-center gap-1 font-mono text-xs">
            <span class="text-slate-500">Rp</span>
            <input id="sopBuyPrice" type="number" step="1" value="${preservedBuyPrice !== null ? preservedBuyPrice : x.price}" class="w-16 bg-transparent font-bold text-sky-400 text-center focus:outline-none !border-0 !p-0">
          </div>
        </div>
      </div>

      <!-- Live Position State Ribbon -->
      <div id="sopLiveRibbon" class="p-3 rounded-lg bg-base border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"></div>

      <!-- 3 Decision Branches -->
      <div class="grid md:grid-cols-3 gap-3 text-xs">
        <!-- Branch 1: Level Stop Loss Hit -->
        <div id="sopCardSL" class="p-3.5 rounded-lg border border-border bg-base space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-rose-400 flex items-center gap-1">
              <span>1. Kena Stop Loss</span>
            </span>
            <span id="sopSlPriceBadge" class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold">≤ Rp ${tg.ps}</span>
          </div>
          <b class="text-slate-200 block text-[11px]">Tindakan: CUT LOSS Langsung</b>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            Jika harga menyentuh atau jebol ke bawah level ini, disiplin buang posisi. Kerugian terkunci maksimal <b class="text-rose-300 font-mono">-${((x.sl || 0.02) * 100).toFixed(1)}% (Rp ${tg.ps})</b>. Modal transaksi terlindungi untuk peluang berikutnya.
          </p>
        </div>

        <!-- Branch 2: Stagnant / 1 Tick Down -->
        <div id="sopCardStagnant" class="p-3.5 rounded-lg border border-sky-500/30 bg-sky-950/10 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sky-300 flex items-center gap-1">
              <span>2. Stagnan / Turun 1 Tick</span>
            </span>
            <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">15:30 – 15:45 WIB</span>
          </div>
          <b class="text-slate-200 block text-[11px]">Pilihan A: Disiplin BPJS (Sangat Disarankan)</b>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            Pasang antrian jual di harga modal (antri BEP di harga beli) atau jual di 1 tick bawah sebelum 15:45 WIB. Kas utuh kembali, malam hari tidur tenang tanpa beban risiko pasar global.
          </p>
        </div>

        <!-- Branch 3: Hold to BSJP Criteria -->
        <div id="sopCardHold" class="p-3.5 rounded-lg border border-border bg-base space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-purple-400 flex items-center gap-1">
              <span>3. Boleh Menginap (BSJP)?</span>
            </span>
            <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">3 Syarat Ketat</span>
          </div>
          <b class="text-slate-200 block text-[11px]">Hanya jika lolos 3 kriteria:</b>
          <ul class="text-[11px] text-slate-400 space-y-1">
            <li class="flex items-start gap-1">
              <span class="${x.bandar?.isAccum ? 'text-emerald-400' : 'text-slate-500'}">✓</span>
              <span>Bandar akumulasi: <b class="${x.bandar?.isAccum ? 'text-emerald-300' : 'text-slate-400'}">${x.bandar?.isAccum ? 'Ya (' + x.bandar.topBuyerCodes + ')' : 'Belum'}</b></span>
            </li>
            <li class="flex items-start gap-1">
              <span class="${x.price >= x.high * 0.985 ? 'text-emerald-400' : 'text-slate-500'}">✓</span>
              <span>Closing pucuk: <b class="${x.price >= x.high * 0.985 ? 'text-emerald-300' : 'text-slate-400'}">${x.price >= x.high * 0.985 ? 'Ya (≥98.5% High)' : 'Tidak (' + x.price + '/' + x.high + ')'}</b></span>
            </li>
            <li class="flex items-start gap-1">
              <span class="text-slate-400">✓</span>
              <span>Antrian Bid tebal di 1-2 tick bawah.</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Execution Auto Order Guide for Tomorrow Morning -->
      <div class="p-3.5 rounded-lg bg-base border border-border/80 text-xs space-y-2 leading-relaxed">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-sky-400"></span>
          <b class="text-slate-200">Jika Memutuskan Hold Sampai Besok Pagi:</b>
        </div>
        <div class="grid sm:grid-cols-2 gap-3 text-[11px] text-slate-400 pt-1">
          <div class="space-y-1">
            <span class="font-semibold text-slate-300">1. Pasang Auto Order Stockbit Malam Ini / Sebelum 08:59 WIB:</span>
            <p>• Limit Sell Take Profit di harga <b class="font-mono text-emerald-400" id="sopTpPreview">+2 tick (${roundUpTick(x.price * 1.015)})</b></p>
            <p>• Stop Loss Otomatis jika tembus <b class="font-mono text-rose-400" id="sopSlPreview">Rp ${tg.ps}</b></p>
          </div>
          <div class="space-y-1">
            <span class="font-semibold text-slate-300">2. Disiplin Batas Waktu 15 Menit Pagi:</span>
            <p>Saham menginap wajib mendapat dorongan di jam <b class="text-slate-200">09:00 – 09:15 WIB</b>. Jika lewat pukul 09:15 WIB harga gagal naik, segera likuidasi posisi agar modal kas tidak terkunci seharian.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. Action Toolbar (Bottom Integration) -->
    <div class="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="text-xs text-slate-400">
        Rencana siap dieksekusi? Salin trading plan ke clipboard atau periksa chart interaktif di Stockbit.
      </div>
      <div class="flex items-center gap-2 flex-wrap w-full sm:w-auto">
        <button onclick="copyAnalyzedPlan('${x.code}', ${x.price}, ${tg.p1}, ${tg.r1Pct}, ${tg.p2}, ${tg.r2Pct}, ${tg.ps}, ${tg.rsPct})"
          class="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold bg-sky-400 text-slate-900 hover:bg-sky-300 transition flex items-center justify-center gap-1.5 shadow-sm">
          <span>📋 Salin Trading Plan</span>
        </button>
        <a href="https://stockbit.com/symbol/${x.code}" target="_blank" rel="noopener noreferrer"
          class="flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-xs font-semibold bg-base text-slate-300 hover:text-white border border-border transition flex items-center justify-center gap-1">
          <span>Chart Stockbit</span>
          <span class="text-slate-500 text-[10px]">↗</span>
        </a>
      </div>
    </div>
  `;

  // Attach interactive SOP Scenario calculator
  const sopInp = $('sopBuyPrice');
  if (sopInp) {
    updateSopCalculator(x, +sopInp.value || x.price);
    sopInp.oninput = () => updateSopCalculator(x, +sopInp.value || x.price);
  }

  // Attach Realtime Live Toolbar Event Handlers
  const toggleBtn = $('azLiveToggleBtn');
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      isAzLivePaused = !isAzLivePaused;
      const badge = $('azLiveStatusBadge');
      if (badge) {
        badge.textContent = isAzLivePaused ? 'PAUSED' : 'LIVE TICKING';
        badge.className = isAzLivePaused ? 'font-semibold text-amber-300' : 'font-semibold text-emerald-400';
      }
      toggleBtn.querySelector('span').textContent = isAzLivePaused ? '▶ Lanjutkan' : '⏸ Jeda';
      if (!isAzLivePaused && currentAnalyzedTicker) {
        fetchLiveTickerData(currentAnalyzedTicker, true);
        startAnalyzerRealtimeEngine(currentAnalyzedTicker);
      } else {
        clearInterval(analyzerIntervalTimer);
      }
    };
  }

  const intSelect = $('azLiveIntervalSelect');
  if (intSelect) {
    intSelect.onchange = e => {
      azIntervalSec = parseInt(e.target.value, 10) || 3;
      if (!isAzLivePaused && currentAnalyzedTicker) {
        startAnalyzerRealtimeEngine(currentAnalyzedTicker);
      }
    };
  }

  const syncBtn = $('azLiveSyncNowBtn');
  if (syncBtn) {
    syncBtn.onclick = () => {
      if (currentAnalyzedTicker) fetchLiveTickerData(currentAnalyzedTicker, true);
    };
  }
}

// Menghitung Ulang Posisi Floating P/L & Ribbon SOP
function updateSopCalculator(x, buyPrice) {
  const entry = Math.max(1, buyPrice);
  const cur = x.price;
  const t = tickSize(entry);
  const sl = stopLossPrice(entry, x.sl || 0.02);
  const diff = cur - entry;
  const diffTicks = Math.round(diff / t);
  const feeBuy = typeof FEE_BUY !== 'undefined' ? FEE_BUY : 0.0015;
  const feeSell = typeof FEE_SELL !== 'undefined' ? FEE_SELL : 0.0025;
  const netReturnPct = (((cur * (1 - feeSell)) - (entry * (1 + feeBuy))) / (entry * (1 + feeBuy))) * 100;
  const netPerLotRp = Math.round((cur * 100 * (1 - feeSell)) - (entry * 100 * (1 + feeBuy)));

  const ribbon = $('sopLiveRibbon');
  if (!ribbon) return;

  let stateText = '';
  let stateClass = '';
  if (cur <= sl) {
    stateText = `🚨 Posisi Menembus Batas Stop Loss! (${pct(netReturnPct)} / ${rp(netPerLotRp)} per lot) — Wajib Cut Loss Segera`;
    stateClass = 'bg-rose-500/10 border-rose-500/30 text-rose-300';
  } else if (diff < 0) {
    stateText = `⚠️ Posisi Floating Loss (${diffTicks} tick / ${pct(netReturnPct)}) — Pertimbangkan Antri BEP / Jual 15:30 WIB`;
    stateClass = 'bg-amber-500/10 border-amber-500/30 text-amber-300';
  } else if (diff === 0) {
    stateText = `⚖️ Posisi Impas di Harga Modal (Rp ${entry}) — Siap-siap Likuidasi Sore jika Tidak Naik`;
    stateClass = 'bg-sky-500/10 border-sky-500/30 text-sky-300';
  } else {
    stateText = `🟢 Posisi Floating Profit (+${diffTicks} tick / ${pct(netReturnPct)}) • Net: +${rp(netPerLotRp)}/lot — Pasang Trailing Stop`;
    stateClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
  }

  ribbon.className = `p-3 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs ${stateClass}`;
  ribbon.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="font-bold">${stateText}</span>
    </div>
    <div class="font-mono text-[11px] text-slate-300">
      Harga Live: <b>Rp ${cur}</b> • Modal Beli: <b>Rp ${entry}</b>
    </div>
  `;

  if ($('sopSlPriceBadge')) $('sopSlPriceBadge').textContent = `≤ Rp ${sl}`;
  if ($('sopSlPreview')) $('sopSlPreview').textContent = `Rp ${sl}`;
  if ($('sopTpPreview')) $('sopTpPreview').textContent = `+2 tick (${roundUpTick(entry + 2 * t)})`;
}

// Mengambil Data Live Saham untuk Analisis Dossier
async function fetchLiveTickerData(symbol, isBackground = false) {
  if (!symbol) return;
  const input = $('azInput');
  const btnText = $('azBtnText');
  const spinner = $('azSpinner');
  const emptyState = $('azEmptyState');
  const resultContainer = $('azResultContainer');
  const syncIcon = $('azSyncIcon');

  if (!isBackground) {
    if (input) input.value = symbol;
    if (btnText) btnText.textContent = 'Menganalisis...';
    if (spinner) spinner.classList.remove('hidden');
  } else {
    if (syncIcon) syncIcon.classList.add('spin');
  }

  try {
    const res = await fetch(`/api/analyze?symbol=${encodeURIComponent(symbol)}`);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Data saham ${symbol} tidak ditemukan di IDX`);
    }
    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(`Data tidak valid untuk ${symbol}`);
    }

    const data = evaluateStockDynamically(json.data);
    const oldPrice = currentAnalyzed && currentAnalyzed.code === data.code ? currentAnalyzed.price : null;

    // Pertahankan harga beli yang diketik pengguna di input SOP
    const existingBuyInp = $('sopBuyPrice');
    const savedBuyPrice = existingBuyInp && currentAnalyzed && currentAnalyzed.code === data.code
      ? +existingBuyInp.value || null
      : null;

    renderAnalysisDossier(data, savedBuyPrice);
    if (emptyState) emptyState.classList.add('hidden');
    if (resultContainer) resultContainer.classList.remove('hidden');

    // Animasi Flash jika harga berubah
    if (oldPrice !== null && oldPrice !== data.price) {
      const livePriceEl = $('azLivePrice');
      if (livePriceEl) {
        livePriceEl.classList.add(data.price > oldPrice ? 'flash-up' : 'flash-down');
        setTimeout(() => livePriceEl.classList.remove('flash-up', 'flash-down'), 1000);
      }
    }

    if (!isBackground) {
      toast(`Diagnosa ${symbol} berhasil dimuat`);
      startAnalyzerRealtimeEngine(symbol);
    }
  } catch (err) {
    if (!isBackground) {
      if (emptyState) {
        emptyState.classList.remove('hidden');
        emptyState.innerHTML = `
          <div class="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-200">Saham "${symbol}" Tidak Ditemukan</h3>
            <p class="text-xs text-rose-300 max-w-md mx-auto mt-1">${err.message}</p>
            <p class="text-[11px] text-slate-500 mt-2">Pastikan kode ticker terdaftar di Bursa Efek Indonesia (contoh: ANTM, MEDC, PANI, BBRI, BRMS).</p>
          </div>
        `;
      }
      if (resultContainer) resultContainer.classList.add('hidden');
      toast(err.message, true);
    }
  } finally {
    if (!isBackground) {
      if (btnText) btnText.textContent = 'Analisis Sekarang';
      if (spinner) spinner.classList.add('hidden');
    } else {
      if (syncIcon) setTimeout(() => syncIcon.classList.remove('spin'), 400);
    }
  }
}

// Menjalankan Loop Real-time Background Poller untuk Ticker Aktif
function startAnalyzerRealtimeEngine(symbol) {
  currentAnalyzedTicker = symbol;
  clearInterval(analyzerIntervalTimer);
  if (isAzLivePaused || azIntervalSec <= 0) return;

  analyzerIntervalTimer = setInterval(() => {
    const panel = $('panel-analyzer');
    if (!panel || panel.classList.contains('hidden')) return;
    if (!isAzLivePaused && currentAnalyzedTicker) {
      fetchLiveTickerData(currentAnalyzedTicker, true);
    }
  }, azIntervalSec * 1000);
}

// Fungsi Trigger Analisis Utama
function runStockAnalysis(rawSymbol) {
  const symbol = (rawSymbol || '').trim().toUpperCase().replace('.JK', '');
  if (!symbol) {
    toast('Ketik kode saham terlebih dahulu', true);
    return;
  }
  fetchLiveTickerData(symbol, false);
}

// Global integration handlers
window.copyAnalyzedPlan = function(code, entry, p1, r1Pct, p2, r2Pct, ps, rsPct) {
  const text = `TRADING PLAN ${code}\nHarga Entry: Rp ${entry}\nTarget 1 (+3% Net): Rp ${p1} (+${r1Pct}%)\nTarget 2 (+5% Net): Rp ${p2} (+${r2Pct}%)\nStop Loss: Rp ${ps} (${rsPct}%)\nFee beli 0.15% & jual 0.25% dihitung presisi fraksi BEI.`;
  copy(text);
};

// Inisialisasi Event Analyzer
function initAnalyzer() {
  const azForm = $('azForm');
  if (azForm) {
    azForm.onsubmit = e => {
      e.preventDefault();
      runStockAnalysis($('azInput').value);
    };
  }

  const quickChips = $('azQuickChips');
  if (quickChips) {
    quickChips.addEventListener('click', e => {
      const chip = e.target.closest('.az-chip');
      if (!chip) return;
      runStockAnalysis(chip.dataset.code);
    });
  }
}
