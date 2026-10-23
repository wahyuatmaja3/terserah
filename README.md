# Terserah 🎲

> **Solusi anti-debat pas ditanya: "Mau makan di mana?"**

Aplikasi web statis untuk memilih tempat kunjungan secara acak berdasarkan preferensi, jarak, waktu, rating, dan anggaran. Berjalan 100% di browser, tanpa backend, siap di-deploy ke GitHub Pages.

Dirancang dengan prinsip **Anti-Slop** ([miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop)) dan diperkaya komponen interaktif dari **React Bits** ([reactbits.dev](https://reactbits.dev/)).

---

## ✨ Fitur & Komponen Interaktif

### React Bits Components
- **ClickSpark** (`/animations/click-spark`): Pancaran percikan partikel dinamis saat elemen interaktif diklik.
- **SpotlightCard** (`/components/spotlight-card`): Kartu dengan pendaran spotlight radial yang mengikuti posisi kursor mouse secara halus.
- **DecryptedText** (`/text-animations/decrypted-text`): Animasi dekripsi karakter teks yang teracak saat nama tempat terpilih muncul.
- **Magnet Button** (`/components/magnet`): Tombol utama dengan efek tarikan magnetis mengikuti kursor.

### Fitur Fungsional
- 📍 **Pilihan Lokasi Fleksibel**:
  - Ketik nama kota/area (pencarian instan via Nominatim).
  - Klik langsung di peta untuk geser titik acuan.
  - Deteksi GPS otomatis jika diizinkan browser.
- 🏷️ **8 Kategori**: Nongkrong, Makan, Hiburan, Alam, Belanja, Budaya, Olahraga, Religi.
- 💸 **Estimasi Anggaran**: Hemat (&lt; 30rb), Sedang (30-100rb), Agak Mahal (100-300rb), Mewah (&gt; 300rb), dan Semua.
- ⏰ **Waktu Kunjungan**: Pagi, Siang, Sore, Malam, atau tombol satu-klik "Gunakan jam saat ini".
- ⭐ **Rating Minimum**: Slider interaktif dengan visualisasi skor bintang.
- 🍽️ **Pencarian Menu & Suasana**: Query LIKE untuk menu atau vibe (kopi, matcha, outdoor, wifi).
- 🗺️ **Peta Interaktif**: OpenStreetMap + pin kandidat tempat di sekeliling radius.
- ❤️ **Koleksi & Riwayat**: Simpan tempat favorit dan tinjau 20 riwayat acak terakhir (LocalStorage).
- 📤 **Bagikan & Navigasi**: Tautan langsung ke Google Maps & Waze, serta Web Share API.

---

## 🎨 Prinsip Desain Anti-Slop

Mengikuti aturan ketat dari `miqdadbadjuber/anti-slop`:
- **Bebas Em Dash**: Mematuhi Hard Gate R-02 (nol karakter `—` pada seluruh teks dan antarmuka).
- **Tanpa AI Cliché**: Menghindari gradien ungu-kebiruan generik, bayangan mengambang berlebihan, dan badge AI palsu.
- **Palet Bertujuan**: Obsidian (`#090a0f`), Slate (`#12141c`), Warm Tangerine (`#f97316`), dan Chalk (`#f8fafc`).
- **Aksesibilitas & Kontras**: Memenuhi standar kontras WCAG AA (&ge; 4.5:1) dengan navigasi ramah sentuhan.

---

## 🚀 Deploy ke GitHub Pages

1. Push repository ke GitHub:
   ```bash
   git add .
   git commit -m "feat: complete anti-slop and react bits UI overhaul"
   git push origin master
   ```
2. Di GitHub: **Settings &rarr; Pages &rarr; Source: Deploy from a branch (master / root)**.
3. Buka URL: `https://<username>.github.io/terserah`

Tidak butuh build step atau backend API key. Langsung berjalan!

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
    │   ├── api.js
    │   ├── filter.js
    │   ├── map.js
    │   ├── storage.js
    │   ├── ui.js
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

MIT. Data peta oleh kontributor [OpenStreetMap](https://www.openstreetmap.org/) (ODbL).
