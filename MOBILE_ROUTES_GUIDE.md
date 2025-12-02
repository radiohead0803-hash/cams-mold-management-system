# 📱 모바일 라우트 설정 가이드

## 🎯 개요

QR 로그인 → 금형 개요 → 드롭다운 메뉴 → 점검/수리 기능까지 연결된 모바일 라우트 구조입니다.

---

## 📋 라우트 구조

### 1️⃣ QR 로그인
```
/qr-login                    → QRLogin.jsx
```

### 2️⃣ 금형 개요
```
/mobile/molds/:moldId        → MoldOverviewPage.tsx
```

### 3️⃣ 금형 점검
```
/mobile/molds/:moldId/check/:category    → ChecklistStartPage.tsx
  - :category = daily | regular | clean | wash

/mobile/checklists/:instanceId           → ChecklistFormPage (기존)
```

### 4️⃣ 금형 수리
```
/mobile/molds/:moldId/repair/requests           → RepairRequestListPage.tsx
/mobile/molds/:moldId/repair/requests/:id       → RepairRequestDetailPage (기존)
/mobile/molds/:moldId/repair/progress           → RepairRequestListPage.tsx (showStatusOnly)
```

---

## 🔧 App.jsx 라우터 설정

### ✅ 이미 추가됨!

```jsx
// client/src/App.jsx

import MoldOverviewPage from './pages/mobile/MoldOverviewPage'
import ChecklistStartPage from './pages/mobile/ChecklistStartPage'
import RepairRequestListPage from './pages/mobile/RepairRequestListPage'

function App() {
  return (
    <Routes>
      {/* Mobile Routes */}
      <Route path="/mobile/molds/:moldId" element={<MoldOverviewPage />} />
      <Route path="/mobile/molds/:moldId/check/:category" element={<ChecklistStartPage />} />
      <Route path="/mobile/molds/:moldId/repair/requests" element={<RepairRequestListPage />} />
      <Route path="/mobile/molds/:moldId/repair/progress" element={<RepairRequestListPage showStatusOnly />} />
      
      {/* ... 기존 라우트들 ... */}
    </Routes>
  )
}
```

---

## 🔄 전체 플로우

### 1️⃣ QR 로그인 → 금형 개요
```
사용자 QR 스캔
  ↓
POST /api/v1/mobile/qr/scan { code: 'QR-MOLD-001' }
  ↓
금형 정보 받기 { mold, templates }
  ↓
navigate('/mobile/molds/1', { state: { role, mold } })
  ↓
MoldOverviewPage 렌더링
```

### 2️⃣ 금형 개요 → 점검 시작
```
드롭다운 "금형점검 > 일상점검" 클릭
  ↓
navigate('/mobile/molds/1/check/daily')
  ↓
ChecklistStartPage 렌더링
  ↓
GET /api/v1/molds/1/checklist-templates?category=daily
  ↓
템플릿 목록 표시
  ↓
템플릿 선택
  ↓
POST /api/v1/molds/1/checklists/start { templateId, category, siteRole }
  ↓
navigate('/mobile/checklists/:instanceId')
  ↓
ChecklistFormPage 렌더링 (기존)
```

### 3️⃣ 금형 개요 → 수리요청 목록
```
드롭다운 "금형수리 > 수리요청" 클릭
  ↓
navigate('/mobile/molds/1/repair/requests')
  ↓
RepairRequestListPage 렌더링
  ↓
GET /api/v1/repair-requests?moldId=1
  ↓
수리요청 목록 표시
  ↓
수리요청 클릭
  ↓
navigate('/mobile/molds/1/repair/requests/:id')
  ↓
RepairRequestDetailPage 렌더링 (기존)
```

---

## 📊 상태 전달 (State Passing)

### Navigation State 구조
```typescript
{
  role: 'production' | 'maker' | 'developer' | 'plant' | 'hq',
  mold: {
    id: number,
    code: string,
    name: string,
    shotCounter: number,
    maxShots: number,
    shotRate: number,
    // ... 기타 필드
  }
}
```

### State 복구 우선순위
```javascript
// 1순위: Navigation state
const stateRole = location.state?.role

// 2순위: localStorage auth
const auth = JSON.parse(localStorage.getItem('cams_auth') || '{}')
const authRole = auth.role

// 3순위: localStorage scanned mold
const scannedMold = JSON.parse(localStorage.getItem('cams_scanned_mold') || '{}')
const moldData = scannedMold.mold

// 최종 결정
const role = stateRole || authRole || 'production'
const mold = stateMold || moldData || null
```

---

## 🧪 테스트 시나리오

### ✅ 시나리오 1: QR 스캔 → 점검
```
1. /qr-login 접속
2. QR-MOLD-001 입력
3. /mobile/molds/1 로 이동 확인
4. 드롭다운 "금형점검" 호버
5. "일상점검" 클릭
6. /mobile/molds/1/check/daily 로 이동 확인
7. 템플릿 목록 표시 확인
8. 템플릿 선택
9. /mobile/checklists/:instanceId 로 이동 확인
```

### ✅ 시나리오 2: 금형 개요 → 수리요청
```
1. /mobile/molds/1 접속 (QR 스캔 후)
2. 드롭다운 "금형수리" 호버
3. "수리요청" 클릭
4. /mobile/molds/1/repair/requests 로 이동 확인
5. 수리요청 목록 표시 확인
6. 수리요청 클릭
7. 상세 페이지 이동 확인
```

### ✅ 시나리오 3: 빠른 점검 버튼
```
1. /mobile/molds/1 접속
2. "금형점검 바로가기" 섹션 확인
3. "일상점검" 버튼 클릭
4. /mobile/molds/1/check/daily 로 이동 확인
5. 역할별 버튼 활성/비활성 확인
   - production: 모든 점검 버튼 활성
   - maker: 모든 점검 버튼 활성
   - developer: 점검 버튼 비활성
```

---

## 🎨 UI 컴포넌트

### MoldTopNav (드롭다운 메뉴)
- **위치**: `client/src/components/MoldTopNav.tsx`
- **기능**: 역할별 메뉴 활성/비활성, 드롭다운 표시
- **Props**: `{ role: UserRole }`

### ChecklistStartPage
- **위치**: `client/src/pages/mobile/ChecklistStartPage.tsx`
- **기능**: 템플릿 선택, 인스턴스 생성
- **Params**: `{ moldId, category }`

### RepairRequestListPage
- **위치**: `client/src/pages/mobile/RepairRequestListPage.tsx`
- **기능**: 수리요청 목록 표시
- **Props**: `{ showStatusOnly?: boolean }`
- **Params**: `{ moldId }`

---

## 📝 API 엔드포인트

### 금형 정보
```
GET /api/v1/molds/:id
Response: { success: true, data: { ...mold } }
```

### 체크리스트 템플릿
```
GET /api/v1/molds/:id/checklist-templates?category=daily
Response: { success: true, data: [...templates] }
```

### 체크리스트 시작
```
POST /api/v1/molds/:id/checklists/start
Body: { templateId, category, siteRole }
Response: { success: true, data: { instanceId, template } }
```

### 수리요청 목록
```
GET /api/v1/repair-requests?moldId=:id
Response: { success: true, data: [...requests] }
```

---

## ✅ 완료 체크리스트

- [x] MoldOverviewPage 생성
- [x] ChecklistStartPage 생성
- [x] RepairRequestListPage 생성
- [x] MoldTopNav 컴포넌트 생성
- [x] moldMenus.ts 메뉴 구조 정의
- [x] App.jsx 라우트 등록
- [x] QRLogin.jsx 금형 페이지 연결
- [x] State 전달 구조 구현

---

## 🚀 다음 단계

1. **체크리스트 폼 페이지 연결**
   - `/mobile/checklists/:instanceId` 라우트 확인
   - ChecklistFormPage 존재 여부 확인

2. **수리요청 상세 페이지 연결**
   - `/mobile/molds/:moldId/repair/requests/:id` 라우트 추가
   - RepairRequestDetailPage 모바일 버전 생성

3. **테스트 데이터 추가**
   - Railway DB에 테스트 금형 추가 (QR-MOLD-001~003)
   - 체크리스트 템플릿 추가
   - 수리요청 샘플 데이터 추가

4. **실제 테스트**
   - QR 스캔 플로우 테스트
   - 드롭다운 메뉴 테스트
   - 역할별 권한 테스트
