#!/bin/bash
# Linh Huong Office - Linux Build Script

echo "=========================================="
echo "🐧 Building LinhHuong Office for Linux"
echo "=========================================="

# 1. Install System Dependencies (requires sudo)
echo "Installing necessary Linux system libraries..."
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

# 2. Install Node.js dependencies
echo "Installing Node.js dependencies..."
pnpm install

# 3. Build Tauri Apps sequentially
echo "Starting Tauri Build for ALL applications..."
pnpm tauri:build

# 4. Gather the .deb files
echo "Gathering Linux Installers..."
mkdir -p dist_releases/Linux

if [ -d "target/release/bundle/deb" ]; then
    cp target/release/bundle/deb/*.deb dist_releases/Linux/
fi

echo "=========================================="
echo "✅ Linux Build Complete!"
echo "📁 Your .deb packages are located in: dist_releases/Linux/"
echo "=========================================="
