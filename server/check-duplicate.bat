@echo off
chcp 65001 >nul
set PAGER=
set PGCLIENTENCODING=UTF8

echo ========================================
echo Checking for duplicate part_number
echo ========================================
echo.

echo Checking part_number: 86090-D9WD
"C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway" --pset=pager=off -c "SELECT id, part_number, part_name, car_model, created_at FROM mold_specifications WHERE part_number = '86090-D9WD';"
echo.

echo All existing part_numbers:
"C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway" --pset=pager=off -c "SELECT id, part_number, part_name, car_model, created_at FROM mold_specifications ORDER BY created_at DESC;"
echo.

echo ========================================
pause
