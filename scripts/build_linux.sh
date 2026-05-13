#!/bin/bash
# Linh Huong Office - Native Linux Build Script

echo "=========================================="
echo "🐧 Building LinhHuong Office for Linux"
echo "=========================================="

# 1. Update and install Linux core UI dependencies for Tauri
echo "Installing WebKit2GTK and system dependencies..."
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

# 2. Check for Rust & Cargo
if ! command -v cargo &> /dev/null; then
    echo "Rust is not installed. Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# 3. Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

# 4. Install JS dependencies
echo "Installing Node.js dependencies..."
pnpm install

# 5. Build Tauri App
echo "Starting Tauri Build for Trinh Chieu..."
pnpm --filter trinh-chieu tauri build

echo "=========================================="
echo "✅ Linux Build Complete!"
echo "📁 Your .deb and .AppImage files are located in: apps/trinh-chieu/src-tauri/target/release/bundle/"
echo "=========================================="
