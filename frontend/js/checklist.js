// Modul Checklist Disiplin & SOP Eksekusi Trading

let checks = JSON.parse(localStorage.getItem('sb_checks') || '[]');

function renderChecks() {
  const container = $('checklist');
  if (!container) return;

  container.innerHTML = CHECKS.map(
    ([t, d], i) => `<label class="flex gap-3 p-3 rounded-lg bg-base border border-border/80 cursor-pointer hover:border-slate-700 transition ${
      checks[i] ? 'border-sky-500/40 bg-sky-950/10' : ''
    }">
    <input type="checkbox" class="ck mt-0.5 accent-sky-500 w-4 h-4 rounded cursor-pointer" data-i="${i}" id="ck-${i}" ${
      checks[i] ? 'checked' : ''
    }>
    <span class="flex-1">
      <span class="block text-xs font-semibold ${checks[i] ? 'text-sky-300' : 'text-slate-200'}">${t}</span>
      <span class="block text-[11px] text-slate-400 mt-0.5 leading-relaxed">${d}</span>
    </span>
  </label>`
  ).join('');

  const n = checks.filter(Boolean).length;
  const p = (n / CHECKS.length) * 100;

  if ($('ckProgress')) $('ckProgress').textContent = `${n}/${CHECKS.length}`;
  if ($('ckBar')) $('ckBar').style.width = p + '%';

  const v = $('ckVerdict');
  if (v) {
    if (p === 100) {
      v.textContent = 'Protokol Lengkap — Siap Eksekusi Order di Stockbit';
      v.className = 'p-3 rounded-lg text-xs font-semibold text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
    } else if (p >= 60) {
      v.textContent = 'Sebagian kriteria terpenuhi — evaluasi kembali poin yang belum tervalidasi';
      v.className = 'p-3 rounded-lg text-xs font-semibold text-center bg-amber-500/10 text-amber-400 border border-amber-500/30';
    } else {
      v.textContent = 'Kriteria belum memadai — tunda eksekusi order';
      v.className = 'p-3 rounded-lg text-xs font-semibold text-center bg-rose-500/10 text-rose-400 border border-rose-500/30';
    }
  }
}

function initChecklist() {
  const container = $('checklist');
  if (container) {
    container.addEventListener('change', e => {
      if (!e.target.classList.contains('ck')) return;
      checks[e.target.dataset.i] = e.target.checked;
      localStorage.setItem('sb_checks', JSON.stringify(checks));
      renderChecks();
    });
  }

  if ($('ckReset')) {
    $('ckReset').onclick = () => {
      checks = [];
      localStorage.removeItem('sb_checks');
      renderChecks();
    };
  }
}
