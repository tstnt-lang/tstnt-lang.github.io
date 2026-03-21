$ErrorActionPreference = "Stop"

$VERSION = "v1.1.0"
$REPO = "tstnt-lang/tstnt"
$BASE_URL = "https://github.com/$REPO/releases/download/$VERSION"

Write-Host ""
Write-Host "  _____  ___  _____  _  _ _____ " -ForegroundColor Cyan
Write-Host " |_   _|/ __||_   _|| \| |_   _|" -ForegroundColor Cyan
Write-Host "   | |  \__ \  | |  | .` | | |  " -ForegroundColor Cyan
Write-Host "   |_|  |___/  |_|  |_|\_| |_|  " -ForegroundColor Cyan
Write-Host ""
Write-Host "TSTNT Installer " -ForegroundColor White -NoNewline
Write-Host $VERSION -ForegroundColor DarkGray
Write-Host ""

$ARCH = if ([System.Environment]::Is64BitOperatingSystem) { "x86_64" } else { "x86" }
$PLATFORM = "windows-$ARCH"
$BINARY = "tstnt-$PLATFORM.exe"
$URL = "$BASE_URL/$BINARY"

Write-Host "platform: $PLATFORM" -ForegroundColor DarkGray

$INSTALL_DIR = "$env:USERPROFILE\bin"
if (!(Test-Path $INSTALL_DIR)) { New-Item -ItemType Directory -Path $INSTALL_DIR | Out-Null }

$OUTFILE = "$INSTALL_DIR\tstnt.exe"

Write-Host "downloading tstnt $VERSION..." -ForegroundColor DarkGray

try {
    Invoke-WebRequest -Uri $URL -OutFile $OUTFILE -UseBasicParsing
} catch {
    Write-Host "error: failed to download $URL" -ForegroundColor Red
    Write-Host "Build from source: https://github.com/$REPO" -ForegroundColor DarkGray
    exit 1
}

Write-Host "✓ installed to $OUTFILE" -ForegroundColor Green

$USER_PATH = [System.Environment]::GetEnvironmentVariable("PATH", "User")
if ($USER_PATH -notlike "*$INSTALL_DIR*") {
    [System.Environment]::SetEnvironmentVariable("PATH", "$USER_PATH;$INSTALL_DIR", "User")
    Write-Host "✓ added $INSTALL_DIR to PATH" -ForegroundColor Green
    Write-Host "restart terminal to apply PATH changes" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "TSTNT installed!" -ForegroundColor Green
Write-Host ""
Write-Host "  tstnt --version       check version" -ForegroundColor Cyan
Write-Host "  tstnt repl            interactive shell" -ForegroundColor Cyan
Write-Host "  tstnt new myproject   scaffold project" -ForegroundColor Cyan
Write-Host "  tstnt pkg search      browse 140+ packages" -ForegroundColor Cyan
Write-Host ""
Write-Host "docs: https://tstnt-lang.github.io/docs.html" -ForegroundColor DarkGray
Write-Host ""
