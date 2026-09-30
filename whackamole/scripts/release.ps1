$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
$moleVersion = (Get-Content package.json -Raw | ConvertFrom-Json).version
$moleConfigVersion = (Get-Content src-tauri/tauri.conf.json -Raw | ConvertFrom-Json).version
if ($moleVersion -ne $moleConfigVersion) { throw 'Version mismatch' }
foreach ($moleExpected in @('src-tauri/target/release/whackamole.exe', "src-tauri/target/release/bundle/nsis/whackamole_${moleVersion}_x64-setup.exe", "src-tauri/target/release/bundle/msi/whackamole_${moleVersion}_x64_en-US.msi")) {
    if (-not (Test-Path -LiteralPath $moleExpected)) { throw "Build first: missing $moleExpected" }
}
$moleOutput = Join-Path (Get-Location) "release/v$moleVersion"
$moleStage = Join-Path $moleOutput "whackamole-$moleVersion-win-x64"
New-Item -ItemType Directory -Path $moleStage -Force | Out-Null
Copy-Item -LiteralPath src-tauri/target/release/whackamole.exe -Destination (Join-Path $moleStage 'whackamole.exe')
Copy-Item -LiteralPath PORTABLE.txt -Destination (Join-Path $moleStage 'portable.txt')
Copy-Item -LiteralPath PORTABLE.txt -Destination (Join-Path $moleStage 'README.txt')
Compress-Archive -LiteralPath $moleStage -DestinationPath (Join-Path $moleOutput "whackamole-$moleVersion-win-x64.zip") -Force
Copy-Item -LiteralPath "src-tauri/target/release/bundle/nsis/whackamole_${moleVersion}_x64-setup.exe" -Destination $moleOutput
Copy-Item -LiteralPath "src-tauri/target/release/bundle/msi/whackamole_${moleVersion}_x64_en-US.msi" -Destination $moleOutput
$moleHashes = Get-ChildItem -LiteralPath $moleOutput -File | Where-Object { $_.Extension -in @('.zip','.exe','.msi') } | ForEach-Object {
    $moleHasher = [Security.Cryptography.SHA256]::Create()
    try { $moleHash = [BitConverter]::ToString($moleHasher.ComputeHash([IO.File]::ReadAllBytes($_.FullName))).Replace('-','').ToLowerInvariant() }
    finally { $moleHasher.Dispose() }
    "$moleHash  $($_.Name)"
}
$moleHashes | Set-Content -LiteralPath (Join-Path $moleOutput 'SHA256SUMS.txt') -Encoding ascii
Get-ChildItem -LiteralPath $moleOutput -File | Select-Object Name,Length
