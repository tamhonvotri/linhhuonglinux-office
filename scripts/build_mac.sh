#!/bin/bash
# Linh Huong Office - macOS Build Script

echo "=========================================="
echo "🍏 Building LinhHuong Office for macOS"
echo "=========================================="

# 1. Check for Rust & Cargo
if ! command -v cargo &> /dev/null; then
    echo "Rust is not installed. Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# 2. Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

# 3. Install JS dependencies
echo "Installing Node.js dependencies..."
pnpm install

# 4. Build Tauri App
echo "Starting Tauri Build for Trinh Chieu..."
pnpm --filter trinh-chieu tauri build

echo "=========================================="
echo "✅ macOS Build Complete!"
echo "📁 Your .app and .dmg files are located in: apps/trinh-chieu/src-tauri/target/release/bundle/"
echo "=========================================="
