$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
$keystrikeVersion = (Get-Content package.json -Raw | ConvertFrom-Json).version
$keystrikeConfigVersion = (Get-Content src-tauri/tauri.conf.json -Raw | ConvertFrom-Json).version
if ($keystrikeConfigVersion -ne $keystrikeVersion) { throw 'Frontend/native version mismatch' }
npm run check
if ($LASTEXITCODE -ne 0) { throw 'Required checks failed' }
npm run tauri -- build --no-bundle
if ($LASTEXITCODE -ne 0) { throw 'Native build failed' }
npm run notices
if ($LASTEXITCODE -ne 0) { throw 'Dependency notices failed' }
$keystrikeRelease = Join-Path (Get-Location) 'release'
$keystrikeBuild = Join-Path $keystrikeRelease ('build-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
$keystrikeStage = Join-Path $keystrikeBuild "Keystrike-$keystrikeVersion-windows-x64"
New-Item -ItemType Directory -Path $keystrikeStage -Force | Out-Null
Copy-Item -LiteralPath src-tauri/target/release/keystrike.exe -Destination (Join-Path $keystrikeStage 'Keystrike.exe')
foreach ($keystrikeFile in @('PORTABLE.txt','LICENSE','THIRD-PARTY-NOTICES.txt')) { Copy-Item -LiteralPath $keystrikeFile -Destination $keystrikeStage }
$keystrikeExe = Join-Path $keystrikeRelease "Keystrike-$keystrikeVersion-windows-x64.exe"
$keystrikeZip = Join-Path $keystrikeRelease "Keystrike-$keystrikeVersion-windows-x64.zip"
Copy-Item -LiteralPath (Join-Path $keystrikeStage 'Keystrike.exe') -Destination $keystrikeExe
Compress-Archive -LiteralPath $keystrikeStage -DestinationPath $keystrikeZip -Force
$keystrikeChecksums = foreach ($keystrikeArtifact in @($keystrikeExe,$keystrikeZip)) {
    $keystrikeHasher = [Security.Cryptography.SHA256]::Create()
    try { $keystrikeHash = [BitConverter]::ToString($keystrikeHasher.ComputeHash([IO.File]::ReadAllBytes($keystrikeArtifact))).Replace('-','').ToLowerInvariant() }
    finally { $keystrikeHasher.Dispose() }
    "$keystrikeHash  $([IO.Path]::GetFileName($keystrikeArtifact))"
}
$keystrikeChecksums | Set-Content -LiteralPath (Join-Path $keystrikeRelease 'SHA256SUMS.txt') -Encoding ascii
Get-Item -LiteralPath $keystrikeExe,$keystrikeZip | Select-Object Name,Length
Write-Output "Release ready: keystrike-v$keystrikeVersion. Native-smoke the staged package before publishing."
