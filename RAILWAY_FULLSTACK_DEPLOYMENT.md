# Railway 풀스택 배포 가이드

**작성일**: 2025-12-02
**대상**: DevOps, 배포 담당자

---

## 🎯 목표

Railway에서 **백엔드 + 프론트엔드**를 하나의 서비스로 배포합니다.

### 배포 구조
```
Railway Service
├── Backend (Express)
│   ├── API 서버 (Port 3001)
│   └── 정적 파일 서빙 (client/dist)
└── Frontend (React + Vite)
    └── 빌드 결과 → server/public/
```

---

## 📋 변경 사항 요약

### 1. server/package.json
```json
{
  "scripts": {
    "start": "node src/server.js",
    "build": "npm run build:client && npm run copy:client",
    "build:client": "cd ../client && npm install && npm run build",
    "copy:client": "rm -rf public && cp -r ../client/dist public",
    "postinstall": "npm run build || true"
  }
}
```

**설명**:
- `build`: 프론트엔드 빌드 + 복사
- `build:client`: client 폴더에서 npm install & build
- `copy:client`: dist → server/public 복사
- `postinstall`: Railway 배포 시 자동 실행

### 2. server/src/app.js
```javascript
// Serve static files from React build (production only)
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../public');
  app.use(express.static(publicPath));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}
```

**설명**:
- 프로덕션 환경에서만 정적 파일 서빙
- `/api/`, `/health` 제외한 모든 경로 → `index.html`
- SPA 라우팅 지원 (React Router)

### 3. railway.json
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd server && npm install && npm run build"
  },
  "deploy": {
    "startCommand": "cd server && npm start",
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**설명**:
- `buildCommand`: 백엔드 설치 + 프론트엔드 빌드
- `startCommand`: 백엔드 서버 시작

### 4. server/.gitignore
```
# Frontend build (will be generated during deployment)
public/
```

**설명**:
- `public/` 폴더는 배포 시 자동 생성
- Git에 커밋하지 않음

---

## 🚀 배포 프로세스

### Railway 배포 시 실행 순서

```
1. Git Push
   ↓
2. Railway 감지
   ↓
3. Build Command 실행
   cd server && npm install && npm run build
   ↓
4. npm install (server)
   ↓
5. postinstall 훅 실행
   npm run build
   ↓
6. build:client
   cd ../client && npm install && npm run build
   → client/dist/ 생성
   ↓
7. copy:client
   cp -r ../client/dist server/public
   → server/public/ 생성
   ↓
8. Start Command 실행
   cd server && npm start
   ↓
9. Express 서버 시작
   - API: /api/*
   - Static: /* (from public/)
   ↓
10. 배포 완료 ✅
```

---

## 🔧 환경 변수 설정

### Railway Dashboard → Variables

```bash
# Node 환경
NODE_ENV=production

# 데이터베이스
DATABASE_URL=postgresql://...
DB_HOST=...
DB_PORT=5432
DB_NAME=...
DB_USER=...
DB_PASSWORD=...

# JWT
JWT_SECRET=your-secret-key

# CORS (프로덕션에서는 불필요, 백엔드가 프론트 서빙)
CORS_ORIGIN=*

# 포트 (Railway 자동 설정)
PORT=${{PORT}}
```

---

## 📁 디렉토리 구조

### 배포 전
```
cams-mold-management-system/
├── client/
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── src/
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── .gitignore
└── railway.json
```

### 배포 후 (Railway)
```
server/
├── src/
│   ├── app.js (정적 파일 서빙 설정)
│   └── server.js
├── public/ ✨ (자동 생성)
│   ├── index.html
│   └── assets/
│       ├── main-[hash].js
│       └── index-[hash].css
├── package.json
└── node_modules/
```

---

## 🧪 테스트

### 로컬 테스트 (프로덕션 모드)

```bash
# 1. 프론트엔드 빌드
cd client
npm run build

# 2. 백엔드로 복사
cd ../server
rm -rf public
cp -r ../client/dist public

# 3. 프로덕션 모드로 서버 실행
NODE_ENV=production npm start

# 4. 브라우저 접속
# http://localhost:3001
```

**확인 사항**:
- [ ] 프론트엔드 페이지 로드
- [ ] API 요청 성공 (`/api/v1/...`)
- [ ] React Router 작동 (새로고침 시에도 정상)
- [ ] 정적 파일 로드 (JS, CSS, 이미지)

### Railway 배포 테스트

```bash
# 1. 변경사항 커밋
git add .
git commit -m "feat: Add fullstack deployment support"
git push origin main

# 2. Railway 대시보드 확인
# - Build Logs 확인
# - Deploy Logs 확인

# 3. 배포 URL 접속
# https://your-app.up.railway.app

# 4. 확인
- [ ] 프론트엔드 로드
- [ ] 로그인 기능
- [ ] API 통신
- [ ] 라우팅 작동
```

---

## 🐛 문제 해결

### 문제 1: Build 실패

**증상**:
```
Build failed
npm ERR! code ENOENT
```

**원인**:
- client 폴더가 없거나 package.json 없음

**해결**:
```bash
# 저장소 구조 확인
ls -la
# client/ 와 server/ 폴더 존재 확인

# client/package.json 확인
cat client/package.json
```

### 문제 2: MIME 타입 에러

**증상**:
```
Expected a JavaScript module script but the server responded with a MIME type of "text/plain"
```

**원인**:
- `public/` 폴더가 생성되지 않음
- 정적 파일 서빙 설정 누락

**해결**:
```javascript
// server/src/app.js 확인
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
}
```

### 문제 3: 404 에러 (React Router)

**증상**:
```
/dashboard/plant 접속 시 404
```

**원인**:
- SPA fallback 설정 누락

**해결**:
```javascript
// server/src/app.js
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(publicPath, 'index.html'));
});
```

### 문제 4: 빌드 시간 초과

**증상**:
```
Build timeout after 10 minutes
```

**원인**:
- 프론트엔드 빌드가 너무 오래 걸림

**해결**:
```json
// railway.json
{
  "build": {
    "buildCommand": "cd server && npm install && npm run build"
  }
}

// 또는 빌드 최적화
// client/vite.config.js
export default defineConfig({
  build: {
    sourcemap: false,
    minify: 'esbuild'
  }
})
```

### 문제 5: 환경 변수 누락

**증상**:
```
Database connection failed
```

**원인**:
- Railway 환경 변수 미설정

**해결**:
1. Railway Dashboard → Variables
2. 필요한 환경 변수 추가
3. Redeploy

---

## 📊 빌드 로그 예시

### 성공적인 빌드
```
#1 [build] cd server && npm install && npm run build
#2 [build] npm install
#3 [build] added 234 packages
#4 [build] npm run build
#5 [build] > build
#6 [build] > npm run build:client && npm run copy:client
#7 [build] > build:client
#8 [build] > cd ../client && npm install && npm run build
#9 [build] added 456 packages
#10 [build] > build
#11 [build] > vite build
#12 [build] vite v5.0.7 building for production...
#13 [build] ✓ 234 modules transformed.
#14 [build] dist/index.html                   0.45 kB
#15 [build] dist/assets/index-abc123.css     192.34 kB
#16 [build] dist/assets/main-xyz789.js       928.12 kB
#17 [build] ✓ built in 12.34s
#18 [build] > copy:client
#19 [build] > rm -rf public && cp -r ../client/dist public
#20 [build] Build complete ✅
```

---

## 🔍 검증 체크리스트

### 배포 전
- [ ] `server/package.json`에 빌드 스크립트 추가
- [ ] `server/src/app.js`에 정적 파일 서빙 설정
- [ ] `railway.json`에 빌드 명령 설정
- [ ] `server/.gitignore`에 `public/` 추가
- [ ] 로컬에서 프로덕션 모드 테스트

### 배포 후
- [ ] Railway 빌드 성공
- [ ] 배포 URL 접속 가능
- [ ] 프론트엔드 페이지 로드
- [ ] API 통신 정상
- [ ] React Router 작동
- [ ] 로그인 기능 정상
- [ ] 대시보드 데이터 로드

---

## 💡 최적화 팁

### 1. 빌드 캐싱
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd server && npm ci && npm run build"
  }
}
```

### 2. 번들 크기 최적화
```javascript
// client/vite.config.js
export default defineConfig({
  build: {
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

### 3. Gzip 압축
```javascript
// server/src/app.js
const compression = require('compression');
app.use(compression());
```

### 4. 정적 파일 캐싱
```javascript
// server/src/app.js
app.use(express.static(publicPath, {
  maxAge: '1y',
  immutable: true
}));
```

---

## 📚 관련 문서

- **FRONTEND_DEV_GUIDE.md**: 프론트엔드 개발 환경
- **RAILWAY_DEPLOYMENT_CHECKLIST.md**: Railway 배포 체크리스트
- **BACKEND_README.md**: 백엔드 API 문서

---

## 🚀 빠른 배포

```bash
# 1. 변경사항 커밋
git add .
git commit -m "feat: Add fullstack deployment support"
git push origin main

# 2. Railway 자동 배포 시작
# (Railway Dashboard에서 확인)

# 3. 배포 완료 후 접속
# https://your-app.up.railway.app
```

---

## ✅ 최종 확인

### 배포 성공 기준
1. ✅ Railway 빌드 성공
2. ✅ 서버 시작 성공
3. ✅ 프론트엔드 페이지 로드
4. ✅ API 통신 정상
5. ✅ 로그인 기능 작동
6. ✅ 대시보드 데이터 표시
7. ✅ React Router 작동
8. ✅ 새로고침 시에도 정상

---

**작성일**: 2025-12-02
**최종 업데이트**: 2025-12-02 17:27
**문의**: DevOps 팀
