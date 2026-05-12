#!/bin/bash
# LinhHuong OS - Build Script for all applications

echo "🚀 Bắt đầu đóng gói toàn bộ hệ sinh thái LinhHương Linux OS..."

# 1. Cài đặt dependencies
echo "📦 Installing global dependencies..."
pnpm install

# 2. Build Web Assets
echo "🌐 Building web assets..."
pnpm --filter soan-thao build
pnpm --filter bang-tinh build
pnpm --filter trinh-chieu build
pnpm --filter cong-thuc build
pnpm --filter may-tinh build
pnpm --filter nghe-nhac build
pnpm --filter phat-video build
pnpm --filter cua-hang build

# 3. Build Tauri Apps (Linux .deb / AppImage) - Đa Kiến Trúc
echo "🐧 Building Tauri binaries cho x86_64 (Intel/AMD)..."
pnpm tauri:build --target x86_64-unknown-linux-gnu

echo "🐧 Building Tauri binaries cho aarch64 (ARM)..."
pnpm tauri:build --target aarch64-unknown-linux-gnu

echo "✅ Hoàn tất! Các file cài đặt (deb, AppImage) cho x86_64 và ARM đã sẵn sàng trong thư mục src-tauri/target/..."
