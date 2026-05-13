# Linh Huong Office - Windows Build Script
# Run this in PowerShell as Administrator (if needed for some dependencies)

Write-Host "=========================================="
Write-Host "🪟 Building LinhHuong Office for Windows"
Write-Host "=========================================="

# 1. Install Node.js dependencies
Write-Host "Installing Node.js dependencies..."
pnpm install

$rootDir = (Get-Item -Path ".\").FullName
$distDir = Join-Path -Path $rootDir -ChildPath "dist_releases\Windows"

# 2. Build Tauri Apps sequentially and gather MSI immediately
Write-Host "Starting Tauri Build for ALL applications..."
if (-Not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Force -Path $distDir
}

$apps = Get-ChildItem -Path "apps" -Directory
foreach ($app in $apps) {
    $appName = $app.Name
    if (Test-Path "$($app.FullName)\src-tauri") {
        Write-Host "Building $appName..."
        Push-Location $app.FullName
        pnpm tauri build
        Pop-Location
        
        $msiPath = Join-Path -Path $rootDir -ChildPath "target\release\bundle\msi"
        if (Test-Path "$msiPath\*.msi") {
            Copy-Item -Path "$msiPath\*.msi" -Destination $distDir -Force
            Write-Host "✅ Copied MSI for $appName"
        } else {
            Write-Host "⚠️ Warning: No MSI found for $appName in $msiPath"
        }
    }
}

Write-Host "=========================================="
Write-Host "✅ Windows Build Complete!"
Write-Host "📁 Your .msi installers are located in: dist_releases\Windows\"
Write-Host "=========================================="
