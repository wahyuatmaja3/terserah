# Terserah 🎲

> **Solusi anti-debat pas ditanya: "Mau makan di mana?"**

Aplikasi web statis untuk memilih tempat kunjungan secara acak dengan data asli **Google Maps** (rating, ulasan, foto, tautan navigasi) dan peta interaktif bertema obsidian dark. Berjalan 100% di browser, tanpa backend, tanpa biaya API, dan siap di-deploy langsung ke **GitHub Pages**.

Dirancang dengan standar **Anti-Slop** ([miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop)) dan diperkaya komponen interaktif dari **React Bits** ([reactbits.dev](https://reactbits.dev/)).

---

## ✨ Fitur & Integrasi Google Maps

### Data Tempat Google Maps
- 🗺️ **Peta Interaktif Bebas Biaya**: Menggunakan Leaflet & Esri Dark Gray Canvas tiles bertema Obsidian Dark (100% gratis, tanpa API Key, dan bekerja mulus di file:// maupun web server).
- ⭐ **Data Asli Google Maps**:
  - Rating bintang asli Google Maps beserta jumlah total ulasan komunitas.
  - Alamat lengkap dan koordinat GPS presisi.
  - Foto tempat asli Google Maps.
  - Tautan langsung ke halaman tempat di Google Maps & navigasi Waze.
- 🎯 **Pencarian Cerdas**:
  - Filter radius (1 sampai 30 km) dari titik acuan pengguna.
  - Pencarian spesifik menu atau suasana (contoh: "matcha", "sushi", "dimsum", "outdoor").
  - 9 Kategori lengkap (360+ tempat): Nongkrong, Makan, Jajan (street snack & dimsum), Hiburan (billiard, bioskop, game center, rental PS, board game), Alam, Belanja, Budaya, Olahraga, Religi.
  - Estimasi anggaran (Hemat, Sedang, Agak Mahal, Mewah).

### Komponen Interaktif React Bits
- **ClickSpark** (`/animations/click-spark`): Pancaran percikan partikel dinamis saat elemen interaktif diklik.
- **SpotlightCard** (`/components/spotlight-card`): Kartu dengan pendaran spotlight radial yang mengikuti posisi kursor mouse secara halus.
- **DecryptedText** (`/text-animations/decrypted-text`): Animasi dekripsi karakter teks yang teracak saat nama tempat terpilih muncul.
- **Magnet Button** (`/components/magnet`): Tombol utama dengan efek tarikan magnetis mengikuti kursor.

---

## ⚡ Scraper Pipeline & Update Data Google Maps

Aplikasi ini membaca data dari `assets/data/places.json`. Anda dapat mengambil data tempat baru kapan saja menggunakan scraper yang sudah disiapkan di folder `scraper/`.

### 1. Jalankan Scraper di Komputer Anda

**Di Windows (PowerShell):**
```powershell
.\scraper\run.ps1
```

**Di Linux / macOS / WSL:**
```bash
bash scraper/run.sh
```

Script akan:
1. Membaca daftar query pencarian dari `scraper/queries.txt`.
2. Menjalankan crawler Google Maps via Docker ([gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper)) atau runner Node.js.
3. Otomatis mengonversi, deduplikasi, dan menggabungkan hasilnya langsung ke `assets/data/places.json`.

### 2. Push ke GitHub Pages

Setelah scraper selesai, Anda tinggal menjalankan:
```bash
git add assets/data/places.json
git commit -m "data: update scraped google maps places"
git push origin master
```
GitHub Pages Anda akan otomatis menyajikan data terbaru secara instan.

---

## 🎨 Prinsip Desain Anti-Slop

Mengikuti aturan ketat dari `miqdadbadjuber/anti-slop`:
- **Bebas Em Dash**: Mematuhi Hard Gate R-02 (nol karakter em dash pada seluruh teks dan antarmuka).
- **Tanpa AI Cliché**: Menghindari gradien ungu-kebiruan generik, bayangan mengambang berlebihan, dan badge AI palsu.
- **Palet Bertujuan**: Obsidian (`#090a0f`), Slate (`#12141c`), Warm Tangerine (`#f97316`), dan Chalk (`#f8fafc`).
- **Aksesibilitas & Kontras**: Memenuhi standar kontras WCAG AA (&ge; 4.5:1) dengan navigasi ramah sentuhan.

---

## 🚀 Deploy ke GitHub Pages

1. Push repository ke GitHub:
   ```bash
   git add .
   git commit -m "feat: implement offline google maps scraped data and automated scraper pipeline"
   git push origin master
   ```
2. Di GitHub: **Settings &rarr; Pages &rarr; Source: Deploy from a branch (master / root)**.
3. Buka URL: `https://<username>.github.io/terserah`

---

## 📁 Struktur Berkas

```
terserah/
├── index.html
├── manifest.json
├── sw.js
├── README.md
├── scraper/
│   ├── README.md               (Petunjuk scraper)
│   ├── queries.txt             (Daftar kata kunci pencarian Google Maps)
│   ├── convert.js              (Normalizer & auto-merger ke places.json)
│   ├── scrape.js               (Runner scraper Node.js)
│   ├── run.ps1                 (Script 1-klik PowerShell Windows)
│   └── run.sh                  (Script 1-klik Bash Linux/Mac)
└── assets/
    ├── data/
    │   └── places.json         (Database tempat Google Maps siap pakai)
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── app.js
    │   ├── api.js              (Places provider & Nominatim geocoder)
    │   ├── filter.js           (Haversine distance & filter logic)
    │   ├── map.js              (Leaflet Obsidian controller)
    │   ├── storage.js          (Wishlist & History manager)
    │   ├── ui.js               (SpotlightCard, drawers, & toasts)
    │   └── components/
    │       ├── click-spark.js
    │       ├── spotlight-card.js
    │       ├── decrypted-text.js
    │       └── magnet.js
    └── images/
        └── placeholder.svg
```

---

## 📝 Lisensi

MIT License. Bebas digunakan dan dikembangkan untuk keperluan pribadi maupun komunitas.
