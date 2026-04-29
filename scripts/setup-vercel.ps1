# Запуск (Windows PowerShell):
#   cd C:\Users\User\Desktop\family-os
#   vercel link --yes --project family-os   # один раз
#   .\scripts\setup-vercel.ps1
#
# Скрипт читает .env.local и кладёт все ключи в Vercel
# (Production + Preview + Development), затем триггерит prod redeploy.

$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "Не нашёл $envFile в текущей папке. Запускай из корня family-os." -ForegroundColor Red
    exit 1
}

$pairs = @{}
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        $idx = $line.IndexOf("=")
        if ($idx -gt 0) {
            $key = $line.Substring(0, $idx).Trim()
            $val = $line.Substring($idx + 1).Trim().Trim('"').Trim("'")
            if ($key -and $val) { $pairs[$key] = $val }
        }
    }
}

Write-Host "Найдено $($pairs.Count) переменных в $envFile" -ForegroundColor Cyan

foreach ($k in $pairs.Keys) {
    foreach ($t in @("production", "preview", "development")) {
        Write-Host "  $k ($t)" -NoNewline
        & vercel env rm $k $t --yes 2>$null | Out-Null
        $pairs[$k] | & vercel env add $k $t 2>&1 | Out-Null
        Write-Host " ok" -ForegroundColor Green
    }
}

Write-Host "`nВсё. Триггерю prod redeploy..." -ForegroundColor Yellow
& vercel --prod --yes
