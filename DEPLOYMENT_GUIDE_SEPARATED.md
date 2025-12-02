# 프론트엔드/백엔드 분리 배포 가이드

**작성일**: 2025-12-02
**배포 구조**: Frontend (Vercel) + Backend (Railway)

---

## 🎯 배포 구조

```
┌─────────────────────────────────────────────┐
│           사용자 브라우저                      │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│   Vercel     │        │   Railway    │
│  (Frontend)  │───────▶│  (Backend)   │
│              │  API   │              │
│  React+Vite  │ Calls  │   Express    │
│              │        │   + DB       │
└──────────────┘        └──────────────┘
```

### 장점
- ✅ **안정성**: 각 서비스가 독립적으로 작동
- ✅ **확장성**: 프론트/백엔드 독립 배포
- ✅ **성능**: Vercel CDN + Railway 최적화
- ✅ **유지보수**: 명확한 책임 분리
- ✅ **비용**: 무료 티어 활용 가능

---

## 📋 변경 사항 요약

### 1. server/package.json
**제거된 스크립트**:
```json
// ❌ 제거됨
"build": "npm run build:client && npm run copy:client",
"build:client": "cd ../client && npm install && npm run build",
"copy:client": "rm -rf public && cp -r ../client/dist public",
"postinstall": "npm run build || true"
```

**이유**: Railway는 `../client` 경로에 접근할 수 없음

### 2. server/src/app.js
**제거된 코드**:
```javascript
// ❌ 제거됨
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(publicPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}
```

**이유**: 정적 파일은 Vercel에서 서빙

### 3. railway.json
**변경 전**:
```json
{
  "build": {
    "buildCommand": "cd server && npm install && npm run build"
  }
}
```

**변경 후**:
```json
{
  "build": {
    "builder": "NIXPACKS"
  }
}
```

**이유**: 백엔드만 빌드

### 4. client/vercel.json (신규)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**기능**: SPA 라우팅 지원

---

## 🚀 배포 프로세스

### Step 1: Railway 백엔드 배포

#### 1-1. Railway 프로젝트 설정
```bash
# Railway CLI 설치 (선택사항)
npm install -g @railway/cli

# 로그인
railway login
```

#### 1-2. 환경 변수 설정
Railway Dashboard → Variables:

```bash
# Node 환경
NODE_ENV=production

# 데이터베이스
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=cams_db
DB_USER=postgres
DB_PASSWORD=your-password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# CORS (Vercel 프론트엔드 URL)
CORS_ORIGIN=https://your-frontend.vercel.app

# 포트
PORT=${{PORT}}
```

#### 1-3. 배포
```bash
# Git push로 자동 배포
git add .
git commit -m "fix: Remove frontend build from backend"
git push origin main

# Railway가 자동으로 감지하고 배포
```

#### 1-4. 배포 URL 확인
```
https://your-backend.up.railway.app
```

**테스트**:
```bash
curl https://your-backend.up.railway.app/health
# 응답: { "status": "ok" }
```

---

### Step 2: Vercel 프론트엔드 배포

#### 2-1. Vercel 프로젝트 생성
1. https://vercel.com 접속
2. GitHub 연동
3. `cams-mold-management-system` 저장소 선택
4. **Root Directory**: `client` 설정 ⚠️ 중요!
5. Framework Preset: `Vite` 선택

#### 2-2. 환경 변수 설정
Vercel Dashboard → Settings → Environment Variables:

```bash
# Backend API URL (Railway URL)
VITE_API_URL=https://your-backend.up.railway.app

# App 정보
VITE_APP_NAME=CAMS
VITE_APP_VERSION=1.0.0

# Naver Map API
VITE_NAVER_MAP_CLIENT_ID=your-naver-map-client-id

# Frontend URL (Vercel URL)
VITE_FRONTEND_URL=https://your-frontend.vercel.app

# API Base URL
VITE_API_BASE_URL=https://your-backend.up.railway.app
```

#### 2-3. 빌드 설정
Vercel Dashboard → Settings → General:

```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### 2-4. 배포
```bash
# Git push로 자동 배포
git push origin main

# Vercel이 자동으로 감지하고 배포
```

#### 2-5. 배포 URL 확인
```
https://your-frontend.vercel.app
```

---

### Step 3: CORS 설정 업데이트

#### 3-1. Railway 환경 변수 업데이트
Railway Dashboard → Variables:

```bash
# Vercel URL로 업데이트
CORS_ORIGIN=https://your-frontend.vercel.app
```

#### 3-2. 재배포
Railway가 자동으로 재배포됩니다.

---

## 🔧 로컬 개발 환경

### 백엔드 (server/)
```bash
cd server
npm install
npm run dev

# http://localhost:3001
```

### 프론트엔드 (client/)
```bash
cd client
npm install
npm run dev

# http://localhost:5173
```

### 환경 변수
**server/.env**:
```bash
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cams_db
DB_USER=postgres
DB_PASSWORD=your-password
JWT_SECRET=dev-secret-key
CORS_ORIGIN=http://localhost:5173
PORT=3001
```

**client/.env**:
```bash
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=CAMS
VITE_APP_VERSION=1.0.0
```

---

## 🧪 테스트

### 백엔드 테스트
```bash
# Health check
curl https://your-backend.up.railway.app/health

# API 테스트
curl https://your-backend.up.railway.app/api/v1/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"maker1","password":"password123"}'
```

### 프론트엔드 테스트
1. https://your-frontend.vercel.app 접속
2. 로그인 페이지 확인
3. 로그인 시도
4. 대시보드 접속
5. API 통신 확인

### CORS 테스트
브라우저 Console:
```javascript
fetch('https://your-backend.up.railway.app/health')
  .then(r => r.json())
  .then(console.log)
// CORS 에러 없이 응답 확인
```

---

## 🐛 문제 해결

### 문제 1: CORS 에러
**증상**:
```
Access to XMLHttpRequest blocked by CORS policy
```

**해결**:
1. Railway Variables 확인:
   ```bash
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```
2. Vercel URL이 정확한지 확인
3. Railway 재배포

### 문제 2: API 연결 실패
**증상**:
```
ERR_CONNECTION_REFUSED
net::ERR_NAME_NOT_RESOLVED
```

**해결**:
1. Vercel Environment Variables 확인:
   ```bash
   VITE_API_URL=https://your-backend.up.railway.app
   ```
2. Railway URL이 정확한지 확인
3. Vercel 재배포

### 문제 3: 로그인 실패
**증상**:
```
401 Unauthorized
Invalid credentials
```

**해결**:
1. Railway 데이터베이스 연결 확인
2. 사용자 데이터 확인:
   ```sql
   SELECT * FROM users WHERE username = 'maker1';
   ```
3. JWT_SECRET 설정 확인

### 문제 4: 404 에러 (React Router)
**증상**:
```
/dashboard/plant → 404
```

**해결**:
1. `client/vercel.json` 확인:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
2. Vercel 재배포

### 문제 5: 환경 변수 누락
**증상**:
```
undefined is not a function
Cannot read property 'VITE_API_URL' of undefined
```

**해결**:
1. Vercel Dashboard → Settings → Environment Variables
2. 모든 `VITE_*` 변수 확인
3. Redeploy

---

## 📊 배포 체크리스트

### Railway (Backend)
- [ ] 프로젝트 생성
- [ ] GitHub 연동
- [ ] Root Directory: `server` 설정
- [ ] 환경 변수 설정
  - [ ] `NODE_ENV=production`
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `CORS_ORIGIN` (Vercel URL)
- [ ] 배포 성공
- [ ] Health check 통과
- [ ] API 테스트 성공

### Vercel (Frontend)
- [ ] 프로젝트 생성
- [ ] GitHub 연동
- [ ] Root Directory: `client` 설정 ⚠️
- [ ] Framework: `Vite` 선택
- [ ] 환경 변수 설정
  - [ ] `VITE_API_URL` (Railway URL)
  - [ ] `VITE_APP_NAME`
  - [ ] `VITE_APP_VERSION`
  - [ ] `VITE_NAVER_MAP_CLIENT_ID`
- [ ] 배포 성공
- [ ] 페이지 로드 확인
- [ ] 로그인 테스트 성공
- [ ] API 통신 확인

### 통합 테스트
- [ ] CORS 에러 없음
- [ ] 로그인 성공
- [ ] 대시보드 데이터 로드
- [ ] React Router 작동
- [ ] API 모든 엔드포인트 테스트

---

## 💡 최적화 팁

### 1. Vercel 빌드 최적화
```javascript
// client/vite.config.js
export default defineConfig({
  build: {
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
        },
      },
    },
  },
})
```

### 2. Railway 환경 최적화
```bash
# Railway Variables
NODE_OPTIONS=--max-old-space-size=512
```

### 3. API 캐싱
```javascript
// server/src/app.js
app.use('/api/v1/molds', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300');
  next();
});
```

### 4. Vercel 헤더 설정
```json
// client/vercel.json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 🔐 보안 체크리스트

### Railway
- [ ] 환경 변수에 민감 정보 저장
- [ ] JWT_SECRET 강력한 키 사용
- [ ] DATABASE_URL 외부 노출 방지
- [ ] CORS_ORIGIN 정확한 URL만 허용

### Vercel
- [ ] API URL만 환경 변수로 관리
- [ ] 민감 정보 프론트엔드에 노출 금지
- [ ] HTTPS 강제 사용

---

## 📚 관련 문서

- **FRONTEND_DEV_GUIDE.md**: 프론트엔드 개발 환경
- **BACKEND_README.md**: 백엔드 API 문서
- **RAILWAY_DEPLOYMENT_CHECKLIST.md**: Railway 상세 가이드

---

## 🚀 빠른 배포 (요약)

### Railway (Backend)
```bash
# 1. 코드 수정 (완료)
git add .
git commit -m "fix: Separate frontend and backend deployment"
git push origin main

# 2. Railway Dashboard
# - Root Directory: server
# - Environment Variables 설정
# - 자동 배포 확인
```

### Vercel (Frontend)
```bash
# 1. Vercel 프로젝트 생성
# - Root Directory: client ⚠️
# - Framework: Vite

# 2. Environment Variables 설정
# - VITE_API_URL=https://your-backend.up.railway.app

# 3. 배포
# - Git push로 자동 배포
```

---

## ✅ 최종 확인

### 배포 성공 기준
1. ✅ Railway 백엔드 실행 중
2. ✅ Vercel 프론트엔드 실행 중
3. ✅ CORS 에러 없음
4. ✅ 로그인 성공
5. ✅ API 통신 정상
6. ✅ 대시보드 데이터 로드
7. ✅ React Router 작동
8. ✅ 모든 기능 정상 작동

---

**작성일**: 2025-12-02
**최종 업데이트**: 2025-12-02 17:41
**배포 구조**: Frontend (Vercel) + Backend (Railway)
**상태**: ✅ 준비 완료
