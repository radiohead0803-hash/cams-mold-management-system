# Railway PostgreSQL 업데이트 실행 스크립트
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Railway Database Update" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL 경로 설정
$env:Path = "C:\Program Files\PostgreSQL\17\bin;" + $env:Path

# Railway 환경 변수에서 DATABASE_PUBLIC_URL 가져오기
Write-Host "Getting Railway database connection..." -ForegroundColor Yellow

$dbUrl = railway run printenv DATABASE_PUBLIC_URL 2>$null
if (-not $dbUrl) {
    Write-Host "Error: Could not get DATABASE_PUBLIC_URL from Railway" -ForegroundColor Red
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    
    # railway variables 출력에서 DATABASE_PUBLIC_URL 추출
    $varsOutput = railway variables 2>$null | Out-String
    if ($varsOutput -match 'DATABASE_PUBLIC_URL\s+│\s+(.+?)\s+║') {
        $dbUrl = $matches[1].Trim()
    }
}

if (-not $dbUrl -or $dbUrl -eq "") {
    Write-Host "Error: DATABASE_PUBLIC_URL not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run manually:" -ForegroundColor Yellow
    Write-Host '  railway run psql -c "ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS mold_id INTEGER;"' -ForegroundColor White
    exit 1
}

Write-Host "Database URL found!" -ForegroundColor Green
Write-Host ""

# SQL 명령 실행
Write-Host "Executing SQL commands..." -ForegroundColor Yellow
Write-Host ""

$commands = @(
    "ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS mold_id INTEGER;",
    "CREATE INDEX IF NOT EXISTS idx_mold_specifications_mold_id ON mold_specifications(mold_id);",
    "UPDATE mold_specifications ms SET mold_id = m.id FROM molds m WHERE m.specification_id = ms.id AND ms.mold_id IS NULL;",
    "SELECT COUNT(*) as total, COUNT(mold_id) as updated FROM mold_specifications;"
)

$success = $true
foreach ($cmd in $commands) {
    Write-Host "Running: $($cmd.Substring(0, [Math]::Min(50, $cmd.Length)))..." -ForegroundColor Cyan
    
    $result = railway run psql -c $cmd 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Success" -ForegroundColor Green
        if ($cmd -like "*SELECT*") {
            Write-Host "  Result: $result" -ForegroundColor White
        }
    } else {
        if ($result -like "*already exists*") {
            Write-Host "  ℹ Already exists (OK)" -ForegroundColor Yellow
        } else {
            Write-Host "  ✗ Failed: $result" -ForegroundColor Red
            $success = $false
        }
    }
    Write-Host ""
}

# 외래 키 추가 (별도 처리)
Write-Host "Adding foreign key constraint..." -ForegroundColor Yellow
$fkCmd = @"
DO `$`$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_mold_specifications_mold_id') THEN 
        ALTER TABLE mold_specifications ADD CONSTRAINT fk_mold_specifications_mold_id FOREIGN KEY (mold_id) REFERENCES molds(id) ON UPDATE CASCADE ON DELETE SET NULL; 
    END IF; 
END `$`$;
"@

$result = railway run psql -c $fkCmd 2>&1
if ($LASTEXITCODE -eq 0 -or $result -like "*already exists*") {
    Write-Host "  ✓ Foreign key added" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed: $result" -ForegroundColor Red
    $success = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($success) {
    Write-Host "Update completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Update completed with some errors" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
