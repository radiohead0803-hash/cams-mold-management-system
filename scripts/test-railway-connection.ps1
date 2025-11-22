# Railway 연결 테스트 스크립트

Write-Host "=== Railway 연결 테스트 ===" -ForegroundColor Cyan
Write-Host ""

# 백엔드 URL 입력
Write-Host "Enter your Backend URL:" -ForegroundColor Yellow
Write-Host "Example: https://cams-mold-management-system-production-cb6e.up.railway.app" -ForegroundColor Gray
$backendUrl = Read-Host "Backend URL"

if ([string]::IsNullOrWhiteSpace($backendUrl)) {
    Write-Host "Error: Backend URL is required!" -ForegroundColor Red
    exit 1
}

# URL 정리 (끝의 / 제거)
$backendUrl = $backendUrl.TrimEnd('/')

Write-Host "`n=== 1. 백엔드 헬스체크 ===" -ForegroundColor Cyan
Write-Host "Testing: $backendUrl/health" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/health" -Method Get -TimeoutSec 10
    Write-Host "✅ 백엔드 정상 작동!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ 백엔드 연결 실패!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== 2. 데이터베이스 연결 확인 ===" -ForegroundColor Cyan
Write-Host "Testing: $backendUrl/api/health" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/health" -Method Get -TimeoutSec 10
    Write-Host "✅ 데이터베이스 연결 성공!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "⚠️  API 헬스체크 실패 (정상일 수 있음)" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n=== 3. CORS 테스트 ===" -ForegroundColor Cyan
Write-Host "Testing CORS headers..." -ForegroundColor Gray

try {
    $headers = @{
        "Origin" = "https://example.com"
    }
    $response = Invoke-WebRequest -Uri "$backendUrl/health" -Method Options -Headers $headers -TimeoutSec 10
    
    if ($response.Headers["Access-Control-Allow-Origin"]) {
        Write-Host "✅ CORS 설정 정상!" -ForegroundColor Green
        Write-Host "Access-Control-Allow-Origin: $($response.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  CORS 헤더 없음" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  CORS 테스트 실패 (정상일 수 있음)" -ForegroundColor Yellow
}

Write-Host "`n=== 4. 프론트엔드 URL 입력 (선택사항) ===" -ForegroundColor Cyan
Write-Host "프론트엔드가 배포되었다면 URL을 입력하세요 (Enter to skip):" -ForegroundColor Yellow
$frontendUrl = Read-Host "Frontend URL"

if (-not [string]::IsNullOrWhiteSpace($frontendUrl)) {
    $frontendUrl = $frontendUrl.TrimEnd('/')
    
    Write-Host "`nTesting: $frontendUrl" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $frontendUrl -Method Get -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ 프론트엔드 정상 작동!" -ForegroundColor Green
            Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ 프론트엔드 연결 실패!" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== 테스트 완료 ===" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Cyan
Write-Host "1. 브라우저에서 프론트엔드 URL 접속" -ForegroundColor White
Write-Host "2. 개발자 도구(F12) → Network 탭 확인" -ForegroundColor White
Write-Host "3. 로그인 시도하여 API 호출 확인" -ForegroundColor White
Write-Host ""
