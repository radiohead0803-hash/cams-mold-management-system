# Railway 배포 가이드

## 🚀 배포 개요

이 프로젝트는 두 개의 서비스로 구성됩니다:
1. **Backend (서버)** - Node.js + Express + PostgreSQL
2. **Frontend (클라이언트)** - React + Vite

## 📋 배포 전 체크리스트

### 1. 필수 파일 확인
- [x] `server/src/config/database.js` - 데이터베이스 설정
- [x] `server/package.json` - 서버 의존성
- [x] `client/package.json` - 클라이언트 의존성
- [x] `railway.json` / `railway.toml` - Railway 설정

### 2. Git 커밋 확인
```bash
git status
git add .
git commit -m "feat: Railway 배포 설정 완료"
git push origin main
```

## 🔧 Railway 프로젝트 설정

### Step 1: Railway 프로젝트 생성

1. [Railway.app](https://railway.app) 접속 및 로그인
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. 저장소 선택: `cams-mold-management-system`

### Step 2: PostgreSQL 데이터베이스 추가

1. 프로젝트 대시보드에서 "+ New" 클릭
2. "Database" → "Add PostgreSQL" 선택
3. 자동으로 `DATABASE_URL` 환경 변수가 생성됨

### Step 3: Backend 서비스 설정

#### 환경 변수 설정 (Variables 탭)

```env
# 데이터베이스 (자동 생성됨)
DATABASE_URL=postgresql://...

# Node 환경
NODE_ENV=production
PORT=3001

# JWT 설정 (보안을 위해 강력한 랜덤 문자열 사용)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d

# CORS 설정 (프론트엔드 URL로 변경)
CORS_ORIGIN=https://your-frontend-url.railway.app

# 파일 업로드
MAX_FILE_SIZE=10485760

# GPS
GPS_ACCURACY_THRESHOLD=50
```

#### Root Directory 설정
- Settings → "Root Directory" → `server` 입력

#### Build & Deploy 설정
- Build Command: `npm install`
- Start Command: `npm start`

### Step 4: Frontend 서비스 설정

#### 환경 변수 설정 (Variables 탭)

```env
# API URL (백엔드 URL로 변경)
VITE_API_URL=https://your-backend-url.railway.app

# 앱 정보
VITE_APP_NAME=Creative Auto Module System
VITE_APP_VERSION=1.0.0

# 지도 설정 (선택사항)
VITE_MAP_CENTER_LAT=37.5665
VITE_MAP_CENTER_LNG=126.9780
VITE_MAP_ZOOM=13
```

#### Root Directory 설정
- Settings → "Root Directory" → `client` 입력

#### Build & Deploy 설정
- Build Command: `npm install --legacy-peer-deps && npm run build`
- Start Command: `npx serve dist -s -l $PORT`

## 🔄 배포 순서

### 1. Backend 먼저 배포
```
1. PostgreSQL 데이터베이스 생성 완료 대기
2. Backend 서비스 환경 변수 설정
3. Backend 배포 및 Health Check 확인
   → https://your-backend.railway.app/health
```

### 2. Frontend 배포
```
1. Backend URL 확인
2. Frontend 환경 변수에 VITE_API_URL 설정
3. Frontend 배포
```

## ✅ 배포 확인

### Backend Health Check
```bash
curl https://your-backend.railway.app/health
```

**예상 응답:**
```json
{
  "status": "OK",
  "timestamp": "2024-11-18T07:00:00.000Z",
  "uptime": 123.45,
  "database": "connected",
  "environment": "production"
}
```

### Frontend 접속
브라우저에서 `https://your-frontend.railway.app` 접속
→ 로그인 화면이 정상적으로 표시되어야 함

## 🗄️ 데이터베이스 초기화

### 시드 데이터 삽입 (선택사항)

Railway CLI 사용:
```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 시드 데이터 실행
railway run npm run db:seed
```

또는 Railway 대시보드에서:
1. Backend 서비스 선택
2. "Deployments" 탭
3. "Run Command" 클릭
4. `npm run db:seed` 입력 및 실행

## 🐛 문제 해결

### 1. 로그인 화면이 안 뜨는 경우

**원인**: Frontend가 Backend API에 연결하지 못함

**해결방법**:
1. Frontend 환경 변수 확인
   - `VITE_API_URL`이 올바른 Backend URL인지 확인
2. Backend CORS 설정 확인
   - `CORS_ORIGIN`이 Frontend URL과 일치하는지 확인
3. 재배포
   - 환경 변수 변경 후 반드시 재배포 필요

### 2. Database connection failed

**원인**: DATABASE_URL이 설정되지 않았거나 잘못됨

**해결방법**:
1. PostgreSQL 서비스가 실행 중인지 확인
2. Backend 환경 변수에서 `DATABASE_URL` 확인
3. Railway 대시보드에서 PostgreSQL 연결 정보 확인

### 3. 500 Internal Server Error

**원인**: 서버 코드 오류 또는 환경 변수 누락

**해결방법**:
1. Railway 로그 확인
   ```bash
   railway logs
   ```
2. 필수 환경 변수 확인
   - `JWT_SECRET`
   - `DATABASE_URL`
   - `NODE_ENV`

### 4. CORS 에러

**원인**: Backend CORS 설정이 Frontend URL과 일치하지 않음

**해결방법**:
1. Backend 환경 변수 확인
   ```env
   CORS_ORIGIN=https://your-frontend-url.railway.app
   ```
2. 와일드카드 사용 (개발 중에만)
   ```env
   CORS_ORIGIN=*
   ```
   ⚠️ 프로덕션에서는 정확한 도메인 지정 필수!

## 📊 모니터링

### Railway 대시보드에서 확인 가능한 메트릭:
- CPU 사용률
- 메모리 사용량
- 네트워크 트래픽
- 응답 시간
- 에러 로그

### 로그 확인
```bash
# 실시간 로그
railway logs --follow

# 최근 100줄
railway logs --tail 100

# 특정 서비스
railway logs --service backend
```

## 🔐 보안 체크리스트

- [ ] `JWT_SECRET`을 강력한 랜덤 문자열로 변경
- [ ] `CORS_ORIGIN`을 정확한 도메인으로 설정
- [ ] 환경 변수에 민감한 정보 저장 (코드에 하드코딩 금지)
- [ ] HTTPS 사용 (Railway 자동 제공)
- [ ] Rate Limiting 활성화
- [ ] Helmet 보안 헤더 적용

## 📝 테스트 계정

배포 후 다음 계정으로 로그인 테스트:

| 역할 | Username | Password |
|------|----------|----------|
| 관리자 | admin | password123 |
| 본사담당자 | hq_manager | password123 |
| 협력사관리자 | partner_admin | password123 |
| 작업자 | worker1 | password123 |

⚠️ **프로덕션 환경에서는 반드시 비밀번호를 변경하세요!**

## 🚀 배포 완료 후

1. [ ] Health Check 확인
2. [ ] 로그인 테스트
3. [ ] 주요 기능 테스트
   - 금형 등록
   - QR 스캔
   - 점검 등록
4. [ ] 모니터링 설정
5. [ ] 백업 설정
6. [ ] 도메인 연결 (선택사항)

## 📞 지원

문제가 발생하면:
1. Railway 로그 확인
2. 환경 변수 재확인
3. GitHub Issues에 문의

---

**배포 완료!** 🎉

이제 `https://your-frontend.railway.app`에서 시스템을 사용할 수 있습니다.
