# 🚀 Railway 백엔드 서비스 설정 가이드

## 📋 현재 상황

- ✅ Postgres 서비스: 존재
- ❌ Backend 서비스: 없음
- ❌ Frontend 서비스: 없음 (또는 별도 배포)

## 🎯 목표

Railway에 백엔드 Node.js 서버를 배포하여 API 엔드포인트를 활성화

---

## 📝 설정 단계

### 1. Railway 대시보드 접속

```
https://railway.app
```

### 2. 프로젝트 선택

- **프로젝트**: `abundant-freedom`
- **환경**: `production`

### 3. 새 서비스 추가

#### 방법 A: GitHub 저장소 연결 (권장)

1. **"+ New" 버튼 클릭**
2. **"GitHub Repo" 선택**
3. **저장소 선택**:
   - `radiohead0803-hash/cams-mold-management-system`
4. **Root Directory 설정**:
   - Root Directory: `/server` ✅ 중요!
5. **서비스 이름**: `backend` 또는 `cams-backend`

#### 방법 B: Empty Service (수동 배포)

1. **"+ New" 버튼 클릭**
2. **"Empty Service" 선택**
3. **GitHub 연결 후 설정**

---

## ⚙️ 환경 변수 설정

백엔드 서비스에 다음 환경 변수를 추가하세요:

### 필수 환경 변수

```bash
# Node 환경
NODE_ENV=production

# 포트 (Railway가 자동 설정하지만 명시 가능)
PORT=3000

# 데이터베이스 (Postgres 서비스에서 자동 연결)
DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}}

# JWT 설정
JWT_SECRET=cams-mold-management-system-super-secret-key-2024-production-min-32-chars
JWT_EXPIRES_IN=8h

# CORS 설정
CORS_ORIGIN=*

# API 버전
API_VERSION=v1

# 로그 레벨
LOG_LEVEL=info

# 파일 업로드 크기 제한 (10MB)
MAX_FILE_SIZE=10485760
```

### 환경 변수 설정 방법

1. **백엔드 서비스 선택**
2. **Variables 탭 클릭**
3. **"New Variable" 클릭**
4. **위의 환경 변수들을 하나씩 추가**

**중요**: `DATABASE_URL`은 Postgres 서비스의 `DATABASE_PUBLIC_URL`을 참조하도록 설정:
```
${{Postgres.DATABASE_PUBLIC_URL}}
```

---

## 🔧 빌드 설정

### package.json 확인

`server/package.json`에 다음 스크립트가 있는지 확인:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

### Railway 빌드 명령

Railway는 자동으로 감지하지만, 명시적으로 설정하려면:

1. **Settings 탭**
2. **Build Command**: (비워두기 - npm install 자동 실행)
3. **Start Command**: `npm start`
4. **Root Directory**: `/server` ✅

---

## 🌐 도메인 설정

### 1. Public Domain 생성

1. **백엔드 서비스 선택**
2. **Settings 탭**
3. **Networking 섹션**
4. **"Generate Domain" 클릭**

생성된 도메인 예시:
```
https://cams-backend-production-xxxx.up.railway.app
```

### 2. 프론트엔드 환경 변수 업데이트

프론트엔드 서비스 (또는 Vercel/Netlify)에 환경 변수 추가:

```bash
VITE_API_URL=https://cams-backend-production-xxxx.up.railway.app
```

---

## 🔗 서비스 간 연결

### Postgres → Backend 연결

Railway는 자동으로 연결하지만, 확인 방법:

1. **백엔드 서비스의 Variables 탭**
2. **"Add Reference" 클릭**
3. **Postgres 서비스 선택**
4. **`DATABASE_PUBLIC_URL` 선택**

---

## ✅ 배포 확인

### 1. 빌드 로그 확인

1. **백엔드 서비스 선택**
2. **Deployments 탭**
3. **최신 배포 클릭**
4. **Build Logs 확인**

예상 로그:
```
✅ Database connection established successfully.
🚀 CAMS API Server started
📍 Server running on: http://localhost:3000
```

### 2. Health Check

브라우저에서 접속:
```
https://your-backend-domain.up.railway.app/health
```

예상 응답:
```json
{
  "status": "ok",
  "timestamp": "2024-11-26T...",
  "database": "railway"
}
```

### 3. API 테스트

```
https://your-backend-domain.up.railway.app/api/v1/mold-specifications
```

---

## 🐛 문제 해결

### 문제 1: 빌드 실패

**원인**: Root Directory가 잘못 설정됨

**해결**:
1. Settings → Root Directory → `/server`
2. Redeploy

### 문제 2: 데이터베이스 연결 실패

**원인**: DATABASE_URL 환경 변수 누락

**해결**:
1. Variables 탭
2. `DATABASE_URL` 추가
3. 값: `${{Postgres.DATABASE_PUBLIC_URL}}`

### 문제 3: 404 에러

**원인**: 서버가 시작되지 않음

**해결**:
1. Deployment Logs 확인
2. 에러 메시지 확인
3. 환경 변수 확인

### 문제 4: CORS 에러

**원인**: 프론트엔드 도메인이 허용되지 않음

**해결**:
1. `CORS_ORIGIN=*` 환경 변수 추가
2. 또는 `server/src/app.js`의 CORS 설정 확인

---

## 📊 최종 구조

```
Railway Project: abundant-freedom
├── Postgres (Database)
│   └── DATABASE_PUBLIC_URL
├── Backend (Node.js)
│   ├── Root: /server
│   ├── Domain: https://cams-backend-production-xxxx.up.railway.app
│   └── Variables:
│       ├── NODE_ENV=production
│       ├── DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}}
│       ├── JWT_SECRET=...
│       └── CORS_ORIGIN=*
└── Frontend (Static/Vite) - 선택사항
    ├── Root: /client
    ├── Domain: https://cams-frontend-production-xxxx.up.railway.app
    └── Variables:
        └── VITE_API_URL=https://cams-backend-production-xxxx.up.railway.app
```

---

## 🚀 빠른 시작 체크리스트

- [ ] Railway 대시보드 접속
- [ ] 새 서비스 추가 (GitHub Repo)
- [ ] Root Directory: `/server` 설정
- [ ] 환경 변수 추가 (최소 5개)
- [ ] DATABASE_URL 참조 설정
- [ ] 도메인 생성
- [ ] 배포 확인 (Health Check)
- [ ] 프론트엔드 VITE_API_URL 업데이트
- [ ] API 테스트

---

## 📞 다음 단계

1. ✅ 백엔드 서비스 생성
2. ✅ 환경 변수 설정
3. ✅ 배포 확인
4. ✅ 프론트엔드 환경 변수 업데이트
5. ✅ 개발금형 현황 페이지 테스트

---

**예상 소요 시간**: 10-15분

**완료 후**: 개발금형 현황 페이지에서 실제 데이터를 볼 수 있습니다!
