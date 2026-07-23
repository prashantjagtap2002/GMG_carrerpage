Set-Location 'C:\Users\prash\Downloads\GMG Carrer Page\careers-app'
$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm run build > build.log 2> build-err.log' -WorkingDirectory (Get-Location).Path -PassThru -WindowStyle Hidden
Set-Content -Path 'build.pid' -Value $p.Id -Encoding ascii
Write-Output ('started build pid=' + $p.Id)
