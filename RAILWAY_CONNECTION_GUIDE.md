# Railway 전체 시스템 연결 가이드

## 🎯 시스템 구조

```
Railway Project: abundant-freedom
├── 🗄️ Postgres (Database)
│   └── postgresql://...railway.app:34950/railway
│
├── 🖥️ Backend (Server)
│   ├── Root Directory: server
│   ├── DATABASE_URL: ${{Postgres.DATABASE_PUBLIC_URL}}
│   └── URL: https://cams-mold-management-system-production-cb6e.up.railway.app
│
└── 🌐 Frontend (Client)
    ├── Root Directory: client
    ├── VITE_API_URL: https://cams-mold-management-system-production-cb6e.up.railway.app
    └── URL: (배포 후 생성)
```

---

## 1️⃣ 데이터베이스 (Postgres) - ✅ 완료

### 상태
- ✅ PostgreSQL 생성 완료
- ✅ 12개 테이블 마이그레이션 완료
- ✅ 환경 변수 설정 완료

### 연결 정보
```env
DATABASE_PUBLIC_URL=postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway
```

---

## 2️⃣ 백엔드 (Server) - 설정 필요

### Railway 웹 대시보드에서:

#### A. 서비스 생성
1. Railway 대시보드 → abundant-freedom 프로젝트
2. **"+ New"** → **"GitHub Repo"**
3. Repository: `radiohead0803-hash/cams-mold-management-system`
4. Branch: `main`

#### B. Root Directory 설정
1. **Settings** → **Source**
2. **Root Directory**: `server` 입력
3. **Save**

#### C. 환경 변수 설정 (Variables 탭)

**중요**: `${{Postgres.DATABASE_PUBLIC_URL}}` 문법으로 Postgres 서비스 참조

```env
DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}}
NODE_ENV=production
API_VERSION=v1
JWT_SECRET=cams-mold-management-system-super-secret-key-2024-production-min-32-chars
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=*
MAX_FILE_SIZE=10485760
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### D. 배포 확인
1. **Deployments** 탭에서 빌드 로그 확인
2. 헬스체크 성공 확인: `/health`
3. **Settings** → **Networking** → **Generate Domain**
4. Public URL 복사: `https://your-backend.up.railway.app`

---

## 3️⃣ 프론트엔드 (Client) - 설정 필요

### Railway 웹 대시보드에서:

#### A. 서비스 생성
1. Railway 대시보드 → abundant-freedom 프로젝트
2. **"+ New"** → **"GitHub Repo"**
3. Repository: `radiohead0803-hash/cams-mold-management-system`
4. Branch: `main`

#### B. Root Directory 설정
1. **Settings** → **Source**
2. **Root Directory**: `client` 입력
3. **Save**

#### C. 환경 변수 설정 (Variables 탭)

**백엔드 URL을 정확히 입력하세요!**

```env
VITE_API_URL=https://cams-mold-management-system-production-cb6e.up.railway.app
VITE_APP_NAME=CAMS
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

#### D. 배포 확인
1. **Deployments** 탭에서 빌드 로그 확인
2. 빌드 성공 확인
3. **Settings** → **Networking** → **Generate Domain**
4. Public URL 복사: `https://your-frontend.up.railway.app`

---

## 🔗 서비스 간 연결 확인

### 1. 데이터베이스 → 백엔드 연결

백엔드 Variables에서:
```env
DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}}
```

이 문법은 자동으로 Postgres 서비스의 DATABASE_PUBLIC_URL을 참조합니다.

### 2. 백엔드 → 프론트엔드 연결

프론트엔드 Variables에서:
```env
VITE_API_URL=https://[백엔드-URL].up.railway.app
```

백엔드의 Public Domain을 정확히 입력하세요.

---

## 📋 배포 체크리스트

### ✅ 완료된 작업
- [x] PostgreSQL 데이터베이스 생성
- [x] 12개 테이블 마이그레이션
- [x] 백엔드 코드 GitHub 푸시
- [x] 프론트엔드 코드 GitHub 푸시
- [x] Railway 설정 파일 생성
- [x] 환경 변수 파일 생성

### ⏳ Railway 웹에서 수동 작업 필요

#### 백엔드 서비스
- [ ] "+ New" → "GitHub Repo" 클릭
- [ ] Root Directory: `server` 설정
- [ ] 환경 변수 추가 (DATABASE_URL 등)
- [ ] 배포 완료 대기
- [ ] Public Domain 생성 및 복사

#### 프론트엔드 서비스
- [ ] "+ New" → "GitHub Repo" 클릭
- [ ] Root Directory: `client` 설정
- [ ] 환경 변수 추가 (VITE_API_URL 등)
- [ ] 배포 완료 대기
- [ ] Public Domain 생성

---

## 🧪 연결 테스트

### 1. 백엔드 헬스체크
```bash
curl https://[백엔드-URL].up.railway.app/health
```

예상 응답:
```json
{
  "status": "ok",
  "timestamp": "2025-11-22T04:00:00.000Z"
}
```

### 2. 데이터베이스 연결 확인
```bash
curl https://[백엔드-URL].up.railway.app/api/health
```

### 3. 프론트엔드 접속
```
https://[프론트엔드-URL].up.railway.app
```

로그인 페이지가 표시되어야 합니다.

---

## 🔧 문제 해결

### 백엔드가 데이터베이스에 연결되지 않는 경우

1. **Variables 확인**
   ```env
   DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}}
   ```
   
2. **Logs 확인**
   - Deployments → Logs
   - "Database connection established" 메시지 확인

### 프론트엔드가 백엔드에 연결되지 않는 경우

1. **VITE_API_URL 확인**
   - 백엔드 Public Domain과 일치하는지 확인
   - `https://` 포함 확인

2. **CORS 설정 확인**
   - 백엔드 Variables에서 `CORS_ORIGIN=*` 확인

3. **브라우저 콘솔 확인**
   - F12 → Console
   - Network 탭에서 API 요청 확인

---

## 🎉 완료 후 확인 사항

### 시스템 전체 연결 확인

1. **프론트엔드 접속**
   - 로그인 페이지 표시
   - UI 정상 렌더링

2. **로그인 테스트**
   - 사용자 인증 (백엔드 API 호출)
   - JWT 토큰 발급

3. **데이터 조회**
   - 대시보드 데이터 로드
   - 데이터베이스 쿼리 실행

---

## 📞 지원

문제가 발생하면:
1. Railway Logs 확인
2. 브라우저 개발자 도구 확인
3. 환경 변수 재확인
4. 서비스 재배포

---

## 🚀 최종 URL 예시

배포 완료 후:

- **프론트엔드**: https://cams-frontend-production.up.railway.app
- **백엔드**: https://cams-mold-management-system-production-cb6e.up.railway.app
- **데이터베이스**: postgresql://...@switchyard.proxy.rlwy.net:34950/railway

---

**모든 서비스를 Railway 웹 대시보드에서 생성하고 연결하세요!** 🎯
