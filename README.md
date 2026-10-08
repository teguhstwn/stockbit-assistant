# Stockbit Trading Assistant (Realtime IHSG) 🚀

Aplikasi web modern, cepat, dan responsif untuk membantu trader serta investor saham Bursa Efek Indonesia (IDX/IHSG) dalam melakukan **screening real-time**, **analisis bandarmologi**, **pengujian strategi trading (BPJS, BSJP, Calon Top Gainer, & Swing Rebound)**, membaca **Order Book 5 Fraksi**, menyusun **Trading Plan presisi fraksi BEI**, serta **Portofolio Rescue (Evaluasi Hold vs Cut Loss)**.

![Stockbit Trading Assistant](https://img.shields.io/badge/Platform-IDX%20%2F%20IHSG-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![License](https://img.shields.io/badge/License-ISC-orange)
![Dependency](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Native)-brightgreen)
![Deployment](https://img.shields.io/badge/Vercel-Deployed-black)

---

## 🌟 Fitur Unggulan

### 1. 🛡️ Portofolio Rescue: Hold vs Cut Loss Analyzer *(Fitur Terbaru)*
Solusi objektif dan anti-FOMO untuk menentukan langkah rasional terhadap saham portofolio yang sedang merugi/nyangkut:
- **Input Fleksibel**: Cukup masukkan kode saham, harga beli rata-rata (*Avg Price*), dan jumlah lot. Tersedia tombol contoh cepat (*quick presets*).
- **Official Verdict**: Rekomendasi tegas bergradasi warna:
  - 🔴 **CUT LOSS SEKARANG**: Kerugian berat, tren bearish menembus support, atau distribusi Smart Money aktif.
  - 🟡 **HOLD & PANTAU KETAT**: Konsolidasi bertahan di support, kerugian masih terkelola, pasang trigger disiplin.
  - 🟢 **HOLD & AVERAGING DOWN**: Diskon sehat dengan akumulasi Smart Money atau bantalan support kuat.
- **Logika Override (Veto Rules)**: Memaksa vonis *Cut Loss* jika kerugian > -50% (butuh > +100% untuk BEP) atau terdeteksi distribusi institusi besar (*Big Distribution*).
- **5 Modul Analisis Komprehensif**:
  - **Modul A (Kondisi Teknikal & Support)**: Tren intraday, support pertahanan terdekat, lantai cut loss kritis, dan target pantulan.
  - **Modul B (Bandarmologi Real-Time)**: Aliran Smart Money (*Big/Normal Accumulation vs Distribution*).
  - **Modul C (Kalkulator Recovery & BEP)**: Persentase gain wajib untuk balik modal (BEP) dan simulasi *Recycle Capital* (sisa dana yang bisa diselamatkan untuk trading di peluang baru).
  - **Modul D (Batas Waktu Evaluasi / Deadline)**: Durasi observasi (1–5 hari bursa), target rebound minimal yang harus disentuh, dan batas toleransi penurunan maksimal.
  - **Modul E (Panduan Averaging Down / Aturan Larangan)**: Simulasi harga beli tambahan, tambahan lot, average price baru yang lebih rendah, serta target BEP baru yang lebih ringan; atau peringatan tegas *"DILARANG AVERAGING DOWN"* (menangkap pisau jatuh).

### 2. 🌓 Dual Theme: Obsidian Dark & Clean Light Mode
- Desain antarmuka finansial modern dengan kontras tinggi (*high contrast*).
- Menghilangkan bug teks hitam di tema gelap — nama emiten dan ticker selalu terbaca jelas, tajam, dan elegan di semua perangkat.
- Tombol sakelar tema instan di bilah navigasi atas dengan penyimpanan preferensi otomatis.

### 3. 📱 100% Responsif & Mobile Native
- Optimal di semua ukuran layar: smartphone Android/iOS, tablet, laptop, hingga monitor desktop lebar (1920p).
- Dilengkapi **Bottom Navigation Bar** *sticky* khusus perangkat mobile untuk navigasi cepat layaknya aplikasi native (Screener, Analisis, Porto Rescue, Checklist).

### 4. 🎯 5 Preset Strategi Dinamis dengan Horizontal Scroll Toolbar
Bilah preset dilengkapi fitur **scroll horizontal interaktif** (mendukung putaran *mouse wheel* samping, *click & drag to scroll*, tombol panah navigasi `<` `>`, serta usapan jari di layar sentuh).
- **Semua Saham (49 Saham Likuid)**: Bebas batasan nominal modal — mencakup Big Banks (BBCA, BBRI, BMRI, BBNI), Bluechip (ASII, TLKM, UNTR), komoditas energi (ADRO, PTBA, ANTM, MEDC), hingga saham momentum tinggi (AMMN, PANI, BREN, CUAN, GOTO, BRMS).
- **Beli Pagi Jual Sore (BPJS)**: Scalping intraday memanfaatkan volatilitas *Day Range* ≥ 2.5% dan volume aktif untuk mengejar target profit +3% hingga +5% sebelum sesi 2 ditutup.
- **Beli Sore Jual Pagi (BSJP)**: Strategi BTST (*Buy Today Sell Tomorrow*) membeli saham dengan akumulasi konsisten yang closing di pucuk harian (≥ 98.5% Day High) pukul 15:30–15:50 WIB untuk menangkap momentum *gap up* esok pagi.
- **Akumulasi Bandar (Bandarmologi)**: Mendeteksi saham yang dikoleksi masif oleh *Smart Money* (broker institusi & asing) dibanding penjual yang didominasi ritel.
- **🔥 Calon Top Gainer Besok**: Mendeteksi fase awal *markup/breakout* penutupan sesi 2 (Chg +1.2% s/d +9.0%, closing di pucuk tanpa ekor atas panjang, volume melonjak, dan akumulasi bandar aktif).
- **🌊 Swing Rebound (1–4 Minggu)**: Strategi *Buy on Weakness* untuk saham yang berada di fase diskon/koreksi sehat (% Chg ≤ +1.0% atau menguji support kunci) namun diakumulasi senyap oleh Smart Money, dengan target TP1 (+10%), TP2 (+18%), dan Stop Loss (-4%).

### 5. 🔍 Modul Diagnosa & Analisis Saham Komprehensif (Stock Dossier)
Ketik kode saham apa saja di bursa (contoh: `ANTM`, `BBRI`, `GOTO`, `MEDC`, `PANI`) untuk memuat dossier analisis 4 pilar lengkap:
- **Streaming Live Ticker**: Interval pembaruan dinamis (3 detik, 5 detik, 10 detik) dengan animasi perubahan harga (*price flash* up/down).
- **Pilar 1: Momentum & Rentang Harga Intraday**: Posisi harga terkini di dalam rentang Low–High harian.
- **Pilar 2: Bandarmologi Real-Time**: Status akumulasi (*Big Accumulation / Normal Accumulation / Distribution*), volume transaksi, serta broker dominan.
- **Pilar 3: Uji Kesesuaian Algoritma**: Evaluasi otomatis apakah saham cocok untuk BPJS, BSJP, maupun Swing Rebound.
- **Pilar 4: Precision Trading Plan (Fraksi BEI)**: Menghitung target jual TP1, TP2, dan batas Stop Loss presisi fraksi BEI dengan kompensasi bersih biaya transaksi (*fee beli 0.15% & fee jual 0.25%*).
- **Order Book 5 Fraksi & Market Depth**: Visualisasi bar antrian Bid vs Offer 5 fraksi teratas bursa beserta rasio ketebalan bantalan beli vs jual.
- **SOP Eksekusi Sesi 2 & BTST**: Rangkuman disiplin aksi jam krusial bursa (15:30, 15:45, 15:50, dan 09:00 WIB).

### 6. 📋 8 Protokol Wajib Pre-Order Checklist
- Checklist interaktif kedisiplinan trading sebelum menekan tombol beli di aplikasi sekuritas untuk mengeliminasi keputusan emosional dan FOMO.

---

## ⚡ Cara Menjalankan Secara Lokal

### Opsi 1: Cukup Double-Click `start.bat` (Paling Praktis di Windows)
1. Buka folder proyek ini di komputer Anda.
2. Klik dua kali file **`start.bat`**.
3. Browser Anda akan langsung terbuka otomatis di **`http://localhost:3000`**!

### Opsi 2: Melalui Terminal / Command Prompt
```bash
# Masuk ke direktori proyek
cd stockbit-assistant

# Jalankan server
node server.js
```
Lalu buka browser Anda di `http://localhost:3000`.

> **Catatan:** Anda tidak perlu menjalankan `npm install` karena backend dibangun sepenuhnya dengan **native Node.js modules** (zero external dependencies), sehingga proses startup berjalan instan dan sangat ringan!

---

## 🌐 Deployment (Vercel & Cloud)

Aplikasi ini telah dikonfigurasi untuk deployment otomatis (CI/CD) ke **Vercel**:
- Setiap perubahan yang di-*push* ke branch `main` GitHub akan secara otomatis terdeploy ke produksi di Vercel:
  👉 **`https://stockbit-assistant.vercel.app/`**
