# 프론트엔드-백엔드 API 연동 가이드

**작성일**: 2025-12-02
**최종 업데이트**: 2025-12-02 16:30
**Phase 1 완료**: 로그인 및 대시보드 API 연동
**Phase 2 완료**: QR 스캔 및 점검 워크플로우

---

## ✅ 완료된 작업

### 1. API 클라이언트 설정
- **파일**: `client/src/api/httpClient.ts`
- **기능**:
  - Axios 기반 HTTP 클라이언트
  - 자동 토큰 주입 (Authorization Bearer)
  - Base URL 설정 (환경 변수 또는 프록시)
  - 요청 인터셉터

### 2. 인증 시스템 통합
- **파일**: `client/src/stores/authStore.js`
- **기능**:
  - 실제 백엔드 API 호출 (`POST /api/v1/auth/login`)
  - 토큰 관리 (localStorage)
  - 사용자 정보 저장
  - 역할 매핑 (user_type → role)
  - 에러 처리 및 로딩 상태

### 3. 로그인 페이지 업데이트
- **파일**: `client/src/pages/Login.jsx`
- **기능**:
  - 백엔드 API 연동
  - 역할별 자동 라우팅
  - 에러 메시지 표시
  - 로딩 상태 표시

### 4. 대시보드 API 통합
- **파일**: 
  - `client/src/api/dashboardApi.ts`
  - `client/src/hooks/useDashboardKpi.ts`
- **기능**:
  - 역할별 엔드포인트 자동 선택
  - 실시간 데이터 페칭
  - 에러 처리
  - 재조회 기능

### 5. 보호된 라우트
- **파일**: `client/src/components/ProtectedRoute.tsx`
- **기능**:
  - 인증 확인
  - 역할 기반 접근 제어
  - 자동 로그인 페이지 리다이렉트
  - 세션 복원

---

## 🔧 설정 방법

### 1. 환경 변수 설정 (선택사항)

`client/.env` 파일 생성:
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

**참고**: 환경 변수가 없으면 Vite 프록시 설정(`/api/v1`)을 사용합니다.

### 2. 백엔드 서버 실행

```bash
cd server
npm run dev
```

**서버 주소**: `http://localhost:3000`

### 3. 프론트엔드 서버 실행

```bash
cd client
npm run dev
```

**서버 주소**: `http://localhost:5173`

---

## 🧪 테스트 방법

### 1. 로그인 테스트

#### 브라우저 접속
```
http://localhost:5173/login
```

#### 테스트 계정 (예시)
```
Username: plant_user
Password: password123
```

#### 예상 동작
1. 로그인 버튼 클릭
2. `POST /api/v1/auth/login` 호출
3. 토큰 및 사용자 정보 수신
4. localStorage에 저장
5. 역할별 대시보드로 자동 이동

### 2. Network 탭 확인

**Chrome DevTools → Network 탭**

#### 로그인 요청
```
Request URL: http://localhost:3000/api/v1/auth/login
Request Method: POST
Request Payload:
{
  "username": "plant_user",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "plant_user",
      "name": "생산담당자",
      "user_type": "plant",
      "company_id": 3
    }
  }
}
```

#### 대시보드 KPI 요청
```
Request URL: http://localhost:3000/api/v1/dashboard/plant/kpis
Request Method: GET
Request Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response:
{
  "success": true,
  "data": {
    "todayCheckCount": 25,
    "openRepairCount": 3,
    "recentNgMoldCount": 2,
    "activeMoldCount": 45,
    ...
  }
}
```

### 3. localStorage 확인

**Chrome DevTools → Application → Local Storage**

```javascript
// cams-auth
{
  "user": {
    "id": 1,
    "username": "plant_user",
    "name": "생산담당자",
    "role": "plant",
    "company_id": 3
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. 역할별 라우팅 테스트

| 역할 | 로그인 후 이동 경로 | 대시보드 API |
|------|-------------------|-------------|
| system_admin | `/dashboard/admin` | `/dashboard/system-admin/kpis` |
| mold_developer | `/dashboard/developer` | `/dashboard/developer/kpis` |
| maker | `/dashboard/maker` | `/dashboard/maker/kpis` |
| plant | `/dashboard/plant` | `/dashboard/plant/kpis` |

---

## 🔍 API 연동 흐름

### 로그인 흐름
```
1. 사용자 입력 (username, password)
   ↓
2. authStore.login(username, password)
   ↓
3. POST /api/v1/auth/login
   ↓
4. 백엔드 응답 (token, user)
   ↓
5. localStorage 저장
   ↓
6. authStore 상태 업데이트
   ↓
7. 역할별 대시보드로 이동
```

### 대시보드 데이터 로딩
```
1. 대시보드 페이지 마운트
   ↓
2. useDashboardKpi() 훅 실행
   ↓
3. user.role 확인
   ↓
4. 역할별 엔드포인트 선택
   ↓
5. GET /api/v1/dashboard/{role}/kpis
   ↓
6. Authorization 헤더 자동 추가
   ↓
7. 데이터 수신 및 상태 업데이트
   ↓
8. UI 렌더링
```

### API 요청 인터셉터
```javascript
// 모든 API 요청에 자동으로 토큰 추가
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('cams-auth')
  if (stored) {
    const { token } = JSON.parse(stored)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})
```

---

## 📝 코드 사용 예시

### 1. 로그인
```javascript
import { useAuthStore } from '../stores/authStore'

function LoginComponent() {
  const { login, loading, error } = useAuthStore()
  
  const handleLogin = async () => {
    const result = await login('plant_user', 'password123')
    if (result.success) {
      // 로그인 성공
      console.log('User:', result.user)
    } else {
      // 로그인 실패
      console.error('Error:', result.error)
    }
  }
}
```

### 2. 대시보드 KPI 조회
```javascript
import { useDashboardKpi } from '../hooks/useDashboardKpi'

function DashboardComponent() {
  const { data, loading, error, refetch } = useDashboardKpi()
  
  if (loading) return <div>로딩 중...</div>
  if (error) return <div>에러: {error}</div>
  
  return (
    <div>
      <h1>대시보드</h1>
      <p>오늘 점검 수: {data.todayCheckCount}</p>
      <button onClick={refetch}>새로고침</button>
    </div>
  )
}
```

### 3. 보호된 라우트
```javascript
import ProtectedRoute from '../components/ProtectedRoute'

<Route
  path="/dashboard/admin"
  element={
    <ProtectedRoute allowedRoles={['system_admin']}>
      <SystemAdminDashboard />
    </ProtectedRoute>
  }
/>
```

### 4. 직접 API 호출
```javascript
import { api } from '../stores/authStore'

// GET 요청
const response = await api.get('/molds')
console.log(response.data)

// POST 요청
const response = await api.post('/qr/scan', {
  qr_code: 'MOLD-M-2024-001-QR123',
  location: { latitude: 35.5384, longitude: 129.3114 }
})
```

---

## 🐛 문제 해결

### 문제 1: CORS 에러
```
Access to XMLHttpRequest at 'http://localhost:3000/api/v1/auth/login' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**해결**:
1. 백엔드 서버가 실행 중인지 확인
2. 백엔드 CORS 설정 확인 (`CORS_ORIGIN=http://localhost:5173`)

### 문제 2: 401 Unauthorized
```
GET /api/v1/dashboard/plant/kpis 401
```

**원인**: 토큰이 없거나 만료됨

**해결**:
1. localStorage에서 `cams-auth` 확인
2. 토큰이 있는지 확인
3. 다시 로그인

### 문제 3: 404 Not Found
```
POST /api/v1/auth/login 404
```

**원인**: 백엔드 서버가 실행되지 않음

**해결**:
```bash
cd server
npm run dev
```

### 문제 4: Network Error
```
Network Error
```

**원인**: 
- 백엔드 서버가 실행되지 않음
- 잘못된 API URL

**해결**:
1. 백엔드 서버 실행 확인
2. `.env` 파일의 `VITE_API_BASE_URL` 확인
3. `vite.config.js`의 프록시 설정 확인

---

## 📊 연동된 API 목록

### Phase 1: 인증 및 대시보드 (완료 ✅)

#### 인증 API
- ✅ `POST /api/v1/auth/login` - 로그인
- ⏳ `GET /api/v1/auth/me` - 현재 사용자 정보 (예정)

#### 대시보드 API
- ✅ `GET /api/v1/dashboard/system-admin/kpis` - 시스템 관리자 KPI
- ✅ `GET /api/v1/dashboard/plant/kpis` - 생산처 KPI
- ✅ `GET /api/v1/dashboard/maker/kpis` - 제작처 KPI
- ✅ `GET /api/v1/dashboard/developer/kpis` - 금형개발 KPI

### Phase 2: QR 및 점검 (완료 ✅)
- ✅ `POST /api/v1/qr/scan` - QR 스캔
- ✅ `POST /api/v1/inspections/daily` - 일상점검
- ✅ `POST /api/v1/inspections/periodic` - 정기점검

### Phase 3: GPS (예정 ⏳)
- ⏳ `GET /api/v1/molds/locations` - 전체 금형 위치
- ⏳ `GET /api/v1/molds/:id/location` - 특정 금형 위치
- ⏳ `POST /api/v1/molds/:id/location` - 금형 위치 업데이트

### Phase 4: 수리요청 (예정 ⏳)
- ⏳ `POST /api/v1/repair-requests` - 수리요청 생성
- ⏳ `POST /api/v1/repair-requests/:id/approve` - 승인
- ⏳ `POST /api/v1/repair-requests/:id/reject` - 반려
- ⏳ `POST /api/v1/repair-requests/:id/assign` - 배정
- ⏳ `PATCH /api/v1/repair-requests/:id/progress` - 진행 상태
- ⏳ `PATCH /api/v1/repair-requests/:id/blame` - 귀책 협의

---

## ✅ 체크리스트

### 개발 환경 설정
- [x] 백엔드 서버 실행 가능
- [x] 프론트엔드 서버 실행 가능
- [x] API 클라이언트 설정 완료
- [x] 환경 변수 설정 (선택)

### 인증 시스템
- [x] 로그인 API 연동
- [x] 토큰 저장 및 관리
- [x] 자동 토큰 주입
- [x] 역할별 라우팅
- [x] 세션 복원

### 대시보드
- [x] 역할별 엔드포인트 선택
- [x] KPI 데이터 페칭
- [x] 에러 처리
- [x] 로딩 상태
- [x] 재조회 기능

### 테스트
- [ ] 로그인 테스트
- [ ] 대시보드 데이터 로딩 테스트
- [ ] 역할별 라우팅 테스트
- [ ] 토큰 만료 처리 테스트
- [ ] 에러 처리 테스트

---

## 🚀 다음 단계

### Phase 2: GPS 및 QR 연동
1. GPS 위치 API 연동
2. QR 스캔 API 연동
3. 금형 위치 지도 표시

### Phase 3: 점검 시스템 연동
1. 일상점검 API 연동
2. 정기점검 API 연동
3. 체크리스트 동적 로딩

### Phase 4: 수리요청 시스템 연동
1. 수리요청 생성 API 연동
2. 승인/반려 API 연동
3. 진행 상태 업데이트 API 연동
4. 파일 업로드 기능

---

## 📚 참고 문서

- **백엔드 API 문서**: `API_IMPLEMENTATION_SUMMARY.md`
- **백엔드 README**: `BACKEND_README.md`
- **프론트엔드 설정**: `FRONTEND_SETUP_GUIDE.md`
- **Railway 배포**: `RAILWAY_DEPLOYMENT_CHECKLIST.md`

---

**작성일**: 2025-12-02 16:20
**상태**: ✅ Phase 1 완료
**다음 작업**: Phase 2 - GPS 및 QR 연동
