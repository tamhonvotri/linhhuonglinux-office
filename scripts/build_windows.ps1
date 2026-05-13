# Linh Huong Office - Windows Build Script
# Run this in PowerShell as Administrator (if needed for some dependencies)

Write-Host "=========================================="
Write-Host "🪟 Building LinhHuong Office for Windows"
Write-Host "=========================================="

# 1. Install Node.js dependencies
Write-Host "Installing Node.js dependencies..."
pnpm install

# 2. Build Tauri Apps sequentially
Write-Host "Starting Tauri Build for ALL applications..."
pnpm tauri:build

# 3. Gather the .msi files
Write-Host "Gathering Windows Installers..."
New-Item -ItemType Directory -Force -Path "dist_releases\Windows"

# Tauri outputs MSI installers to target\release\bundle\msi\
if (Test-Path "target\release\bundle\msi") {
    Copy-Item -Path "target\release\bundle\msi\*.msi" -Destination "dist_releases\Windows\" -Force
}

Write-Host "=========================================="
Write-Host "✅ Windows Build Complete!"
Write-Host "📁 Your .msi installers are located in: dist_releases\Windows\"
Write-Host "=========================================="
