# Railway 백엔드 서비스 자동 설정 스크립트

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Railway 백엔드 서비스 자동 설정" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 로그인 확인
Write-Host "1. Railway 로그인 확인..." -ForegroundColor Yellow
$whoami = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Railway 로그인이 필요합니다." -ForegroundColor Red
    railway login
}
Write-Host "✅ 로그인 완료: $whoami" -ForegroundColor Green
Write-Host ""

# 2. 프로젝트 정보 확인
Write-Host "2. 현재 프로젝트 확인..." -ForegroundColor Yellow
railway status
Write-Host ""

# 3. 서비스 목록 확인
Write-Host "3. 서비스 목록 확인..." -ForegroundColor Yellow
Write-Host "현재 연결된 서비스: Postgres" -ForegroundColor Cyan
Write-Host ""

# 4. 백엔드 서비스 생성 안내
Write-Host "4. 백엔드 서비스 생성..." -ForegroundColor Yellow
Write-Host "Railway CLI로는 새 서비스를 직접 생성할 수 없습니다." -ForegroundColor Red
Write-Host "대신 다음 방법을 사용하세요:" -ForegroundColor Yellow
Write-Host ""
Write-Host "방법 1: Railway 대시보드 (권장)" -ForegroundColor Cyan
Write-Host "  1. https://railway.app 접속" -ForegroundColor White
Write-Host "  2. abundant-freedom 프로젝트 선택" -ForegroundColor White
Write-Host "  3. '+ New' → 'GitHub Repo' 선택" -ForegroundColor White
Write-Host "  4. 저장소 선택: cams-mold-management-system" -ForegroundColor White
Write-Host "  5. Root Directory: /server 설정" -ForegroundColor White
Write-Host ""

Write-Host "방법 2: Railway CLI로 배포 (서비스가 이미 있는 경우)" -ForegroundColor Cyan
Write-Host "  railway up" -ForegroundColor White
Write-Host ""

# 5. 환경 변수 설정 준비
Write-Host "5. 환경 변수 설정 명령어 생성..." -ForegroundColor Yellow
Write-Host ""

$envVars = @"
# 백엔드 서비스에 연결 후 실행할 명령어들:

railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set JWT_SECRET=cams-mold-management-system-super-secret-key-2024-production-min-32-chars
railway variables set JWT_EXPIRES_IN=8h
railway variables set CORS_ORIGIN=*
railway variables set API_VERSION=v1
railway variables set LOG_LEVEL=info

# DATABASE_URL은 Railway 대시보드에서 설정:
# Variables 탭 → New Variable → Add Reference → Postgres → DATABASE_PUBLIC_URL
"@

Write-Host $envVars -ForegroundColor White
Write-Host ""

# 6. 환경 변수 파일 생성
$envFile = "railway-env-vars.txt"
$envVars | Out-File -FilePath $envFile -Encoding UTF8
Write-Host "✅ 환경 변수 명령어를 '$envFile' 파일에 저장했습니다." -ForegroundColor Green
Write-Host ""

# 7. 다음 단계 안내
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "다음 단계" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Railway 대시보드에서 백엔드 서비스 생성" -ForegroundColor Yellow
Write-Host "   https://railway.app" -ForegroundColor White
Write-Host ""
Write-Host "2. 백엔드 서비스에 연결" -ForegroundColor Yellow
Write-Host "   railway link" -ForegroundColor White
Write-Host "   → Service: backend 선택" -ForegroundColor White
Write-Host ""
Write-Host "3. 환경 변수 설정" -ForegroundColor Yellow
Write-Host "   위의 명령어들을 하나씩 실행하거나" -ForegroundColor White
Write-Host "   'railway-env-vars.txt' 파일 참고" -ForegroundColor White
Write-Host ""
Write-Host "4. 배포" -ForegroundColor Yellow
Write-Host "   railway up" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# 브라우저에서 Railway 대시보드 열기
Write-Host ""
$openBrowser = Read-Host "Railway 대시보드를 브라우저에서 열까요? (Y/N)"
if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
    Start-Process "https://railway.app"
    Write-Host "✅ 브라우저에서 Railway 대시보드를 열었습니다." -ForegroundColor Green
}
