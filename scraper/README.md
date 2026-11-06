# Google Maps Scraper Pipeline untuk Terserah 🎲

Folder ini disiapkan khusus untuk mengambil data tempat asli dari Google Maps menggunakan **[gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper)** (atau runner bawaan) dan **langsung memperbarui `assets/data/places.json` secara otomatis**.

Anda tidak perlu pusing me-rename atau memformat data manual. Sekali run, file langsung ter-update dan siap di-push ke GitHub!

---

## 🚀 Cara Menjalankan Scraper di Komputer Anda

### Cara 1: Menggunakan Script Otomatis (1-Click)

**Di Windows (PowerShell):**
```powershell
.\scraper\run.ps1
```

**Di Linux / Mac / WSL:**
```bash
bash scraper/run.sh
```

Script akan:
1. Membaca kata kunci target dari `scraper/queries.txt`.
2. Menjalankan `gosom/google-maps-scraper` via Docker (atau runner bawaan jika Docker belum aktif).
3. Mengonversi dan melakukan **auto-merge & deduplikasi** ke `assets/data/places.json`.
4. Menampilkan ringkasan jumlah tempat baru dan total tempat di database.

---

### Cara 2: Menjalankan Docker Manual (Jika Ingin Custom Parameter)

Jika Anda ingin menjalankan Docker sendiri dengan opsi tambahan:

```bash
# 1. Jalankan scraper
docker run --rm \
  -v "${PWD}/scraper/queries.txt:/queries.txt" \
  -v "${PWD}/scraper/results.csv:/results.csv" \
  gosom/google-maps-scraper \
  -depth 1 \
  -input /queries.txt \
  -results /results.csv

# 2. Update langsung ke places.json dengan script convert
node scraper/convert.js scraper/results.csv
```

---

### Cara 3: Mengonversi File Hasil Scrape Apa Pun

Jika Anda punya file `results.csv` atau `results.json` dari scraper lain:
```bash
node scraper/convert.js path/ke/file-anda.json
# atau
node scraper/convert.js path/ke/file-anda.csv
```
File `assets/data/places.json` akan langsung otomatis digabungkan tanpa menghapus data yang sudah ada sebelumnya.

---

## 📝 Menambah Kata Kunci Pencarian Baru

Buka berkas `scraper/queries.txt` dan tambahkan baris pencarian baru, contoh:
```text
cafe rooftop jakarta selatan
kuliner malam pasar santa
coffee shop braga bandung
seafood pasar muara karang
```

---

## 📦 Push Hasil Data Offline ke GitHub

Setelah menjalankan scraper:
```bash
git add assets/data/places.json
git commit -m "data: update scraped google maps places"
git push origin master
```
Aplikasi web Anda di GitHub Pages akan langsung menyajikan tempat-tempat baru tersebut secara instan tanpa perlu API Key Google Cloud!
