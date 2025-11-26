@echo off
chcp 65001 >nul

echo ========================================
echo Railway 백엔드 서비스 설정
echo ========================================
echo.

echo 1. Railway 로그인 확인...
railway whoami
if errorlevel 1 (
    echo.
    echo Railway 로그인이 필요합니다.
    echo 브라우저가 열리면 로그인해주세요.
    railway login
)

echo.
echo 2. 프로젝트 연결...
echo 프로젝트: abundant-freedom
echo 환경: production
echo.

echo 3. 환경 변수 설정...
echo.
echo 다음 명령어를 수동으로 실행해주세요:
echo.
echo railway variables set NODE_ENV=production
echo railway variables set PORT=3000
echo railway variables set JWT_SECRET=cams-mold-management-system-super-secret-key-2024-production-min-32-chars
echo railway variables set JWT_EXPIRES_IN=8h
echo railway variables set CORS_ORIGIN=*
echo railway variables set API_VERSION=v1
echo railway variables set LOG_LEVEL=info
echo.
echo DATABASE_URL은 Railway 대시보드에서 Postgres 참조로 설정:
echo ${{Postgres.DATABASE_PUBLIC_URL}}
echo.

echo ========================================
echo 설정 완료 후 배포:
echo railway up
echo ========================================

pause
