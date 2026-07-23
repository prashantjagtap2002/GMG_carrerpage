Set-Location 'C:\Users\prash\Downloads\GMG Carrer Page\careers-app'
$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm install --no-fund --no-audit > install.log 2> install-err.log' -WorkingDirectory (Get-Location).Path -PassThru -WindowStyle Hidden
Set-Content -Path 'install.pid' -Value $p.Id -Encoding ascii
Write-Output ('started pid=' + $p.Id)

