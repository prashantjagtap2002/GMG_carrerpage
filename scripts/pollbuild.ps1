$base = 'C:\Users\prash\Downloads\GMG Carrer Page\careers-app'
Start-Sleep -Seconds 25
$pidVal = (Get-Content (Join-Path $base 'build.pid') -ErrorAction SilentlyContinue)
$running = $false
if ($pidVal) {
  $proc = Get-Process -Id ([int]$pidVal) -ErrorAction SilentlyContinue
  if ($proc) { $running = $true }
}
$dist = Test-Path (Join-Path $base 'dist')
Write-Output ('build process running: ' + $running)
Write-Output ('dist exists: ' + $dist)
