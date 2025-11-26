@echo off
chcp 65001 >nul
set PAGER=
set PGCLIENTENCODING=UTF8

echo ========================================
echo Creating molds table in Railway
echo ========================================
echo.

"C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway" --pset=pager=off -f create-molds-table.sql

echo.
echo ========================================
echo Done!
echo ========================================
pause
