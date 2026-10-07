// Modul Kalkulator Order Stockbit & Trading Plan Generator

let currentCalc = null;

// Menghitung maksimal lot terjangkau berdasarkan modal
function maxLots(cap, p) {
  const lotCost = p * LOT * (1 + FEE_BUY);
  return Math.max(0, Math.floor(cap / lotCost));
}

// Menghitung trading plan lengkap dengan fee & fraksi BEI
function plan(entry, cap, tp1, tp2, sl) {
  const lots = maxLots(cap, entry);
  const buyNominal = entry * lots * LOT * (1 + FEE_BUY);

  // Kompensasi Fee Bolak-balik: Entry * (1 + feeBeli) * (1 + target) / (1 - feeJual)
  const calcTargetPrice = targetPct => {
    const rawTarget = (entry * (1 + FEE_BUY) * (1 + targetPct)) / (1 - FEE_SELL);
    return roundUpTick(rawTarget);
  };

  const p1 = calcTargetPrice(tp1);
  const p2 = calcTargetPrice(tp2);
  const ps = stopLossPrice(entry, sl);

  const calcNetReturn = exitPrice => {
    const sellNominal = exitPrice * lots * LOT * (1 - FEE_SELL);
    const netRp = sellNominal - buyNominal;
    const netPct = buyNominal > 0 ? (netRp / buyNominal) * 100 : 0;
    return { rp: netRp, pct: netPct, buy: buyNominal, sell: sellNominal };
  };

  return {
    lots,
    p1,
    p2,
    ps,
    r1: calcNetReturn(p1),
    r2: calcNetReturn(p2),
    rs: calcNetReturn(ps)
  };
}

// Format template rencana order untuk Auto Order Stockbit
function planText(type) {
  if (!currentCalc || !currentCalc.lots) return 'Silakan masukkan kode saham dan harga yang valid.';
  const c = currentCalc;
  const stratName = $('cStratBadge') ? $('cStratBadge').textContent : 'Trading Plan';
  const buy = `BUY ${c.code} @ ${c.entry} x ${c.lots} lot (≈ ${rp(c.r1.buy)})`;
  const tp = `SELL TP1 ${c.code} @ ${c.p1} (net ${rp(c.r1.rp)}) | TP2 @ ${c.p2} (net ${rp(c.r2.rp)})`;
  const sl = `STOP LOSS ${c.code} @ ${c.ps} (net ${rp(c.rs.rp)})`;

  if (type === 'buy') return buy;
  if (type === 'tp') return tp;
  if (type === 'sl') return sl;

  return `RENCANA ORDER ${c.code} [${stratName}]\nTanggal: ${new Date().toLocaleDateString('id-ID')}\n${buy}\n${tp}\n${sl}\nFee beli 0.15% & fee jual 0.25% dihitung bersih fraksi IDX.`;
}

// Kalkulasi ulang tiket order
function calc() {
  const code = $('cCode') ? ($('cCode').value.trim().toUpperCase() || '-') : '-';
  const price = +$('cPrice').value;
  const cap = +$('cCapital').value;
  const tp1 = +$('cTp1').value / 100;
  const tp2 = +$('cTp2').value / 100;
  const sl = +$('cSl').value / 100;

  if (!(price > 0)) return;

  // Update logo emiten jika ada
  const logoEl = $('cStockLogo');
  if (logoEl && code && code !== '-') {
    logoEl.src = `https://assets.stockbit.com/logos/companies/${code}.png`;
    logoEl.style.display = 'block';
  }

  $('cTick').textContent = 'Rp ' + tickSize(price);
  $('cTickWarn').textContent = isValidTick(price)
    ? ''
    : `⚠ tidak sesuai fraksi IDX (terdekat: ${roundDownTick(price)} / ${roundUpTick(price)})`;

  const p = plan(price, cap, tp1, tp2, sl);
  currentCalc = { code, entry: price, ...p, cap, tp1, tp2, sl };

  $('oLot').textContent = p.lots + ' lot';
  $('oLotSub').textContent = (p.lots * LOT).toLocaleString('id-ID') + ' lembar';
  $('oCost').textContent = rp(p.r1.buy);
  $('oCostSub').textContent = 'Sisa modal: ' + rp(cap - p.r1.buy);

  const row = (lbl, cls, pr, r) =>
    `<tr class="border-b border-border"><td class="p-3 font-sans ${cls}">${lbl}</td><td class="p-3 text-right text-slate-100">${pr}</td><td class="p-3 text-right ${
      r.rp >= 0 ? 'text-emerald-400' : 'text-rose-400'
    }">${rp(r.rp)}</td><td class="p-3 text-right ${r.rp >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${pct(
      r.pct
    )}</td></tr>`;

  $('oTable').innerHTML =
    `<tr class="border-b border-border"><td class="p-3 font-sans text-slate-300">Entry Beli</td><td class="p-3 text-right text-slate-100">${price}</td><td class="p-3 text-right text-slate-500">—</td><td class="p-3 text-right text-slate-500">—</td></tr>` +
    row(`Target 1 (+${(tp1 * 100).toFixed(1)}% Net)`, 'text-emerald-400', p.p1, p.r1) +
    row(`Target 2 (+${(tp2 * 100).toFixed(1)}% Net)`, 'text-emerald-400', p.p2, p.r2) +
    row(`Stop Loss (-${(sl * 100).toFixed(1)}%)`, 'text-rose-400', p.ps, p.rs);

  $('oRR').textContent = p.rs.rp
    ? `1 : ${(p.r1.rp / Math.abs(p.rs.rp)).toFixed(2)} (TP1) • 1 : ${(p.r2.rp / Math.abs(p.rs.rp)).toFixed(2)} (TP2)`
    : '-';
}

// Cari harga live dari server untuk kalkulator
async function lookupQuote(symbol) {
  const code = symbol.trim().toUpperCase();
  if (!code) return;
  toast(`Mengambil data bursa ${code}...`);
  try {
    const res = await fetch(`/api/quote?symbol=${encodeURIComponent(code)}`);
    if (!res.ok) throw new Error('Gagal');
    const json = await res.json();
    if (json.success && json.data) {
      const q = json.data;
      $('cCode').value = q.code;
      $('cPrice').value = q.price;
      $('cStockName').textContent = `${q.name} (Live: ${q.price} | ${pct(q.chgPercent)})`;
      calc();
      toast(`Harga live ${q.code}: Rp ${q.price}`);
      return;
    }
  } catch {
    toast(`Gagal mengambil data ${code}`, true);
  }
}

// Inisialisasi Event Kalkulator
function initCalculator() {
  ['cCode', 'cPrice', 'cCapital', 'cTp1', 'cTp2', 'cSl'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('input', calc);
  });

  if ($('cCheckBtn')) $('cCheckBtn').onclick = () => lookupQuote($('cCode').value);
  if ($('btnFetchQuote')) $('btnFetchQuote').onclick = () => lookupQuote($('cCode').value);
  if ($('cCode')) {
    $('cCode').addEventListener('keydown', e => {
      if (e.key === 'Enter') lookupQuote($('cCode').value);
    });
  }

  if ($('copyPlanBtn')) $('copyPlanBtn').onclick = () => copy(planText('full'));
  document.querySelectorAll('.quick-btn').forEach(b => {
    b.onclick = () => copy(planText(b.dataset.q));
  });
}
