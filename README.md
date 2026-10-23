# Terserah 🎲

> **Bingung mau ke mana? Biarkan Terserah yang memilihkan!**

Aplikasi web statis untuk memilih tempat kunjungan secara **random** berdasarkan preferensimu — berjalan 100% di browser, gratis, tanpa login.

🔗 **Live Demo:** `https://<username>.github.io/terserah`

---

## ✨ Fitur

- 📍 **Deteksi lokasi otomatis** via GPS browser
- 🏷️ **8 kategori tempat** — Nongkrong, Makan, Hiburan, Alam, Belanja, Budaya, Olahraga, Religi
- ⏰ **Filter waktu** — Pagi, Siang, Sore, Malam, atau Kapan Saja
- 🔢 **Filter radius** — 1 s.d. 30 km dengan slider
- ⭐ **Filter rating minimum**
- 🍽️ **Food/suasana query** — cari berdasarkan menu, kata kunci (kopi, wifi, vegan, dll)
- 🗺️ **Peta interaktif** dengan Leaflet.js + OpenStreetMap
- 🎲 **Re-roll** tanpa fetch ulang
- ❤️ **Wishlist** — simpan tempat favorit (LocalStorage)
- 🕐 **Riwayat** — 20 pick terakhir
- 📤 **Share** via Web Share API / copy clipboard
- 📱 **PWA** — bisa di-install di Android/iOS

---

## 🏗️ Tech Stack

| Komponen | Teknologi |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JS (ES Modules) |
| Peta | [Leaflet.js](https://leafletjs.com/) + OpenStreetMap |
| Data Tempat | [Overpass API](https://overpass-api.de/) (OpenStreetMap) |
| Geocoding | [Nominatim](https://nominatim.org/) |
| Storage | LocalStorage (tanpa backend) |
| Hosting | GitHub Pages |

---

## 🚀 Deploy ke GitHub Pages

1. **Fork / clone** repo ini
2. Push ke branch `main`
3. Di GitHub: **Settings → Pages → Source: Deploy from branch → main / root**
4. Akses di `https://<username>.github.io/<repo-name>`

Tidak ada konfigurasi tambahan. Tidak perlu API key. Langsung jalan!

---

## 📁 Struktur File

```
terserah/
├── index.html
├── manifest.json        ← PWA manifest
├── sw.js                ← Service Worker
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js       ← Entry point utama
│   │   ├── api.js       ← Overpass API + Nominatim
│   │   ├── filter.js    ← Logika filter & haversine distance
│   │   ├── map.js       ← Leaflet controller
│   │   ├── storage.js   ← LocalStorage (wishlist & history)
│   │   └── ui.js        ← UI helpers (toast, drawers, result card)
│   └── images/
│       └── placeholder.svg
└── README.md
```

---

## 🗺️ Roadmap

- [x] MVP: filter, pick, peta, wishlist, history
- [ ] Filter budget
- [ ] Animasi roulette spin
- [ ] Mode "Surprise Me!" (tanpa filter)
- [ ] Mode Perencanaan Hari (itinerary pagi-malam)
- [ ] Mode Group Decision (voting via URL)
- [ ] Google Places opt-in (foto tempat)

---

## 📝 Lisensi

MIT — bebas digunakan dan dimodifikasi.

---

*Data tempat disediakan oleh [OpenStreetMap](https://www.openstreetmap.org/) contributors, lisensi [ODbL](https://opendatacommons.org/licenses/odbl/).*
