// Modul Jurnal Trading & Simulasi Compounding 30 Hari

let journal = JSON.parse(localStorage.getItem('sb_journal') || '[]');
let initial = +(localStorage.getItem('sb_initial') || 500000);
let chartInstance = null;

function saveJ() {
  localStorage.setItem('sb_journal', JSON.stringify(journal));
  localStorage.setItem('sb_initial', initial);
}

function renderJournal() {
  let bal = initial;
  let total = 0;
  let wins = 0;

  const rows = journal.map(j => {
    bal += j.pl;
    total += j.pl;
    if (j.pl > 0) wins++;
    return { ...j, bal };
  });

  const days = journal.length;
  const target3 = initial * Math.pow(1.03, days) - initial;

  if ($('jsBalance')) $('jsBalance').textContent = rp(bal);
  if ($('sumBalance')) $('sumBalance').textContent = rp(bal);
  if ($('sumInitial')) $('sumInitial').textContent = rp(initial);
  if ($('sumTarget')) $('sumTarget').textContent = `${rp(bal * 0.03)} – ${rp(bal * 0.05)}`;

  if ($('jsPL')) {
    $('jsPL').textContent = `${total >= 0 ? '+' : ''}${rp(total)} (${pct((total / initial) * 100)})`;
    $('jsPL').className = 'font-mono font-bold text-sm mt-1 tnum ' + (total >= 0 ? 'text-emerald-400' : 'text-rose-400');
  }

  if ($('jsWin')) $('jsWin').textContent = journal.length ? `${((wins / journal.length) * 100).toFixed(0)}% (${wins}/${journal.length})` : '—';
  if ($('jsAch')) $('jsAch').textContent = days ? `${((total / target3) * 100).toFixed(0)}%` : '—';

  const jTable = $('jTable');
  if (jTable) {
    jTable.innerHTML = rows.length
      ? rows
          .slice()
          .reverse()
          .map(
            j => `<tr class="border-b border-border">
              <td class="p-3 text-slate-300">${j.date}</td>
              <td class="p-3 font-mono font-bold text-slate-200">
                <div class="flex items-center gap-2">
                  <img src="https://assets.stockbit.com/logos/companies/${j.code}.png" class="w-4 h-4 object-contain rounded bg-base p-0.5 border border-border" onerror="this.style.display='none'" />
                  <span>${j.code}</span>
                </div>
              </td>
              <td class="p-3 text-right font-mono tnum ${j.pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${j.pl >= 0 ? '+' : ''}${rp(j.pl)}</td>
              <td class="p-3 text-right font-mono text-slate-200 tnum">${rp(j.bal)}</td>
              <td class="p-3 text-slate-400 text-[11px]">${(j.note || '').replace(/</g, '&lt;')}</td>
              <td class="p-3 text-center"><button class="del text-slate-500 hover:text-rose-400 transition" data-id="${j.id}">✕</button></td>
            </tr>`
          )
          .join('')
      : `<tr><td colspan="6" class="p-6 text-center text-slate-500 text-xs">Belum ada catatan transaksi di jurnal.</td></tr>`;
  }

  const daily = [];
  let b = initial;
  const byDate = {};
  journal.forEach(j => (byDate[j.date] = (byDate[j.date] || 0) + j.pl));
  Object.keys(byDate)
    .sort()
    .forEach(d => {
      b += byDate[d];
      daily.push(b);
    });

  drawChart(daily);
}

function drawChart(actual) {
  const chartCanvas = $('compoundChart');
  if (!chartCanvas) return;

  const labels = Array.from({ length: 31 }, (_, i) => 'H' + i);
  const c3 = labels.map((_, i) => initial * Math.pow(1.03, i));
  const c5 = labels.map((_, i) => initial * Math.pow(1.05, i));

  if ($('proj3')) $('proj3').textContent = rp(c3[30]);
  if ($('proj5')) $('proj5').textContent = rp(c5[30]);

  const act = [initial, ...actual].slice(0, 31);
  const ctx = chartCanvas.getContext('2d');

  const data = {
    labels,
    datasets: [
      { label: 'Target 5%', data: c5, borderColor: '#10b981', tension: 0.3, pointRadius: 0, borderWidth: 1.5 },
      { label: 'Target 3%', data: c3, borderColor: '#f59e0b', tension: 0.3, pointRadius: 0, borderWidth: 1.5 },
      { label: 'Aktual', data: act, borderColor: '#0ea5e9', backgroundColor: '#0ea5e9', tension: 0.2, pointRadius: 2.5, borderWidth: 2 }
    ]
  };

  if (chartInstance) {
    chartInstance.data = data;
    chartInstance.update();
    return;
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 }, boxWidth: 10 } },
        tooltip: { callbacks: { label: c => `${c.dataset.label}: ${rp(c.parsed.y)}` } }
      },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 10 }, grid: { color: '#1e293b' } },
        y: {
          ticks: {
            color: '#64748b',
            font: { size: 10 },
            callback: v => (v / 1000).toLocaleString('id-ID') + 'K'
          },
          grid: { color: '#1e293b' }
        }
      }
    }
  });
}

function updateChartTheme(isDark) {
  if (!chartInstance) return;
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#475569';
  if (chartInstance.options?.scales?.x) {
    chartInstance.options.scales.x.grid.color = gridColor;
    chartInstance.options.scales.x.ticks.color = textColor;
  }
  if (chartInstance.options?.scales?.y) {
    chartInstance.options.scales.y.grid.color = gridColor;
    chartInstance.options.scales.y.ticks.color = textColor;
  }
  if (chartInstance.options?.plugins?.legend?.labels) {
    chartInstance.options.plugins.legend.labels.color = textColor;
  }
  chartInstance.update();
}

function initJournal() {
  if ($('jDate')) $('jDate').valueAsDate = new Date();
  if ($('jInitial')) $('jInitial').value = initial;

  const form = $('journalForm');
  if (form) {
    form.onsubmit = e => {
      e.preventDefault();
      journal.push({
        id: Date.now(),
        date: $('jDate').value,
        code: $('jCode').value.trim().toUpperCase(),
        pl: +$('jPL').value,
        note: $('jNote').value.trim()
      });
      saveJ();
      renderJournal();
      $('jCode').value = '';
      $('jPL').value = '';
      $('jNote').value = '';
      toast('Transaksi tersimpan');
    };
  }

  const jTable = $('jTable');
  if (jTable) {
    jTable.addEventListener('click', e => {
      const b = e.target.closest('.del');
      if (!b) return;
      journal = journal.filter(j => j.id != b.dataset.id);
      saveJ();
      renderJournal();
    });
  }

  if ($('jInitial')) {
    $('jInitial').addEventListener('change', () => {
      initial = +$('jInitial').value || 500000;
      saveJ();
      renderJournal();
      if (typeof calc === 'function') calc();
    });
  }

  if ($('jReset')) {
    $('jReset').onclick = () => {
      if (confirm('Hapus seluruh catatan jurnal?')) {
        journal = [];
        saveJ();
        renderJournal();
        toast('Jurnal direset');
      }
    };
  }
}
