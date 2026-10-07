// UNIVERSE Saham IHSG Terlikuid & Aktif (Tanpa Batasan Modal 500rb)
const UNIVERSE = [
  // Big Banks & Finansial
  { code: 'BBCA', name: 'Bank Central Asia', sector: 'Perbankan', risk: 'Low' },
  { code: 'BBRI', name: 'Bank Rakyat Indonesia', sector: 'Perbankan', risk: 'Low' },
  { code: 'BMRI', name: 'Bank Mandiri', sector: 'Perbankan', risk: 'Low' },
  { code: 'BBNI', name: 'Bank Negara Indonesia', sector: 'Perbankan', risk: 'Low' },
  { code: 'BRIS', name: 'Bank Syariah Indonesia', sector: 'Perbankan', risk: 'Medium' },

  // Konglomerasi, Telekomunikasi & Alat Berat
  { code: 'ASII', name: 'Astra International', sector: 'Otomotif & Konglomerat', risk: 'Low' },
  { code: 'TLKM', name: 'Telkom Indonesia', sector: 'Telekomunikasi', risk: 'Low' },
  { code: 'UNTR', name: 'United Tractors', sector: 'Alat Berat & Tambang', risk: 'Medium' },

  // Pertambangan, Energi, Logam & Komoditas
  { code: 'ADRO', name: 'Adaro Energy Indonesia', sector: 'Batubara & Energi', risk: 'Medium' },
  { code: 'ADMR', name: 'Adaro Minerals', sector: 'Batubara Metalurgi', risk: 'Medium' },
  { code: 'PTBA', name: 'Bukit Asam', sector: 'Batubara', risk: 'Low' },
  { code: 'ANTM', name: 'Aneka Tambang', sector: 'Tambang Emas & Nikel', risk: 'Medium' },
  { code: 'MEDC', name: 'Medco Energi Internasional', sector: 'Minyak & Gas', risk: 'Medium' },
  { code: 'BRMS', name: 'Bumi Resources Minerals', sector: 'Tambang Emas', risk: 'High' },
  { code: 'BUMI', name: 'Bumi Resources', sector: 'Batubara', risk: 'High' },
  { code: 'ELSA', name: 'Elnusa', sector: 'Energi & Jasa Migas', risk: 'Low' },
  { code: 'ENRG', name: 'Energi Mega Persada', sector: 'Minyak & Gas', risk: 'High' },
  { code: 'PGAS', name: 'Perusahaan Gas Negara', sector: 'Energi Gas', risk: 'Low' },
  { code: 'RAJA', name: 'Rukun Raharja', sector: 'Energi Gas', risk: 'Medium' },
  { code: 'DEWA', name: 'Darma Henwa', sector: 'Jasa Tambang', risk: 'High' },
  { code: 'DOID', name: 'Delta Dunia Makmur', sector: 'Kontraktor Tambang', risk: 'Medium' },
  { code: 'PSAB', name: 'J Resources Asia Pasifik', sector: 'Tambang Emas', risk: 'High' },
  { code: 'INCO', name: 'Vale Indonesia', sector: 'Tambang Nikel', risk: 'Medium' },
  { code: 'MDKA', name: 'Merdeka Copper Gold', sector: 'Tambang Emas & Tembaga', risk: 'Medium' },

  // Saham High Beta, Konglomerasi & Pertumbuhan
  { code: 'AMMN', name: 'Amman Mineral Internasional', sector: 'Tambang Tembaga & Emas', risk: 'High' },
  { code: 'PANI', name: 'Pantai Indah Kapuk Dua', sector: 'Properti & Kawasan', risk: 'High' },
  { code: 'CUAN', name: 'Petrindo Jaya Kreasi', sector: 'Energi & Tambang', risk: 'High' },
  { code: 'BREN', name: 'Barito Renewables', sector: 'Energi Terbarukan', risk: 'High' },
  { code: 'TPIA', name: 'Chandra Asri Pacific', sector: 'Petrokimia', risk: 'Medium' },

  // Teknologi & Telekomunikasi
  { code: 'GOTO', name: 'GoTo Gojek Tokopedia', sector: 'Teknologi', risk: 'Medium' },
  { code: 'BUKA', name: 'Bukalapak.com', sector: 'Teknologi', risk: 'Medium' },
  { code: 'WIFI', name: 'Solusi Sinergi Digital', sector: 'Telekomunikasi', risk: 'High' },
  { code: 'INET', name: 'Sinergi Inti Andalan', sector: 'Infrastruktur Internet', risk: 'High' },

  // Konsumer, Farmasi & Ritel
  { code: 'ICBP', name: 'Indofood CBP Sukses Makmur', sector: 'Consumer Goods', risk: 'Low' },
  { code: 'INDF', name: 'Indofood Sukses Makmur', sector: 'Consumer Goods', risk: 'Low' },
  { code: 'KLBF', name: 'Kalbe Farma', sector: 'Farmasi & Kesehatan', risk: 'Low' },
  { code: 'CPIN', name: 'Charoen Pokphand Indonesia', sector: 'Pakan Ternak & Unggas', risk: 'Medium' },
  { code: 'ERAA', name: 'Erajaya Swasembada', sector: 'Ritel & Distribusi', risk: 'Medium' },
  { code: 'MNCN', name: 'Media Nusantara Citra', sector: 'Media & Hiburan', risk: 'Medium' },

  // Properti, Konstruksi & Infrastruktur
  { code: 'WIKA', name: 'Wijaya Karya', sector: 'Konstruksi', risk: 'High' },
  { code: 'PTPP', name: 'PP (Persero)', sector: 'Konstruksi', risk: 'High' },
  { code: 'JSMR', name: 'Jasa Marga', sector: 'Jalan Tol & Transportasi', risk: 'Low' },
  { code: 'SMGR', name: 'Semen Indonesia', sector: 'Bahan Bangunan', risk: 'Medium' },
  { code: 'SSIA', name: 'Surya Semesta Internusa', sector: 'Properti & Kawasan', risk: 'Medium' },
  { code: 'KPIG', name: 'MNC Land', sector: 'Properti', risk: 'Medium' },
  { code: 'KIJA', name: 'Kawasan Industri Jababeka', sector: 'Kawasan Industri', risk: 'Low' },
  { code: 'APLN', name: 'Agung Podomoro Land', sector: 'Properti', risk: 'Low' },
  { code: 'BKSL', name: 'Sentul City', sector: 'Properti', risk: 'High' },
  { code: 'BULL', name: 'Buana Lintas Lautan', sector: 'Pelayaran Energi', risk: 'High' }
];

const BROKER_MASTER = {
  AK: { code: 'AK', name: 'UBS Sekuritas', type: 'Asing / Institusi' },
  BK: { code: 'BK', name: 'J.P. Morgan', type: 'Asing / Institusi' },
  KZ: { code: 'KZ', name: 'CLSA Sekuritas', type: 'Asing / Institusi' },
  ZP: { code: 'ZP', name: 'Maybank Sekuritas', type: 'Asing / Institusi' },
  CC: { code: 'CC', name: 'Mandiri Sekuritas', type: 'Institusi BUMN' },
  NI: { code: 'NI', name: 'BNI Sekuritas', type: 'Institusi BUMN' },
  YU: { code: 'YU', name: 'CGS International', type: 'Institusi Swasta' },
  MG: { code: 'MG', name: 'Semesta Indovest', type: 'Bandar Scalper' },
  YP: { code: 'YP', name: 'Mirae Asset', type: 'Ritel Domestik' },
  PD: { code: 'PD', name: 'Indo Premier', type: 'Ritel Domestik' },
  XC: { code: 'XC', name: 'Ajaib Sekuritas', type: 'Ritel Domestik' },
  XL: { code: 'XL', name: 'Stockbit Sekuritas', type: 'Ritel Domestik' }
};

const CACHE_TTL_SCREENER_MS = 10 * 1000;
const CACHE_TTL_QUOTE_MS = 2 * 1000;

module.exports = {
  UNIVERSE,
  BROKER_MASTER,
  CACHE_TTL_SCREENER_MS,
  CACHE_TTL_QUOTE_MS
};
