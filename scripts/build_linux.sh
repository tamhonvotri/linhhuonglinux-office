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

# 3. Build Tauri Apps sequentially and gather DEB immediately
echo "Starting Tauri Build for ALL applications..."
ROOT_DIR=$(pwd)
DIST_DIR="$ROOT_DIR/dist_releases/Linux"
mkdir -p "$DIST_DIR"

for app_dir in apps/*; do
  if [ -d "$app_dir/src-tauri" ]; then
    echo "Building $app_dir..."
    (cd "$app_dir" && pnpm tauri build)
    
    MSI_PATH="$ROOT_DIR/target/release/bundle/deb"
    if ls "$MSI_PATH"/*.deb 1> /dev/null 2>&1; then
        cp "$MSI_PATH"/*.deb "$DIST_DIR/"
        echo "✅ Copied DEB for $(basename $app_dir)"
    else
        echo "⚠️ Warning: No DEB found for $(basename $app_dir) in $MSI_PATH"
    fi
  fi
done

echo "=========================================="
echo "✅ Linux Build Complete!"
echo "📁 Your .deb packages are located in: dist_releases/Linux/"
echo "=========================================="
