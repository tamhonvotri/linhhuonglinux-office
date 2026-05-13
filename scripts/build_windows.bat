@echo off
echo ==========================================
echo 🪟 Building LinhHuong Office for Windows
echo ==========================================

:: 1. Check for Rust & Cargo
cargo --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Rust is not installed!
    echo Please install Rust from: https://rustup.rs/
    pause
    exit /b 1
)

:: 2. Check for pnpm
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo pnpm is not installed!
    echo Please install pnpm by running: npm install -g pnpm
    pause
    exit /b 1
)

:: 3. Install JS dependencies
echo Installing Node.js dependencies...
call pnpm install

:: 4. Build Tauri App
echo Starting Tauri Build for Trinh Chieu...
call pnpm --filter trinh-chieu tauri build

echo ==========================================
echo ✅ Windows Build Complete!
echo 📁 Your .exe and .msi files are located in: apps\trinh-chieu\src-tauri\target\release\bundle\
echo ==========================================
pause
