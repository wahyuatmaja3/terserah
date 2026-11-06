@echo off
title Terserah - Local Server
echo ====================================================
echo  🎲 Membuka Terserah di Peramban Web...
echo ====================================================

:: Cek Python
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo Menjalankan local server via Python di http://localhost:8000
    start http://localhost:8000
    python -m http.server 8000
    goto end
)

:: Cek Node / npx
where npx >nul 2>nul
if %errorlevel% equ 0 (
    echo Menjalankan local server via Node di http://localhost:3000
    start http://localhost:3000
    npx --yes serve -l 3000
    goto end
)

:: Fallback langsung buka index.html
start index.html

:end
