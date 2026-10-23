# Terserah 🎲

> **Solusi anti-debat pas ditanya: "Mau makan di mana?"**

Aplikasi web statis untuk memilih tempat kunjungan secara acak dengan integrasi resmi **Google Maps** dan **Google Places API**. Berjalan 100% di browser, tanpa backend, siap di-deploy langsung ke GitHub Pages.

Dirancang dengan standar **Anti-Slop** ([miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop)) dan diperkaya komponen interaktif dari **React Bits** ([reactbits.dev](https://reactbits.dev/)).

---

## ✨ Fitur & Integrasi Google Maps

### Integrasi Google Maps & Places API
- 🗺️ **Google Maps JavaScript API**: Peta interaktif dengan tema dark obsidian bespoke yang serasi dengan tampilan aplikasi.
- 🔍 **Google Places API**:
  - Pencarian tempat akurat berbasis radius dan koordinat.
  - Pencarian spesifik menu atau suasana (contoh: "matcha", "sushi", "dimsum") via Google Places Text Search.
  - Foto tempat asli langsung dari Google Places.
  - Rating bintang asli Google Maps beserta jumlah total ulasan komunitas.
  - Status buka atau tutup terkini (*open now*).
  - Tautan langsung ke halaman tempat di Google Maps & navigasi Waze.
- 📍 **Google Geocoding API**: Konversi nama kota/area ke koordinat dan sebaliknya secara presisi.

### Komponen Interaktif React Bits
- **ClickSpark** (`/animations/click-spark`): Pancaran percikan partikel dinamis saat elemen interaktif diklik.
- **SpotlightCard** (`/components/spotlight-card`): Kartu dengan pendaran spotlight radial yang mengikuti posisi kursor mouse secara halus.
- **DecryptedText** (`/text-animations/decrypted-text`): Animasi dekripsi karakter teks yang teracak saat nama tempat terpilih muncul.
- **Magnet Button** (`/components/magnet`): Tombol utama dengan efek tarikan magnetis mengikuti kursor.

---

## 🔑 Konfigurasi Google Maps API Key

Aplikasi ini menggunakan Google Maps JavaScript API langsung dari sisi klien (browser):

1. Dapatkan API Key secara gratis dari [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials).
   *(Catatan: Google memberikan saldo gratis senilai $200 setiap bulan).*
2. Pastikan API berikut telah diaktifkan di Google Cloud Console:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
3. Buka aplikasi Terserah, klik tombol **API Key (⚙️)** di sudut kanan atas, masukkan API Key Anda, lalu klik **Simpan & Aktifkan**.
4. Kunci tersimpan secara lokal dan aman di browser Anda (`localStorage`) dan tidak pernah dikirim ke server mana pun.

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
   git commit -m "feat: switch to Google Maps and Google Places API"
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
└── assets/
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── app.js
    │   ├── api.js                   (Google Maps & Places integration)
    │   ├── filter.js
    │   ├── map.js                   (Google Maps dark-theme controller)
    │   ├── storage.js
    │   ├── ui.js                    (Google place photos & review counts)
    │   └── components/
    │       ├── click-spark.js       (React Bits)
    │       ├── spotlight-card.js    (React Bits)
    │       ├── decrypted-text.js    (React Bits)
    │       └── magnet.js            (React Bits)
    └── images/
        └── placeholder.svg
```

---

## 📝 Lisensi

MIT. Peta dan data lokasi disediakan oleh Google Maps & Google Places API.
