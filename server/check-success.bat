@echo off
chcp 65001 >nul
set PAGER=
set PGCLIENTENCODING=UTF8

echo ========================================
echo Checking Successful Registration
echo ========================================
echo.

echo Latest mold_specifications:
"C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway" --pset=pager=off -c "SELECT id, part_number, part_name, car_model, target_maker_id, maker_company_id, plant_company_id, mold_id, created_at FROM mold_specifications ORDER BY created_at DESC LIMIT 3;"
echo.

echo Latest molds:
"C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway" --pset=pager=off -c "SELECT id, mold_code, mold_name, car_model, qr_token, specification_id, created_at FROM molds ORDER BY created_at DESC LIMIT 3;"
echo.

echo Linked data:
"C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway" --pset=pager=off -c "SELECT ms.id as spec_id, ms.part_number, ms.part_name, ms.mold_id, m.id as mold_id, m.mold_code, m.qr_token FROM mold_specifications ms LEFT JOIN molds m ON ms.mold_id = m.id ORDER BY ms.created_at DESC LIMIT 3;"
echo.

echo ========================================
pause
