# ============================================================
# run.ps1 : 1-Click Scraper & Updater untuk Windows (PowerShell)
# Menjalankan scraper dan langsung memperbarui assets/data/places.json
# ============================================================

param(
    [switch]$BuildOnly = $false
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectDir = Split-Path -Parent $ScriptDir
$TargetFile = Join-Path $ProjectDir "assets\data\places.json"
$QueriesFile = Join-Path $ScriptDir "queries.txt"
$ResultsCSV = Join-Path $ScriptDir "results.csv"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " 🎲 Terserah - Google Maps Scraper Pipeline" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

if ($BuildOnly) {
    Write-Host "[BUILD] Membangun & sinkronisasi database 350+ tempat..." -ForegroundColor Green
    node "$ScriptDir\build_places.js"
    exit 0
}

# Check if Docker is available
$dockerAvailable = $false
try {
    $null = docker --version 2>&1
    $dockerAvailable = ($LASTEXITCODE -eq 0)
} catch {
    $dockerAvailable = $false
}

if ($dockerAvailable) {
    Write-Host "[1/2] Menjalankan gosom/google-maps-scraper via Docker..." -ForegroundColor Green
    
    if (-not (Test-Path $ResultsCSV)) {
        New-Item -ItemType File -Path $ResultsCSV -Force | Out-Null
    }

    $queriesPath = (Resolve-Path $QueriesFile).Path -replace '\\', '/'
    $resultsPath = (Resolve-Path $ResultsCSV).Path -replace '\\', '/'

    docker run --rm `
        -v "${queriesPath}:/queries.txt" `
        -v "${resultsPath}:/results.csv" `
        gosom/google-maps-scraper `
        -depth 1 `
        -input /queries.txt `
        -results /results.csv `
        -exit-on-inactivity 1m

    Write-Host "`n[2/2] Mengonversi dan merge ke assets/data/places.json..." -ForegroundColor Green
    node "$ScriptDir\convert.js" "$ResultsCSV"
} else {
    Write-Host "[INFO] Docker tidak aktif/terpasang. Menggunakan runner Node.js bawaan..." -ForegroundColor Yellow
    node "$ScriptDir\scrape.js"
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Proses scraping gagal atau terhenti (Exit code: $LASTEXITCODE)." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n====================================================" -ForegroundColor Green
Write-Host " Siap Push ke GitHub!" -ForegroundColor Green
Write-Host " Jalankan perintah berikut:" -ForegroundColor White
Write-Host "   git add assets/data/places.json" -ForegroundColor Yellow
Write-Host "   git commit -m 'data: update scraped google maps places'" -ForegroundColor Yellow
Write-Host "   git push origin master" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Green
