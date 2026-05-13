# Linh Huong Office - Windows Build Script
# Run this in PowerShell as Administrator (if needed for some dependencies)

Write-Host "=========================================="
Write-Host "🪟 Building LinhHuong Office for Windows"
Write-Host "=========================================="

# 1. Install Node.js dependencies
Write-Host "Installing Node.js dependencies..."
pnpm install

# 2. Build Tauri Apps sequentially and gather MSI immediately
Write-Host "Starting Tauri Build for ALL applications..."
New-Item -ItemType Directory -Force -Path "dist_releases\Windows"

$apps = Get-ChildItem -Path "apps" -Directory
foreach ($app in $apps) {
    $appName = $app.Name
    if (Test-Path "$($app.FullName)\src-tauri") {
        Write-Host "Building $appName..."
        Push-Location $app.FullName
        pnpm tauri build
        Pop-Location
        
        if (Test-Path "target\release\bundle\msi\*.msi") {
            Copy-Item -Path "target\release\bundle\msi\*.msi" -Destination "dist_releases\Windows\" -Force
        }
    }
}

Write-Host "=========================================="
Write-Host "✅ Windows Build Complete!"
Write-Host "📁 Your .msi installers are located in: dist_releases\Windows\"
Write-Host "=========================================="
