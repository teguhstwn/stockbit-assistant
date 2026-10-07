// Main Application Orchestrator & Lifecycle Management

let refreshIntervalSec = +(localStorage.getItem('sb_refresh_interval') || 30);
let countdownRemaining = refreshIntervalSec;
let countdownTimer = null;

// Navigasi Tab Utama
function showTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('hidden', p.id !== 'panel-' + name);
  });
  document.querySelectorAll('.tab-item').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Jika kembali ke tab analyzer dan ada ticker aktif, segera lakukan live sync
  if (name === 'analyzer' && currentAnalyzedTicker && !isAzLivePaused) {
    fetchLiveTickerData(currentAnalyzedTicker, true);
    startAnalyzerRealtimeEngine(currentAnalyzedTicker);
  }
}

// Jam Real-time & Status Sesi Perdagangan BEI
function tickClock() {
  const now = new Date();
  if ($('clock')) {
    $('clock').textContent = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB';
  }

  const j = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const m = j.getHours() * 60 + j.getMinutes();
  const d = j.getDay();

  let s = 'TUTUP';
  if (d >= 1 && d <= 5) {
    if (m >= 525 && m < 540) s = 'PRE-OPENING';
    else if (m >= 540 && m < 720) s = 'SESI 1 BUKA';
    else if (m >= 720 && m < 810) s = 'ISTIRAHAT';
    else if (m >= 810 && m < 950) s = 'SESI 2 BUKA';
    else if (m >= 950 && m < 960) s = 'PRE-CLOSING';
  }

  if ($('marketStatus')) $('marketStatus').textContent = s;
}

// Engine Countdown Auto-Refresh Screener
function startCountdownEngine() {
  clearInterval(countdownTimer);
  const badge = $('countdownBadge');
  if (!badge) return;

  if (refreshIntervalSec <= 0) {
    badge.textContent = 'Off';
    badge.className = 'font-mono text-[10px] bg-elevated px-1.5 py-0.5 rounded text-slate-500 font-semibold min-w-[24px] text-center';
    return;
  }

  countdownRemaining = refreshIntervalSec;
  badge.textContent = `${countdownRemaining}s`;
  badge.className = 'font-mono text-[10px] bg-elevated px-1.5 py-0.5 rounded text-sky-400 font-semibold min-w-[24px] text-center';

  countdownTimer = setInterval(() => {
    countdownRemaining--;
    if (countdownRemaining <= 0) {
      countdownRemaining = refreshIntervalSec;
      badge.textContent = `${countdownRemaining}s`;
      fetchRealtimeStocks(true);
    } else {
      badge.textContent = `${countdownRemaining}s`;
    }
  }, 1000);
}

function handleIntervalChange(val) {
  refreshIntervalSec = parseInt(val, 10);
  localStorage.setItem('sb_refresh_interval', refreshIntervalSec);
  startCountdownEngine();
  if (refreshIntervalSec > 0) {
    toast(`Interval auto-refresh: ${refreshIntervalSec} detik`);
    fetchRealtimeStocks(true);
  } else {
    toast(`Auto-refresh dinonaktifkan (Manual)`);
  }
}

// Engine Tema: Dark & Light Mode
let currentTheme = localStorage.getItem('sb_theme') || 'dark';

function applyTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('sb_theme', theme);
  const isDark = theme === 'dark';

  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }

  // Update elemen tombol tema
  const iconEl = $('themeToggleIcon');
  const textEl = $('themeToggleText');
  if (iconEl) iconEl.textContent = isDark ? '☀️' : '🌙';
  if (textEl) textEl.textContent = isDark ? 'Light' : 'Dark';

  // Perbarui grafik compounding jika sudah terinisialisasi
}

function toggleTheme() {
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  toast(`Mode ${nextTheme === 'dark' ? 'Gelap (Dark Mode)' : 'Terang (Light Mode)'} diaktifkan`);
}

// Bootstrapping Aplikasi saat DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi Tema
  applyTheme(currentTheme);
  if ($('themeToggleBtn')) {
    $('themeToggleBtn').onclick = toggleTheme;
  }

  // Bind tab navigasi
  document.querySelectorAll('.tab-item').forEach(b => {
    b.onclick = () => showTab(b.dataset.tab);
  });

  // Bind refresh toolbar
  if ($('btnRefresh')) {
    $('btnRefresh').onclick = () => {
      fetchRealtimeStocks(false);
      if (refreshIntervalSec > 0) {
        countdownRemaining = refreshIntervalSec;
        if ($('countdownBadge')) $('countdownBadge').textContent = `${countdownRemaining}s`;
      }
    };
  }

  const intSelect = $('autoRefreshInterval');
  if (intSelect) {
    intSelect.value = String(refreshIntervalSec);
    intSelect.addEventListener('change', e => handleIntervalChange(e.target.value));
  }

  // Inisialisasi Submodul Aktif
  initChecklist();
  initScreener();
  initAnalyzer();

  // Initial Runs
  renderChecks();
  fetchRealtimeStocks(false);
  startCountdownEngine();

  // Mulai detak jam pasar
  setInterval(tickClock, 1000);
  tickClock();
});
