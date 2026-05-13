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

# 3. Zip up the .app folders for distribution
echo "Zipping macOS Applications..."
mkdir -p dist_releases/macOS
cd target/release/bundle/macos

for app in *.app; do
  if [ -d "$app" ]; then
    safe_name=$(echo "$app" | sed 's/ /-/g')
    # If the app name has spaces, rename it temporarily
    if [ "$app" != "$safe_name" ]; then
        mv "$app" "$safe_name"
    fi
    echo "Zipping $safe_name..."
    zip -q -r "../../../../dist_releases/macOS/${safe_name}.zip" "$safe_name"
  fi
done

cd ../../../../

echo "=========================================="
echo "✅ macOS Build Complete!"
echo "📁 Your packaged apps are located in: dist_releases/macOS/"
echo "=========================================="
