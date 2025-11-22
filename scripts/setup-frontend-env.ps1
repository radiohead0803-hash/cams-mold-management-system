# Railway Frontend Environment Variables Setup Script

Write-Host "=== Railway Frontend Environment Setup ===" -ForegroundColor Cyan
Write-Host ""

# Backend URL - 사용자 입력 받기
Write-Host "Enter your Backend Railway URL:" -ForegroundColor Yellow
Write-Host "Example: https://your-backend.up.railway.app" -ForegroundColor Gray
$backendUrl = Read-Host "Backend URL"

if ([string]::IsNullOrWhiteSpace($backendUrl)) {
    Write-Host "Error: Backend URL is required!" -ForegroundColor Red
    exit 1
}

# 환경 변수 설정
$envVars = @{
    "VITE_API_URL" = $backendUrl
    "VITE_APP_NAME" = "CAMS"
    "VITE_APP_VERSION" = "1.0.0"
    "NODE_ENV" = "production"
}

Write-Host "`nEnvironment variables to set:" -ForegroundColor Cyan
$envVars.GetEnumerator() | ForEach-Object {
    Write-Host "  $($_.Key) = $($_.Value)" -ForegroundColor Yellow
}

Write-Host "`nApplying environment variables to Railway..." -ForegroundColor Green
Write-Host "Make sure you are linked to the FRONTEND service!" -ForegroundColor Yellow
Write-Host ""

# 현재 서비스 확인
Write-Host "Current Railway service:" -ForegroundColor Cyan
railway status

Write-Host "`nDo you want to continue? (Y/N)" -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Red
    exit 0
}

# 환경 변수 설정
foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Setting $key..." -ForegroundColor Gray
    railway variables --set "$key=$value"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ $key set successfully" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed to set $key" -ForegroundColor Red
    }
}

Write-Host "`n✅ Environment variables setup complete!" -ForegroundColor Green
Write-Host "`nVerifying variables..." -ForegroundColor Cyan
railway variables

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify the variables above" -ForegroundColor White
Write-Host "2. Railway will automatically redeploy" -ForegroundColor White
Write-Host "3. Check deployment logs in Railway dashboard" -ForegroundColor White
