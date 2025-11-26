# 🚀 Railway 백엔드 배포 단계별 가이드

## 📋 준비 사항

- ✅ Railway 계정
- ✅ GitHub 저장소: `radiohead0803-hash/cams-mold-management-system`
- ✅ Railway CLI 설치됨
- ✅ `server/railway.json` 설정 파일 존재

---

## 🎯 방법 1: Railway 대시보드 (권장)

### Step 1: Railway 대시보드 접속

1. 브라우저에서 접속:
   ```
   https://railway.app
   ```

2. 로그인

3. 프로젝트 선택: **`abundant-freedom`**

### Step 2: 새 서비스 추가

1. **"+ New" 버튼 클릭**

2. **"GitHub Repo" 선택**

3. **저장소 선택**:
   - `radiohead0803-hash/cams-mold-management-system`
   - 또는 "Configure GitHub App" 클릭하여 저장소 권한 부여

4. **서비스 이름 입력**: `backend` 또는 `cams-backend`

### Step 3: Root Directory 설정

1. 생성된 서비스 클릭

2. **Settings 탭** 클릭

3. **"Root Directory"** 찾기

4. 값 입력: `/server` ✅

5. **"Save"** 클릭

### Step 4: 환경 변수 설정

1. **Variables 탭** 클릭

2. **"New Variable" 버튼 클릭**

3. 다음 환경 변수들을 하나씩 추가:

#### 기본 환경 변수

| Variable Name | Value |
|--------------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `JWT_SECRET` | `cams-mold-management-system-super-secret-key-2024-production-min-32-chars` |
| `JWT_EXPIRES_IN` | `8h` |
| `CORS_ORIGIN` | `*` |
| `API_VERSION` | `v1` |
| `LOG_LEVEL` | `info` |

#### 데이터베이스 연결 (중요!)

1. **"New Variable" 클릭**
2. **Variable Name**: `DATABASE_URL`
3. **"Add Reference" 클릭**
4. **Service 선택**: `Postgres`
5. **Variable 선택**: `DATABASE_PUBLIC_URL`
6. **"Add" 클릭**

### Step 5: 도메인 생성

1. **Settings 탭**

2. **Networking 섹션**

3. **"Generate Domain" 클릭**

4. 생성된 도메인 복사:
   ```
   https://cams-backend-production-xxxx.up.railway.app
   ```

### Step 6: 배포 시작

1. **Deployments 탭**

2. Railway가 자동으로 배포 시작

3. 빌드 로그 확인:
   - ✅ `npm ci` 실행
   - ✅ `node src/server.js` 시작
   - ✅ Database connection established
   - ✅ Server running

### Step 7: 배포 확인

1. **Health Check 테스트**:
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

2. **API 테스트**:
   ```
   https://your-backend-domain.up.railway.app/api/v1/mold-specifications
   ```

   예상 응답 (인증 필요):
   ```json
   {
     "success": false,
     "error": {
       "message": "인증 토큰이 필요합니다"
     }
   }
   ```

---

## 🎯 방법 2: Railway CLI

### Step 1: 프로젝트 연결

```bash
cd server
railway link
```

선택:
- Workspace: `radiohead0803-hash's Projects`
- Project: `abundant-freedom`
- Environment: `production`
- Service: **새 서비스 생성** 또는 기존 서비스 선택

### Step 2: 환경 변수 설정

```bash
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set JWT_SECRET=cams-mold-management-system-super-secret-key-2024-production-min-32-chars
railway variables set JWT_EXPIRES_IN=8h
railway variables set CORS_ORIGIN=*
railway variables set API_VERSION=v1
railway variables set LOG_LEVEL=info
```

**DATABASE_URL은 대시보드에서 참조로 설정해야 함**

### Step 3: 배포

```bash
railway up
```

---

## 🔧 프론트엔드 환경 변수 업데이트

### Railway에서 프론트엔드도 호스팅하는 경우

1. **프론트엔드 서비스 선택**

2. **Variables 탭**

3. **환경 변수 추가**:
   ```
   VITE_API_URL=https://your-backend-domain.up.railway.app
   ```

### Vercel/Netlify 등 다른 곳에서 호스팅하는 경우

해당 플랫폼의 환경 변수 설정에서:
```
VITE_API_URL=https://your-backend-domain.up.railway.app
```

---

## ✅ 최종 확인 체크리스트

- [ ] Railway 대시보드에서 백엔드 서비스 생성
- [ ] Root Directory: `/server` 설정
- [ ] 환경 변수 8개 추가 (DATABASE_URL 포함)
- [ ] DATABASE_URL이 Postgres 참조로 설정됨
- [ ] 도메인 생성됨
- [ ] 배포 성공 (Deployments 탭에서 확인)
- [ ] Health Check 응답 확인
- [ ] 프론트엔드 VITE_API_URL 업데이트
- [ ] 프론트엔드 재배포
- [ ] 개발금형 현황 페이지 테스트

---

## 🐛 문제 해결

### 빌드 실패: "Cannot find module"

**원인**: Root Directory가 잘못 설정됨

**해결**:
1. Settings → Root Directory
2. `/server` 입력
3. Redeploy

### 서버 시작 실패: "Database connection failed"

**원인**: DATABASE_URL 환경 변수 누락 또는 잘못됨

**해결**:
1. Variables 탭 확인
2. DATABASE_URL이 `${{Postgres.DATABASE_PUBLIC_URL}}` 참조인지 확인
3. Postgres 서비스가 실행 중인지 확인

### 404 에러: "Cannot GET /api/v1/mold-specifications"

**원인**: 서버가 제대로 시작되지 않음

**해결**:
1. Deployments → View Logs
2. 에러 메시지 확인
3. 환경 변수 확인

### CORS 에러

**원인**: 프론트엔드 도메인이 허용되지 않음

**해결**:
1. `CORS_ORIGIN=*` 환경 변수 추가
2. 또는 프론트엔드 도메인을 명시적으로 추가

---

## 📊 예상 결과

### 배포 성공 시

```
✅ Build completed
✅ Deployment live
✅ Health check passing
✅ API endpoints responding
```

### 서비스 구조

```
Railway Project: abundant-freedom
├── Postgres
│   └── DATABASE_PUBLIC_URL: postgresql://...
├── Backend ⭐ (새로 추가됨)
│   ├── Domain: https://cams-backend-production-xxxx.up.railway.app
│   ├── Root: /server
│   └── Status: Running
└── (Frontend - 선택사항)
```

---

## 🚀 다음 단계

1. ✅ 백엔드 배포 완료
2. ✅ API 엔드포인트 활성화
3. ✅ 프론트엔드 환경 변수 업데이트
4. ✅ 개발금형 현황 페이지에서 실제 데이터 표시

---

**예상 소요 시간**: 10-15분

**완료 후 테스트**:
```
https://bountiful-nurturing-production-cd5c.up.railway.app/molds/lifecycle
```

데이터가 표시되어야 합니다! 🎉
