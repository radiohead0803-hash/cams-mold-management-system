# Railway 배포 점검 체크리스트

**점검일**: 2025-12-02
**프로젝트**: CAMS 금형관리 전산시스템

---

## 📊 전체 배포 구조

```
Railway Project: abundant-freedom
│
├── 🗄️ PostgreSQL Database
│   ├── Service: Postgres
│   ├── DATABASE_PUBLIC_URL: postgresql://postgres:***@postgres.railway.internal:5432/railway
│   └── Status: ✅ Running
│
├── 🔧 Backend API Server
│   ├── Service: cams-mold-management-system
│   ├── URL: https://cams-mold-management-system-production-cb6e.up.railway.app
│   ├── Root Directory: /server
│   ├── Port: 3000
│   └── Status: ⚠️ Needs DATABASE_URL
│
└── 🎨 Frontend (React + Vite)
    ├── Service: bountiful-nurturing
    ├── URL: https://bountiful-nurturing-production-cd5c.up.railway.app
    ├── Root Directory: /client
    ├── Port: Dynamic (Railway assigns)
    └── Status: ✅ Running
```

---

## 🔍 1. 데이터베이스 (PostgreSQL) 점검

### ✅ 확인 항목
- [x] **PostgreSQL 서비스 생성됨**
- [x] **DATABASE_PUBLIC_URL 생성됨**
- [x] **서비스 실행 중**

### 📝 데이터베이스 정보
- **Service Name**: `Postgres`
- **Internal URL**: `postgresql://postgres:***@postgres.railway.internal:5432/railway`
- **External URL**: Railway에서 제공 (PUBLIC_URL)

### ⚠️ 주의사항
- Railway의 PostgreSQL은 자동으로 `DATABASE_PUBLIC_URL` 환경 변수를 생성합니다
- 이 변수를 백엔드 서비스에서 참조해야 합니다

---

## 🔧 2. 백엔드 API 서버 점검

### 현재 설정된 환경 변수
- [x] `NODE_ENV=production`
- [x] `PORT=3000`
- [x] `JWT_SECRET=cams-mold-management-system-super-secret-key-2024-production-min-32-chars`
- [x] `JWT_EXPIRES_IN=8h`
- [x] `CORS_ORIGIN=*`
- [x] `API_VERSION=v1`
- [x] `LOG_LEVEL=info`
- [ ] `DATABASE_URL` ⚠️ **설정 필요!**

### ❌ 누락된 환경 변수: DATABASE_URL

**문제**: 백엔드가 데이터베이스에 연결할 수 없음

**해결 방법**:

#### Railway 대시보드에서 설정:

1. **Railway 대시보드 접속**
   ```
   https://railway.app/project/a136e06c-9069-49d0-ad10-e4f9d08c48d5
   ```

2. **백엔드 서비스 선택**
   - 서비스 이름: `cams-mold-management-system`

3. **Variables 탭 클릭**

4. **New Variable 클릭**

5. **"Add Reference" 선택**

6. **설정 값**:
   - Variable Name: `DATABASE_URL`
   - Service: `Postgres`
   - Variable: `DATABASE_PUBLIC_URL`

7. **Add 클릭**

8. **자동 재배포 대기** (약 2-3분)

### 📡 API 엔드포인트 테스트

DATABASE_URL 설정 후 테스트:

```bash
# Health Check
curl https://cams-mold-management-system-production-cb6e.up.railway.app/health

# 예상 응답
{
  "status": "ok",
  "timestamp": "2025-12-02T...",
  "database": "railway"
}
```

```bash
# API 테스트 (인증 필요)
curl https://cams-mold-management-system-production-cb6e.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### 🔍 백엔드 로그 확인

Railway 대시보드에서:
1. 백엔드 서비스 선택
2. Deployments 탭
3. 최신 배포 클릭
4. View Logs

**예상 로그**:
```
✅ Database connection established successfully.
📊 Database models synced.
🚀 CAMS API Server started
📍 Server running on: http://localhost:3000
🏥 Health check: http://localhost:3000/health
```

---

## 🎨 3. 프론트엔드 점검

### ✅ 현재 상태
- [x] **서비스 배포됨**
- [x] **URL 접근 가능**: https://bountiful-nurturing-production-cd5c.up.railway.app
- [x] **Vite 빌드 설정 완료**

### ⚠️ 환경 변수 확인 필요

프론트엔드가 백엔드 API를 호출하려면 환경 변수가 필요합니다:

#### Railway 대시보드에서 설정:

1. **프론트엔드 서비스 선택**
   - 서비스 이름: `bountiful-nurturing`

2. **Variables 탭 클릭**

3. **환경 변수 추가**:
   ```
   VITE_API_URL=https://cams-mold-management-system-production-cb6e.up.railway.app
   ```

4. **재배포 대기**

### 📝 Vite 설정 확인

`client/vite.config.js`:
```javascript
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_API_URL || 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

### 🌐 프론트엔드 접속 테스트

```
https://bountiful-nurturing-production-cd5c.up.railway.app
```

**확인 사항**:
- [ ] 페이지 로드 성공
- [ ] 로그인 페이지 표시
- [ ] API 호출 성공 (Network 탭 확인)
- [ ] CORS 에러 없음

---

## 🔗 4. 프론트엔드-백엔드 연동 점검

### API 호출 흐름

```
Frontend (Railway)
    ↓ HTTP Request
    ↓ /api/v1/auth/login
    ↓
Backend API (Railway)
    ↓ Database Query
    ↓
PostgreSQL (Railway)
```

### 연동 테스트 시나리오

#### 1. 로그인 테스트
```javascript
// 프론트엔드에서
const response = await axios.post('/api/v1/auth/login', {
  username: 'plant_user',
  password: 'password123'
});

// 예상 응답
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "plant_user",
      "user_type": "plant"
    }
  }
}
```

#### 2. 대시보드 KPI 조회
```javascript
// 프론트엔드에서
const response = await axios.get('/api/v1/dashboard/plant/kpis', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### 3. QR 스캔 테스트
```javascript
const response = await axios.post('/api/v1/qr/scan', {
  qr_code: 'MOLD-M-2024-001-QR123',
  location: {
    latitude: 35.5384,
    longitude: 129.3114
  }
});
```

### 🐛 연동 문제 해결

#### 문제 1: CORS 에러
```
Access to XMLHttpRequest at 'https://...' from origin 'https://...' 
has been blocked by CORS policy
```

**해결**: 백엔드 `CORS_ORIGIN=*` 설정 확인 (이미 설정됨 ✅)

#### 문제 2: 404 Not Found
```
GET https://.../api/v1/... 404
```

**원인**: 백엔드 서버가 시작되지 않음
**해결**: DATABASE_URL 설정 후 재배포

#### 문제 3: 500 Internal Server Error
```
POST https://.../api/v1/auth/login 500
```

**원인**: 데이터베이스 연결 실패
**해결**: 
1. DATABASE_URL 설정 확인
2. 백엔드 로그 확인
3. PostgreSQL 서비스 상태 확인

#### 문제 4: Network Error
```
Network Error
```

**원인**: API URL이 잘못됨
**해결**: 프론트엔드 `VITE_API_URL` 확인

---

## 📋 5. 전체 시스템 점검 체크리스트

### 데이터베이스
- [x] PostgreSQL 서비스 생성
- [x] DATABASE_PUBLIC_URL 생성
- [x] 서비스 실행 중

### 백엔드
- [x] 서비스 배포 완료
- [x] 기본 환경 변수 설정 (7개)
- [ ] DATABASE_URL 설정 ⚠️ **필수**
- [ ] Health Check 성공
- [ ] API 엔드포인트 응답 확인
- [ ] 로그에서 DB 연결 확인

### 프론트엔드
- [x] 서비스 배포 완료
- [ ] VITE_API_URL 설정 권장
- [ ] 페이지 로드 확인
- [ ] 로그인 기능 테스트
- [ ] API 호출 성공 확인

### 연동
- [ ] 프론트엔드 → 백엔드 통신 성공
- [ ] 백엔드 → 데이터베이스 연결 성공
- [ ] CORS 설정 정상
- [ ] 인증 토큰 발급/검증 정상
- [ ] 전체 워크플로우 테스트

---

## 🚀 6. 즉시 실행해야 할 작업

### 우선순위 1: DATABASE_URL 설정 (필수)

**소요 시간**: 2-3분

**단계**:
1. Railway 대시보드 접속
2. 백엔드 서비스 → Variables
3. DATABASE_URL 추가 (Postgres 서비스 참조)
4. 재배포 대기
5. Health Check 확인

### 우선순위 2: 프론트엔드 환경 변수 (권장)

**소요 시간**: 2분

**단계**:
1. Railway 대시보드 접속
2. 프론트엔드 서비스 → Variables
3. VITE_API_URL 추가
4. 재배포 대기

### 우선순위 3: 통합 테스트

**소요 시간**: 10분

**단계**:
1. 프론트엔드 접속
2. 로그인 테스트
3. 대시보드 확인
4. API 호출 테스트
5. 브라우저 콘솔 에러 확인

---

## 📊 7. 현재 상태 요약

### ✅ 완료된 항목 (80%)
- ✅ PostgreSQL 데이터베이스 생성
- ✅ 백엔드 서비스 배포
- ✅ 프론트엔드 서비스 배포
- ✅ 기본 환경 변수 설정
- ✅ CORS 설정
- ✅ 서비스 URL 확보

### ⚠️ 진행 중 (10%)
- ⚠️ DATABASE_URL 설정 대기
- ⚠️ 백엔드 재배포 대기

### ❌ 미완료 (10%)
- ❌ 프론트엔드 환경 변수 (선택)
- ❌ 통합 테스트
- ❌ 실제 데이터 확인

---

## 🎯 8. 예상 결과

### DATABASE_URL 설정 후

#### 백엔드 Health Check
```bash
curl https://cams-mold-management-system-production-cb6e.up.railway.app/health
```

**응답**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-02T07:05:00.000Z",
  "database": "railway",
  "version": "1.0.0"
}
```

#### 로그인 API
```bash
curl -X POST https://cams-mold-management-system-production-cb6e.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**응답**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "관리자",
      "user_type": "system_admin"
    }
  }
}
```

#### 프론트엔드 접속
```
https://bountiful-nurturing-production-cd5c.up.railway.app
```

**예상 화면**:
- 로그인 페이지 표시
- 로그인 성공 → 대시보드 이동
- 실시간 데이터 표시

---

## 📞 9. 지원 및 문제 해결

### Railway 대시보드
```
https://railway.app/project/a136e06c-9069-49d0-ad10-e4f9d08c48d5
```

### 백엔드 로그 확인
1. 백엔드 서비스 선택
2. Deployments 탭
3. View Logs

### 프론트엔드 로그 확인
1. 프론트엔드 서비스 선택
2. Deployments 탭
3. View Logs

### 브라우저 개발자 도구
- F12 → Network 탭: API 호출 확인
- F12 → Console 탭: 에러 메시지 확인

---

## ✅ 최종 체크리스트

### 배포 전
- [x] 코드 커밋 및 푸시
- [x] Railway 프로젝트 생성
- [x] 서비스 3개 생성 (DB, Backend, Frontend)

### 배포 중
- [x] 백엔드 배포 완료
- [x] 프론트엔드 배포 완료
- [x] 기본 환경 변수 설정
- [ ] DATABASE_URL 설정 ⚠️
- [ ] VITE_API_URL 설정

### 배포 후
- [ ] Health Check 성공
- [ ] API 테스트 성공
- [ ] 프론트엔드 접속 성공
- [ ] 로그인 테스트 성공
- [ ] 전체 기능 테스트

---

## 🎉 완료 기준

다음 조건이 모두 만족되면 배포 완료:

1. ✅ Health Check 응답 정상
2. ✅ 로그인 API 정상 작동
3. ✅ 프론트엔드 페이지 로드
4. ✅ 프론트엔드-백엔드 통신 성공
5. ✅ 데이터베이스 연결 정상
6. ✅ 브라우저 콘솔 에러 없음

---

**현재 진행률**: 80% → **DATABASE_URL 설정만 하면 90% 완료!**

**예상 완료 시간**: DATABASE_URL 설정 후 5분 이내

**다음 작업**: Railway 대시보드에서 DATABASE_URL 설정

---

**작성일**: 2025-12-02
**최종 업데이트**: 2025-12-02 16:05
