# Stockbit Trading Assistant (Realtime IHSG) 🚀

Aplikasi web modern, cepat, dan responsif untuk membantu trader serta investor saham Bursa Efek Indonesia (IDX/IHSG) dalam melakukan **screening real-time**, **analisis bandarmologi**, **pengujian strategi trading (BPJS, BSJP, Calon Top Gainer, & Swing Rebound)**, membaca **Order Book 5 Fraksi**, serta menyusun **Trading Plan presisi fraksi BEI**.

![Stockbit Trading Assistant](https://img.shields.io/badge/Platform-IDX%20%2F%20IHSG-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![License](https://img.shields.io/badge/License-ISC-orange)
![Dependency](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Native)-brightgreen)

---

## 🌟 Fitur Unggulan

### 1. 🌓 Dual Theme: Obsidian Dark & Clean Light Mode
- Desain antarmuka finansial modern dengan kontras tinggi (*high contrast*).
- Menghilangkan bug teks hitam di tema gelap — nama emiten dan ticker selalu terbaca jelas, tajam, dan elegan di semua perangkat.
- Tombol sakelar tema instan di bilah navigasi atas dengan penyimpanan preferensi otomatis.

### 2. 📱 100% Responsif & Mobile Native
- Optimal di semua ukuran layar: smartphone Android/iOS, tablet, laptop, hingga monitor desktop lebar (1920p).
- Dilengkapi **Bottom Navigation Bar** *sticky* khusus perangkat mobile untuk navigasi cepat layaknya aplikasi native.

### 3. 🎯 5 Preset Strategi Dinamis dengan Horizontal Scroll Toolbar
Bilah preset dilengkapi fitur **scroll horizontal interaktif** (mendukung putaran *mouse wheel* samping, *click & drag to scroll*, tombol panah navigasi `<` `>`, serta usapan jari di layar sentuh).
- **Semua Saham (49 Saham Likuid)**: Bebas batasan nominal modal — mencakup Big Banks (BBCA, BBRI, BMRI, BBNI), Bluechip (ASII, TLKM, UNTR), komoditas energi (ADRO, PTBA, ANTM, MEDC), hingga saham momentum tinggi (AMMN, PANI, BREN, CUAN, GOTO, BRMS).
- **Beli Pagi Jual Sore (BPJS)**: Scalping intraday memanfaatkan volatilitas *Day Range* ≥ 2.5% dan volume aktif untuk mengejar target profit +3% hingga +5% sebelum sesi 2 ditutup.
- **Beli Sore Jual Pagi (BSJP)**: Strategi BTST (*Buy Today Sell Tomorrow*) membeli saham dengan akumulasi konsisten yang closing di pucuk harian (≥ 98.5% Day High) pukul 15:30–15:50 WIB untuk menangkap momentum *gap up* esok pagi.
- **Akumulasi Bandar (Bandarmologi)**: Mendeteksi saham yang dikoleksi masif oleh *Smart Money* (broker institusi & asing) dibanding penjual yang didominasi ritel.
- **🔥 Calon Top Gainer Besok**: Mendeteksi fase awal *markup/breakout* penutupan sesi 2 (Chg +1.2% s/d +9.0%, closing di pucuk tanpa ekor atas panjang, volume melonjak, dan akumulasi bandar aktif).
- **🌊 Swing Rebound (1–4 Minggu)**: Strategi *Buy on Weakness* untuk saham yang berada di fase diskon/koreksi sehat (% Chg ≤ +1.0% atau menguji support kunci) namun diakumulasi senyap oleh Smart Money, dengan target TP1 (+10%), TP2 (+18%), dan Stop Loss (-4%).

### 4. 🔍 Modul Diagnosa & Analisis Saham Komprehensif (Stock Dossier)
Ketik kode saham apa saja di bursa (contoh: `ANTM`, `BBRI`, `GOTO`, `MEDC`, `PANI`) untuk memuat dossier analisis 4 pilar lengkap:
- **Streaming Live Ticker**: Interval pembaruan dinamis (3 detik, 5 detik, 10 detik) dengan animasi perubahan harga (*price flash* up/down).
- **Pilar 1: Momentum & Rentang Harga Intraday**: Posisi harga terkini di dalam rentang Low–High harian.
- **Pilar 2: Bandarmologi Real-Time**: Status akumulasi (*Big Accumulation / Normal Accumulation / Distribution*), volume transaksi, serta broker dominan.
- **Pilar 3: Uji Kesesuaian Algoritma**: Evaluasi otomatis apakah saham cocok untuk BPJS, BSJP, maupun Swing Rebound.
- **Pilar 4: Precision Trading Plan (Fraksi BEI)**: Menghitung target jual TP1, TP2, dan batas Stop Loss presisi fraksi BEI dengan kompensasi bersih biaya transaksi (*fee beli 0.15% & fee jual 0.25%*).
- **Order Book 5 Fraksi & Market Depth**: Visualisasi bar antrian Bid vs Offer 5 fraksi teratas bursa beserta rasio ketebalan bantalan beli vs jual.
- **SOP Eksekusi Sesi 2 & BTST**: Rangkuman disiplin aksi jam krusial bursa (15:30, 15:45, 15:50, dan 09:00 WIB).

### 5. 📋 8 Protokol Wajib Pre-Order Checklist
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

## 🌐 Cara Deploy ke Cloud (Online Gratis di Render.com)

Aplikasi ini sudah dilengkapi berkas konfigurasi **`render.yaml`** sehingga siap di-deploy online secara gratis:

1. Buat akun / masuk ke [dashboard.render.com](https://dashboard.render.com) menggunakan akun GitHub Anda.
2. Klik tombol **New +** -> pilih **Web Service**.
3. Hubungkan repositori GitHub Anda: **`teguhstwn/stockbit-assistant`**.
4. Konfigurasi otomatis:
   - **Name**: `stockbit-assistant`
   - **Region**: Singapore *(latensi bursa terendah)*
   - **Runtime**: Node
   - **Start Command**: `node server.js`
   - **Instance Type**: Free
5. Klik **Deploy Web Service**.
6. Dalam 1–2 menit, aplikasi Anda sudah live online dengan URL HTTPS gratis (misal: `https://stockbit-assistant.onrender.com`) dan dapat diakses dari smartphone dari mana saja!

---

## 🏗️ Struktur Proyek

```
stockbit-assistant/
├── backend/
│   ├── config/
│   │   └── universe.js        # Konfigurasi 49 emiten likuid IHSG & master broker
│   ├── routes/
│   │   └── api.js             # API router (/api/stocks, /api/quote, /api/analyze)
│   ├── services/
│   │   ├── bandarmologi.js    # Mesin kalkulasi bandarmologi & akumulasi broker
│   │   ├── orderBook.js       # Generator simulasi kedalaman antrian Order Book 5 fraksi
│   │   ├── strategyEngine.js  # Algoritma klasifikasi BPJS, BSJP, Top Gainer, & Swing
│   │   └── yahooFinance.js    # Integrasi realtime quote & caching layer
│   └── server.js              # Native HTTP server & static file serving
├── frontend/
│   ├── css/
│   │   └── styles.css         # Design system, tema Obsidian/Light, custom scrollbar
│   ├── js/
│   │   ├── analyzer.js        # Logika modul analisa dossier, streaming interval, order book
│   │   ├── app.js             # Tab switcher, market session clock, & theme toggler
│   │   ├── checklist.js       # Manajemen state checklist SOP
│   │   ├── config.js          # Pengaturan fee transaksi sekuritas
│   │   ├── screener.js        # Render kartu saham, dynamic filtering, & horizontal scroll
│   │   └── utils.js           # Matriks fraksi harga IDX, kalkulator TP/SL & target swing
│   └── index.html             # Antarmuka SPA utama
├── .gitignore
├── package.json
├── render.yaml                # Render cloud blueprint deployment
├── server.js                  # Entrypoint wrapper root
└── start.bat                  # One-click launcher Windows
```

---

## ⚠️ Disclaimer
Aplikasi ini dikembangkan untuk tujuan edukasi, asistensi analisis, dan perencanaan trading mandiri. Keputusan jual-beli instrumen saham sepenuhnya merupakan tanggung jawab masing-masing trader (*Do Your Own Research*).
