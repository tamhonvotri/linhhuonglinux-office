#!/bin/bash
# Linh Huong Office - Colab/Ubuntu Headless Build Script

echo "================================================="
echo "🐧 Building LinhHuong Office for Google Colab/Ubuntu"
echo "================================================="

# 1. Update and install Linux core UI dependencies for Tauri
echo "Installing WebKit2GTK and system dependencies..."
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev xvfb

# 2. Install Node.js (v20) if missing
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 3. Install pnpm
echo "Installing pnpm..."
sudo npm install -g pnpm

# 4. Install Rust
if ! command -v cargo &> /dev/null; then
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# 5. Install JS dependencies
echo "Installing Node.js dependencies..."
pnpm install

# 6. Build Tauri App in Headless mode (using xvfb to fake a display)
echo "Starting Tauri Headless Build for Trinh Chieu..."
# Colab doesn't have a display, so we use xvfb-run to provide a virtual framebuffer
xvfb-run pnpm --filter trinh-chieu tauri build

echo "================================================="
echo "✅ Colab / Ubuntu Build Complete!"
echo "📁 Your .deb and .AppImage files are located in: apps/trinh-chieu/src-tauri/target/release/bundle/"
echo "💡 TIP: You can download the .deb file from Colab using:"
echo "from google.colab import files"
echo "files.download('apps/trinh-chieu/src-tauri/target/release/bundle/deb/trinh-chieu_0.1.0_amd64.deb')"
echo "================================================="
