# Railway 데이터베이스 직접 업데이트
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Railway Database Direct Update" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL 경로 추가
$env:PATH = "C:\Program Files\PostgreSQL\17\bin;" + $env:PATH

# Railway 환경 변수 가져오기
Write-Host "Getting Railway database URL..." -ForegroundColor Yellow

# railway variables 실행하고 DATABASE_PUBLIC_URL 찾기
$railwayVars = railway variables 2>&1 | Out-String

# DATABASE_PUBLIC_URL 추출 (정규식 사용)
if ($railwayVars -match 'DATABASE_PUBLIC_URL[^\n]*postgresql://[^\s│║]+') {
    $dbUrl = $matches[0] -replace '.*?(postgresql://[^\s│║]+).*', '$1'
    $dbUrl = $dbUrl.Trim()
    
    Write-Host "Database URL found!" -ForegroundColor Green
    Write-Host "Connecting to: $($dbUrl.Substring(0, 30))..." -ForegroundColor Gray
    Write-Host ""
    
    # SQL 파일 경로
    $sqlFile = Join-Path $PSScriptRoot "update.sql"
    
    if (Test-Path $sqlFile) {
        Write-Host "Executing SQL from file: update.sql" -ForegroundColor Yellow
        Write-Host ""
        
        # psql로 직접 연결하여 SQL 실행
        & "C:\Program Files\PostgreSQL\17\bin\psql.exe" $dbUrl -f $sqlFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "✓ Update completed successfully!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Red
            Write-Host "✗ Update failed with error code: $LASTEXITCODE" -ForegroundColor Red
            Write-Host "========================================" -ForegroundColor Red
        }
    } else {
        Write-Host "Error: update.sql file not found!" -ForegroundColor Red
        Write-Host "Expected path: $sqlFile" -ForegroundColor Red
    }
} else {
    Write-Host "Error: Could not extract DATABASE_PUBLIC_URL" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check Railway connection:" -ForegroundColor Yellow
    Write-Host "  railway status" -ForegroundColor White
    Write-Host "  railway link" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
