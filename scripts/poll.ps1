$base = 'C:\Users\prash\Downloads\GMG Carrer Page\careers-app'
Start-Sleep -Seconds 20
$pidVal = (Get-Content (Join-Path $base 'install.pid') -ErrorAction SilentlyContinue)
$running = $false
if ($pidVal) {
  $proc = Get-Process -Id ([int]$pidVal) -ErrorAction SilentlyContinue
  if ($proc) { $running = $true }
}
$nm = Test-Path (Join-Path $base 'node_modules')
$lock = Test-Path (Join-Path $base 'package-lock.json')
Write-Output ('process running: ' + $running)
Write-Output ('node_modules exists: ' + $nm)
Write-Output ('lockfile exists: ' + $lock)
