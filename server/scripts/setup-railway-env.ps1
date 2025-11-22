# Railway Environment Variables Setup Script

Write-Host "Setting up Railway environment variables..." -ForegroundColor Green

# Get DATABASE_PUBLIC_URL from Postgres service
$dbUrl = railway variables --json | ConvertFrom-Json | Select-Object -ExpandProperty DATABASE_PUBLIC_URL

# Set environment variables
$envVars = @{
    "DATABASE_URL" = $dbUrl
    "NODE_ENV" = "production"
    "PORT" = "3001"
    "API_VERSION" = "v1"
    "JWT_SECRET" = "cams-mold-management-system-super-secret-key-2024-production-min-32-chars"
    "JWT_EXPIRES_IN" = "8h"
    "JWT_REFRESH_EXPIRES_IN" = "7d"
    "CORS_ORIGIN" = "*"
    "MAX_FILE_SIZE" = "10485760"
    "LOG_LEVEL" = "info"
    "RATE_LIMIT_WINDOW_MS" = "900000"
    "RATE_LIMIT_MAX_REQUESTS" = "100"
}

Write-Host "`nEnvironment variables to set:" -ForegroundColor Cyan
$envVars.GetEnumerator() | ForEach-Object {
    Write-Host "  $($_.Key) = $($_.Value)" -ForegroundColor Yellow
}

Write-Host "`nApplying environment variables to Railway..." -ForegroundColor Green

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Setting $key..." -ForegroundColor Gray
    railway variables --set "$key=$value" 2>&1 | Out-Null
}

Write-Host "`n✅ Environment variables set successfully!" -ForegroundColor Green
Write-Host "`nVerifying variables..." -ForegroundColor Cyan

railway variables

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
