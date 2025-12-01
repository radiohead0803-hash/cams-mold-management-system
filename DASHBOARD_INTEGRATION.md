# 대시보드 DB 연결 완료 가이드

## ✅ 백엔드 API 상태

### 엔드포인트
```
GET /api/v1/hq/dashboard/summary
```

### 위치
```
server/src/routes/hqDashboard.js
```

### 응답 형식
```json
{
  "success": true,
  "data": {
    "totalMolds": 150,
    "activeMolds": 120,
    "ngMolds": 5,
    "openRepairs": 8,
    "todayScans": 45,
    "criticalAlerts": 3,
    "overShotCount": 5,
    "inspectionDueCount": 7,
    "gpsRegistered": 145,
    "gpsAbnormal": 2,
    "majorAlerts": 10,
    "minorAlerts": 15,
    "totalUsers": 50,
    "todayQRScans": 45
  }
}
```

### Express 앱 연결
```javascript
// server/src/app.js
const hqDashboardRouter = require('./routes/hqDashboard');
app.use('/api/v1/hq', hqDashboardRouter);
```

---

## ✅ 프론트엔드 연결 상태

### 컴포넌트
```
client/src/pages/dashboards/SystemAdminDashboard.jsx
```

### 데이터 훅
```javascript
import { useDashboardKpi } from '../../hooks/useDashboardKpi';

const { data: stats, loading, error, refetch } = useDashboardKpi();
```

### API 호출
```javascript
// client/src/hooks/useDashboardKpi.js
const response = await api.get('/hq/dashboard/summary');
```

---

## 🧪 테스트 방법

### 1. 백엔드 API 직접 테스트
```bash
# 서버 실행
cd server
npm start

# 브라우저에서 직접 접속
http://localhost:3001/api/v1/hq/dashboard/summary
```

**예상 결과**: JSON 데이터 표시

### 2. 프론트엔드 테스트
```bash
# 클라이언트 실행
cd client
npm run dev

# 브라우저에서 접속
http://localhost:5173/admin/dashboard
```

**예상 결과**: KPI 카드에 실시간 데이터 표시

### 3. 개발자 도구 확인
- **Network 탭**: `/hq/dashboard/summary` 요청이 200 OK
- **Console 탭**: 에러 메시지 없음
- **Response**: JSON 데이터 확인

---

## 📊 KPI 카드 매핑

| 카드 | 데이터 필드 | 아이콘 | 색상 | 클릭 경로 |
|------|------------|--------|------|----------|
| 전체 금형 수 | `totalMolds` | Factory | Gray | `/molds` |
| 양산 중 금형 | `activeMolds` | LayoutDashboard | Green | `/molds?status=active` |
| 진행 중 수리 | `openRepairs` | Wrench | Orange | `/hq/repair-requests` |
| 오늘 QR 스캔 | `todayScans` | QrCode | Purple | `/qr-sessions` |
| 타수 초과 | `overShotCount` | AlertTriangle | Red | `/hq/molds/over-shot` |
| 정기검사 필요 | `inspectionDueCount` | TrendingUp | Blue | `/hq/molds/inspection-due` |

---

## 🔧 문제 해결

### 문제 1: API 호출 실패 (401 Unauthorized)
**원인**: 인증 토큰 누락

**해결**:
```javascript
// localStorage에 토큰 확인
const authData = localStorage.getItem('cams-auth');
console.log(authData);

// 로그인 후 다시 시도
```

### 문제 2: CORS 에러
**원인**: 프론트엔드와 백엔드 도메인 불일치

**해결**:
```javascript
// server/src/app.js
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### 문제 3: 데이터가 0으로 표시
**원인**: 데이터베이스에 실제 데이터 없음

**해결**:
```sql
-- 테스트 데이터 확인
SELECT COUNT(*) FROM molds;
SELECT COUNT(*) FROM repairs;
SELECT COUNT(*) FROM qr_sessions;
```

---

## 🎯 다음 단계

### 1. 실시간 업데이트 추가
```javascript
// 30초마다 자동 새로고침
useEffect(() => {
  const interval = setInterval(() => {
    refetch();
  }, 30000);
  
  return () => clearInterval(interval);
}, [refetch]);
```

### 2. 로딩 스켈레톤 추가
```jsx
{loading && (
  <div className="grid grid-cols-3 gap-4">
    {[1,2,3,4,5,6].map(i => (
      <div key={i} className="animate-pulse bg-gray-200 h-24 rounded-xl" />
    ))}
  </div>
)}
```

### 3. 에러 바운더리 추가
```jsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <p className="text-red-800">{error}</p>
    <button onClick={refetch} className="mt-2 text-red-600">
      다시 시도
    </button>
  </div>
)}
```

---

## 📝 체크리스트

- [x] 백엔드 API 구현 (`/api/v1/hq/dashboard/summary`)
- [x] Express 라우터 연결
- [x] 프론트엔드 훅 구현 (`useDashboardKpi`)
- [x] KPI 카드 컴포넌트 구현
- [x] 아이콘 및 스타일링 적용
- [x] 네비게이션 연결
- [x] 에러 처리
- [x] 로딩 상태 처리
- [x] 기본값 처리 (`|| 0`)

---

## 🎉 완료 상태

**대시보드가 DB와 완전히 연결되었습니다!** 🚀

- ✅ 실시간 데이터 표시
- ✅ 6개 핵심 KPI 카드
- ✅ 클릭 네비게이션
- ✅ 에러 처리
- ✅ 로딩 상태

**작성일**: 2024-12-01  
**상태**: 완료
