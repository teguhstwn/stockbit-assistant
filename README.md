# Stockbit Trading Assistant (Realtime IHSG) 🚀

Asisten trading harian khusus trader cepat / scalper IHSG di platform Stockbit dengan modal awal kecil (Rp 500.000).

---

## ⚡ Cara Menjalankan (Realtime Data)

### Opsi 1: Cukup Double Click `start.bat` (Paling Praktis)
1. Buka folder `D:\2_Teguh\Belajar\Vibe Coding\stockbit-assistant`
2. Klik dua kali file **`start.bat`**
3. Aplikasi akan langsung membuka browser di **`http://localhost:3000`** dan data harga live IHSG otomatis terhubung!

### Opsi 2: Lewat Terminal / Command Prompt
```bash
cd "D:\2_Teguh\Belajar\Vibe Coding\stockbit-assistant"
node server.js
```
Lalu buka browser di `http://localhost:3000`.

*(Catatan: Anda tidak perlu `npm install` karena backend menggunakan modul native Node.js yang sangat ringan dan cepat!)*

---

## 🌟 Fitur Unggulan

1. **Screener Realtime IHSG:**
   - Menarik harga live, persentase perubahan harian, volume lot, High/Low range secara realtime langsung dari bursa.
   - Dilengkapi sinyal scalping dinamis (*STRONG BUY, BUY ON BREAKOUT, BUY ON WEAKNESS, TAKE PROFIT, WAIT & SEE*).
   - Auto-refresh otomatis setiap 30 detik + tombol manual refresh.

2. **Kalkulator Stockbit Terintegrasi Fraksi IDX:**
   - Tombol **"⚡ Cek Live Price"**: Ketik kode saham apa saja (contoh: `GOTO`, `BRMS`, `ANTM`, `BBRI`), klik Cari untuk memuat harga pasar detik ini.
   - Perhitungan lot maksimal memperhitungkan fee beli Stockbit (0.15%).
   - Target Harga TP1 (+3%) & TP2 (+5%) otomatis **dibulatkan ke atas ke fraksi harga IDX terdekat** agar net profit tercapai setelah dipotong fee jual (0.25%).
   - Stop Loss disesuaikan dengan fraksi harga di bawah.
   - Tombol 1-klik salin format rencana order ke clipboard.

3. **Jurnal & Tracker Transaksi Harian:**
   - Catat riwayat trade dengan penyimpanan otomatis lokal (`localStorage`).
   - Indikator Win Rate, Saldo berjalan, dan Persentase pencapaian target harian.
   - Grafik interaktif **Compounding Interest 30 Hari** (Chart.js) membandingkan target 3%, 5%, dan kurva aktual saldo Anda.

4. **Pre-Order Checklist & Panduan Stockbit:**
   - Checklist disiplin psikologi dan teknikal 8 poin dengan bar kelayakan eksekusi.
   - Panduan tahapan order di Stockbit (Pre-opening -> Match -> Pasang Auto Order TP/SL).
   - Tabel fraksi harga resmi Bursa Efek Indonesia (IDX).
