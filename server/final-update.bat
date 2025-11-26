@echo off
chcp 65001 >nul
set PAGER=
set PGCLIENTENCODING=UTF8

echo ========================================
echo Railway Database Update
echo ========================================
echo.

echo Checking tables...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway" --pset=pager=off -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('molds', 'mold_specifications') ORDER BY tablename;"
echo.

echo Adding mold_id column...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway" --pset=pager=off -c "ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS mold_id INTEGER;"
echo.

echo Creating index...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway" --pset=pager=off -c "CREATE INDEX IF NOT EXISTS idx_mold_specifications_mold_id ON mold_specifications(mold_id);"
echo.

echo Updating existing data...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway" --pset=pager=off -c "UPDATE mold_specifications ms SET mold_id = m.id FROM molds m WHERE m.specification_id = ms.id AND ms.mold_id IS NULL;"
echo.

echo Verification...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway" --pset=pager=off -c "SELECT COUNT(*) as total, COUNT(mold_id) as with_mold_id FROM mold_specifications;"
echo.

echo ========================================
echo Update Complete!
echo ========================================
pause
