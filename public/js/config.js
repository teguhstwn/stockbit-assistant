// Konfigurasi & Master Konstanta Trading
const LOT = 100;
const FEE_BUY = 0.0015;  // 0.15% fee beli Stockbit
const FEE_SELL = 0.0025; // 0.25% fee jual Stockbit (termasuk pajak PPh & BEI)

// Styling Badge Sinyal Teknikal
const sigStyle = {
  'STRONG BUY': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  'BUY ON BREAKOUT': 'bg-sky-500/10 text-sky-400 border border-sky-500/30',
  'BUY ON WEAKNESS': 'bg-teal-500/10 text-teal-300 border border-teal-500/30',
  'TAKE PROFIT': 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
  'WAIT & SEE': 'bg-slate-800 text-slate-400 border border-slate-700'
};

// 8 Kriteria Protokol Disiplin Trading Scalper
const CHECKS = [
  ['Volatilitas Harian', 'Rentang naik-turun saham ≥ 3% untuk menyediakan ruang target TP 3%–5%.'],
  ['Likuiditas Pasar', 'Volume transaksi harian aktif dan nilai transaksi memenuhi syarat likuiditas.'],
  ['Struktur Bid / Offer', 'Antrian bid tebal, spread 1 tick, tidak ada offer raksasa yang menahan di atas.'],
  ['Konfirmasi Tren', 'Harga berada di atas rata-rata intraday (VWAP) dan tidak dalam tekanan ARB.'],
  ['Risk to Reward Ratio', 'Rasio potensi profit vs risiko terukur minimal 1 : 1.5 sebelum entri order.'],
  ['Batas Stop Loss', 'Level cut loss sudah ditetapkan dan siap dipasang di Auto Order Stockbit.'],
  ['Ukuran Posisi & Money Management', 'Jumlah lot proporsional terhadap toleransi risiko portofolio, tidak all-in emosional.'],
  ['Disiplin Trading', 'Target harian belum tercapai dan tidak dalam kondisi balas dendam (revenge trade).']
];
