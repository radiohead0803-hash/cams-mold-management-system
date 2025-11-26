# PostgreSQL을 사용한 Railway DB 업데이트 스크립트
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Railway Database Update with PostgreSQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

# Railway 환경 변수 로드
Write-Host "Loading Railway environment variables..." -ForegroundColor Yellow
$env:Path = "C:\Program Files\PostgreSQL\17\bin;" + $env:Path

# Railway run으로 DATABASE_URL 가져오기
Write-Host "Connecting to Railway PostgreSQL..." -ForegroundColor Yellow
Write-Host ""

# SQL 파일 실행
$sqlCommands = @"
-- 1. mold_id 컬럼 추가
ALTER TABLE mold_specifications 
ADD COLUMN IF NOT EXISTS mold_id INTEGER;

-- 2. 외래 키 제약 조건 추가
DO `$`$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_mold_specifications_mold_id'
    ) THEN
        ALTER TABLE mold_specifications
        ADD CONSTRAINT fk_mold_specifications_mold_id
        FOREIGN KEY (mold_id) 
        REFERENCES molds(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;
    END IF;
END `$`$;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_mold_specifications_mold_id 
ON mold_specifications(mold_id);

-- 4. 컬럼 코멘트 추가
COMMENT ON COLUMN mold_specifications.mold_id IS '연동된 금형 마스터 ID';

-- 5. 기존 데이터 업데이트
UPDATE mold_specifications ms
SET mold_id = m.id
FROM molds m
WHERE m.specification_id = ms.id
AND ms.mold_id IS NULL;

-- 6. 확인 쿼리
SELECT 
    'Update Complete' as status,
    COUNT(*) as total_specs,
    COUNT(mold_id) as specs_with_mold_id,
    COUNT(*) - COUNT(mold_id) as specs_without_mold_id
FROM mold_specifications;
"@

# SQL을 임시 파일로 저장
$tempSqlFile = Join-Path $env:TEMP "railway_update.sql"
$sqlCommands | Out-File -FilePath $tempSqlFile -Encoding UTF8

Write-Host "Executing SQL commands..." -ForegroundColor Green
railway run psql -f $tempSqlFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Update completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Update failed! Error code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
}

# 임시 파일 삭제
Remove-Item $tempSqlFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
