$base = 'C:\Users\prash\Downloads\GMG Carrer Page\careers-app'
$nm = Join-Path $base 'node_modules'
$keys = @('react','react-dom','react-router-dom','@radix-ui','lucide-react','tailwindcss','vite','tailwind-merge','class-variance-authority','clsx','tailwindcss-animate')
foreach ($k in $keys) {
  $p = Join-Path $nm $k
  Write-Output ($k + ': ' + (Test-Path $p))
}
