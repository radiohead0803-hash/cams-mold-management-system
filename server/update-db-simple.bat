@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Railway Database Update
echo ========================================
echo.

set PSQL="C:\Program Files\PostgreSQL\17\bin\psql.exe"
set PATH=C:\Program Files\PostgreSQL\17\bin;%PATH%

echo Step 1: Adding mold_id column...
railway run psql -c "ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS mold_id INTEGER;"
echo.

echo Step 2: Creating index...
railway run psql -c "CREATE INDEX IF NOT EXISTS idx_mold_specifications_mold_id ON mold_specifications(mold_id);"
echo.

echo Step 3: Updating existing data...
railway run psql -c "UPDATE mold_specifications ms SET mold_id = m.id FROM molds m WHERE m.specification_id = ms.id AND ms.mold_id IS NULL;"
echo.

echo Step 4: Verification...
railway run psql -c "SELECT COUNT(*) as total, COUNT(mold_id) as with_mold_id FROM mold_specifications;"
echo.

echo ========================================
echo Update process completed!
echo ========================================
echo.
pause
