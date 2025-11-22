# Railway 배포 가이드

## 🚂 Railway 프로젝트 설정

### 1. Railway 계정 생성 및 로그인

1. https://railway.app 접속
2. GitHub 계정으로 로그인
3. 새 프로젝트 생성

### 2. GitHub 저장소 연결

1. Railway 대시보드에서 "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. `radiohead0803-hash/cams-mold-management-system` 저장소 선택
4. `main` 브랜치 선택

### 3. PostgreSQL 데이터베이스 추가

1. 프로젝트 대시보드에서 "New" 클릭
2. "Database" → "Add PostgreSQL" 선택
3. 데이터베이스가 자동으로 프로비저닝됩니다

### 4. 환경 변수 설정

Railway 대시보드에서 서비스 선택 → "Variables" 탭

#### 필수 환경 변수

```env
# Database (자동 생성됨)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d

# Server
NODE_ENV=production
PORT=3001

# CORS (프론트엔드 URL로 변경)
CORS_ORIGIN=https://your-frontend-url.railway.app

# File Upload
MAX_FILE_SIZE=10485760

# GPS
GPS_ACCURACY_THRESHOLD=50
```

### 5. 빌드 설정

Railway는 자동으로 `package.json`의 스크립트를 감지합니다.

#### server/package.json 확인

```json
{
  "scripts": {
    "start": "node src/index.js",
    "build": "echo 'No build step required'"
  }
}
```

### 6. 배포

1. 환경 변수 설정 완료 후 자동으로 배포됩니다
2. 배포 로그 확인: "Deployments" 탭
3. 배포 완료 후 URL 확인: "Settings" → "Domains"

### 7. 데이터베이스 마이그레이션

배포 후 Railway CLI 또는 직접 연결하여 테이블 생성:

```bash
# Railway CLI 설치
npm install -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 연결
railway link

# 데이터베이스 마이그레이션 실행
railway run npm run migrate
```

또는 서버 시작 시 자동 동기화 (개발 환경에서만 권장):

```javascript
// src/index.js에 추가
const { syncDatabase } = require('./models');

// 서버 시작 전
await syncDatabase({ alter: true });
```

### 8. 배포 확인

#### Health Check

```bash
curl https://your-app-url.railway.app/health
```

#### API 확인

```bash
curl https://your-app-url.railway.app/api
```

### 9. 도메인 설정 (선택사항)

1. Railway 대시보드 → "Settings" → "Domains"
2. "Generate Domain" 클릭하여 Railway 도메인 생성
3. 또는 "Custom Domain" 추가

---

## 🔧 트러블슈팅

### 배포 실패 시

1. **빌드 로그 확인**
   - Railway 대시보드 → "Deployments" → 실패한 배포 클릭

2. **환경 변수 확인**
   - 모든 필수 환경 변수가 설정되었는지 확인

3. **데이터베이스 연결 확인**
   - `DATABASE_URL`이 올바르게 설정되었는지 확인

### 데이터베이스 연결 오류

```
❌ Unable to connect to the database
```

**해결 방법:**
1. PostgreSQL 서비스가 실행 중인지 확인
2. `DATABASE_URL` 환경 변수 확인
3. Railway 대시보드에서 PostgreSQL 서비스 재시작

### 포트 오류

Railway는 자동으로 `PORT` 환경 변수를 설정합니다.

```javascript
const PORT = process.env.PORT || 3001;
```

---

## 📊 모니터링

### 로그 확인

Railway 대시보드 → "Deployments" → "View Logs"

### 메트릭 확인

Railway 대시보드 → "Metrics"
- CPU 사용량
- 메모리 사용량
- 네트워크 트래픽

---

## 🔄 자동 배포

GitHub에 푸시하면 자동으로 배포됩니다:

```bash
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main
```

Railway가 자동으로:
1. 코드 변경 감지
2. 빌드 실행
3. 배포 수행
4. Health check 확인

---

## 📱 현재 배포 상태

✅ **GitHub 저장소**: https://github.com/radiohead0803-hash/cams-mold-management-system

✅ **커밋 완료**:
- docs: 프로젝트 초기 설정 및 문서 작성 완료
- chore: Railway 배포 설정 추가
- feat: 백엔드 서버 초기 구조 구현
- feat: 데이터베이스 모델 생성 (8개 핵심 모델)

⏳ **다음 단계**: Railway 웹 인터페이스에서 프로젝트 생성 및 배포

---

**작성일**: 2024-01-18
**버전**: Ver.09
