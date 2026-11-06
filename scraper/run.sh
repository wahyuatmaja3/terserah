#!/usr/bin/env bash
# ============================================================
# run.sh : 1-Click Scraper & Updater untuk Linux/WSL/macOS
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TARGET_FILE="$PROJECT_DIR/assets/data/places.json"
QUERIES_FILE="$SCRIPT_DIR/queries.txt"
RESULTS_CSV="$SCRIPT_DIR/results.csv"

echo "===================================================="
echo " 🎲 Terserah - Google Maps Scraper Pipeline"
echo "===================================================="

if command -v docker >/dev/null 2>&1; then
    echo "[1/2] Menjalankan gosom/google-maps-scraper via Docker..."
    touch "$RESULTS_CSV"

    docker run --rm \
        -v "$QUERIES_FILE:/queries.txt" \
        -v "$RESULTS_CSV:/results.csv" \
        gosom/google-maps-scraper \
        -depth 1 \
        -input /queries.txt \
        -results /results.csv \
        -exit-on-inactivity 1m

    echo "[2/2] Mengonversi dan merge ke assets/data/places.json..."
    node "$SCRIPT_DIR/convert.js" "$RESULTS_CSV"
else
    echo "[INFO] Docker tidak ditemukan. Menjalankan runner Node.js..."
    node "$SCRIPT_DIR/scrape.js"
fi

echo "===================================================="
echo " Siap Push ke GitHub!"
echo "   git add assets/data/places.json"
echo "   git commit -m 'data: update scraped google maps places'"
echo "   git push origin master"
echo "===================================================="
