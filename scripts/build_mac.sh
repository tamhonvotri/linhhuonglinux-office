#!/bin/bash
# Linh Huong Office - macOS Build Script

echo "=========================================="
echo "🍏 Building LinhHuong Office for macOS"
echo "=========================================="

# 1. Install Node.js dependencies
echo "Installing Node.js dependencies..."
pnpm install

# 2. Build Tauri Apps sequentially and gather .dmg immediately
echo "Starting Tauri Build for ALL applications..."
mkdir -p dist_releases/macOS

for app_dir in apps/*; do
  if [ -d "$app_dir/src-tauri" ]; then
    echo "Building $app_dir..."
    (cd "$app_dir" && pnpm tauri build)
    
    # Copy the dmg immediately before the next build deletes it
    if ls target/release/bundle/dmg/*.dmg 1> /dev/null 2>&1; then
        cp target/release/bundle/dmg/*.dmg dist_releases/macOS/
    fi
  fi
done

echo "=========================================="
echo "✅ macOS Build Complete!"
echo "📁 Your packaged apps are located in: dist_releases/macOS/"
echo "=========================================="
