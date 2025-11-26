@echo off
chcp 65001 >nul
set PAGER=
set PGCLIENTENCODING=UTF8

echo ========================================
echo Final Verification
echo ========================================
echo.

echo 1. Checking tables...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway" --pset=pager=off -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('molds', 'mold_specifications') ORDER BY tablename;"
echo.

echo 2. Checking mold_id column...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway" --pset=pager=off -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='mold_specifications' AND column_name='mold_id';"
echo.

echo 3. Checking foreign key...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway" --pset=pager=off -c "SELECT conname FROM pg_constraint WHERE conname='fk_mold_specifications_mold_id';"
echo.

echo 4. Checking data...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway" --pset=pager=off -c "SELECT COUNT(*) as total_specs, COUNT(mold_id) as specs_with_mold_id FROM mold_specifications;"
echo.

echo ========================================
echo Verification Complete!
echo ========================================
pause
