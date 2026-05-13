#!/bin/bash
# Linh Huong Office - macOS Build Script

echo "=========================================="
echo "🍏 Building LinhHuong Office for macOS"
echo "=========================================="

# 1. Install Node.js dependencies
echo "Installing Node.js dependencies..."
pnpm install

# 2. Build Tauri Apps sequentially (avoids cargo lock contention)
echo "Starting Tauri Build for ALL applications..."
pnpm tauri:build

# 3. Gather the .dmg files for distribution
echo "Gathering macOS DMG files..."
mkdir -p dist_releases/macOS

if [ -d "target/release/bundle/dmg" ]; then
    cp target/release/bundle/dmg/*.dmg dist_releases/macOS/
fi

echo "=========================================="
echo "✅ macOS Build Complete!"
echo "📁 Your packaged apps are located in: dist_releases/macOS/"
echo "=========================================="
