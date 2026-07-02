Set-Location 'C:\Users\prash\Downloads\GMG Carrer Page\careers-app'
Remove-Item -Recurse -Force 'node_modules' -ErrorAction SilentlyContinue
Remove-Item -Force 'package-lock.json' -ErrorAction SilentlyContinue
$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm install --no-fund --no-audit --prefer-online > install2.log 2> install2-err.log' -WorkingDirectory (Get-Location).Path -PassThru -WindowStyle Hidden
Set-Content -Path 'install.pid' -Value $p.Id -Encoding ascii
Write-Output ('started reinstall pid=' + $p.Id)
