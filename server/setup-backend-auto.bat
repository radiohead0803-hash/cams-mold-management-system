@echo off
chcp 65001 >nul

echo ========================================
echo Railway Backend Service Auto Setup
echo ========================================
echo.

echo 1. Checking Railway login...
railway whoami
if errorlevel 1 (
    echo.
    echo Please login to Railway
    railway login
)
echo.

echo 2. Current project status...
railway status
echo.

echo 3. Checking services...
echo Current service: Postgres
echo.

echo 4. Creating environment variables file...
echo.

(
echo # Railway Backend Environment Variables
echo # Copy and paste these commands after linking to backend service
echo.
echo railway variables set NODE_ENV=production
echo railway variables set PORT=3000
echo railway variables set JWT_SECRET=cams-mold-management-system-super-secret-key-2024-production-min-32-chars
echo railway variables set JWT_EXPIRES_IN=8h
echo railway variables set CORS_ORIGIN=*
echo railway variables set API_VERSION=v1
echo railway variables set LOG_LEVEL=info
echo.
echo # DATABASE_URL: Set in Railway Dashboard
echo # Variables tab - New Variable - Add Reference - Postgres - DATABASE_PUBLIC_URL
) > railway-env-setup.txt

echo Environment variables saved to: railway-env-setup.txt
echo.

echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Open Railway Dashboard: https://railway.app
echo 2. Select project: abundant-freedom
echo 3. Click "+ New" - "GitHub Repo"
echo 4. Select: cams-mold-management-system
echo 5. Set Root Directory: /server
echo 6. Link to backend service: railway link
echo 7. Set environment variables (see railway-env-setup.txt)
echo 8. Deploy: railway up
echo.

echo Opening Railway Dashboard...
start https://railway.app

echo.
echo ========================================
echo Setup script completed!
echo ========================================
pause
