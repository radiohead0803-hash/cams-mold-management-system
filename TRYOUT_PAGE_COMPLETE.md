# ✅ TRY-OUT 페이지 구현 완료

## 📁 생성된 파일

### `client/src/pages/dev/TryoutPage.tsx`

**완전한 TRY-OUT 페이지 컴포넌트**
- ✅ 역할별 권한 제어 (maker/production 작성, developer 승인)
- ✅ 상태별 UI 제어 (draft/submitted/approved/rejected)
- ✅ 회차 선택 (T0/T1/T2/PPAP/MASS-001/MASS-002)
- ✅ 기본 정보 입력 (사출기, 수지, 톤수, 캐비티, 샷중량, 싸이클)
- ✅ 성형 조건 테이블 (온도/압력/속도/시간)
- ✅ 불량 기록 및 조치 계획
- ✅ 저장/제출/승인/반려 기능

---

## 🔗 라우트 등록

### `client/src/App.jsx` 수정

```jsx
// 1. Import 추가
import TryoutPage from './pages/dev/TryoutPage';

// 2. Route 추가 (금형 관련 라우트 섹션에)
<Routes>
  {/* 기존 라우트들... */}
  
  {/* 금형육성(TRY-OUT) */}
  <Route 
    path="/mobile/molds/:moldId/dev/tryout" 
    element={<TryoutPage />} 
  />
  
  {/* 또는 더 짧은 경로 */}
  <Route 
    path="/mobile/molds/:moldId/tryout" 
    element={<TryoutPage />} 
  />
</Routes>
```

---

## 🎨 메뉴 연결

### `client/src/constants/moldMenus.ts` 수정

```typescript
export const moldMenus = {
  // ... 기존 메뉴들
  
  development: {
    label: '금형개발',
    items: [
      {
        id: 'dev-plan',
        label: '개발계획',
        path: '/mobile/molds/:moldId/dev-plan',
        allowedRoles: ['maker', 'developer']
      },
      {
        id: 'checklist',
        label: '금형 체크리스트',
        path: '/mobile/molds/:moldId/checklist',
        allowedRoles: ['maker', 'developer']
      },
      {
        id: 'hardness',
        label: '경도측정',
        path: '/mobile/molds/:moldId/hardness',
        allowedRoles: ['maker', 'developer']
      },
      {
        id: 'tryout',
        label: '금형육성(TRY-OUT)',
        path: '/mobile/molds/:moldId/tryout',
        allowedRoles: ['maker', 'production', 'developer']  // 생산처 추가!
      }
    ]
  }
};
```

---

## 🎯 주요 기능

### 1️⃣ 역할별 권한 제어

```typescript
// 제작처 + 생산처만 작성/수정 가능
const canEditRole = role === "maker" || role === "production";
const editable = canEditRole && 
                 (tryout?.status === "draft" || tryout?.status === "rejected");

// 본사만 승인/반려 가능
const canApprove = role === "developer" && tryout?.status === "submitted";
```

### 2️⃣ 상태별 UI 제어

| 상태 | 제작처/생산처 | 본사 |
|------|--------------|------|
| `draft` | 입력 가능, [저장][승인요청] | 읽기 전용 |
| `submitted` | 읽기 전용 | [승인][반려] |
| `approved` | 읽기 전용 | 읽기 전용 |
| `rejected` | 입력 가능, [저장][승인요청] | 읽기 전용 |

### 3️⃣ 회차 선택

```typescript
<select value={trialNo} onChange={(e) => setTrialNo(e.target.value)}>
  <option value="T0">T0</option>
  <option value="T1">T1</option>
  <option value="T2">T2</option>
  <option value="PPAP">PPAP</option>
  <option value="MASS-001">MASS-001</option>
  <option value="MASS-002">MASS-002</option>
</select>
```

### 4️⃣ 성형 조건 (14개 항목)

**온도 (Temperature)**
- 용융온도 (Nozzle)
- 실린더온도 1구, 2구
- 금형온도 (고정측, 가동측)

**압력 (Pressure)**
- 사출압력
- 보압 1단, 2단
- 배압

**속도 (Speed)**
- 사출속도 1단, 2단

**시간 (Time)**
- 사출시간
- 보압시간
- 냉각시간

### 5️⃣ 불량 기록

```typescript
interface Defect {
  defect_type: string;           // 불량 유형
  severity: string;              // none/minor/major/critical
  location: string;              // 발생 위치
  description: string;           // 상세 설명
  cause_analysis: string;        // 원인 분석
  action_plan: string;           // 조치 계획
  is_resolved: boolean;          // 조치 완료 여부
}
```

### 6️⃣ API 연동

```typescript
// 조회
GET /api/v1/molds/:moldId/tryouts/detail?trial_no=T0

// 저장
POST /api/v1/molds/:moldId/tryouts
Body: { tryout, conditions, defects }

// 제출
POST /api/v1/tryouts/:id/submit

// 승인
POST /api/v1/tryouts/:id/approve
Body: { comment, use_as_mass_condition }

// 반려
POST /api/v1/tryouts/:id/reject
Body: { comment }
```

---

## 🎨 UI 특징

### 반응형 디자인
- 모바일/태블릿/PC 모두 대응
- Grid 레이아웃으로 자동 조정
- 작은 화면에서도 가독성 유지

### 상태 배지
```typescript
// 색상 구분
approved  → 초록색 (bg-emerald-50 text-emerald-600)
submitted → 노란색 (bg-amber-50 text-amber-600)
rejected  → 빨간색 (bg-rose-50 text-rose-600)
draft     → 회색 (bg-slate-100 text-slate-600)
```

### 버튼 표시 로직
```typescript
{/* 제작처/생산처 */}
{canEditRole && (
  <button onClick={handleSave} disabled={!editable}>저장</button>
  <button onClick={handleSubmit} disabled={!editable}>승인요청</button>
)}

{/* 본사 */}
{canApprove && (
  <button onClick={handleApprove}>승인</button>
  <button onClick={handleReject}>반려</button>
)}
```

---

## 🔄 사용 흐름

### 제작처/생산처 시나리오

```
1. QR 로그인 (제작처/생산처 계정)
   ↓
2. 금형 상세 페이지
   ↓
3. 상단 드롭다운 "금형개발 > 금형육성" 클릭
   ↓
4. TRY-OUT 페이지 진입
   ↓
5. 회차 선택 (T0, T1, T2, PPAP, MASS-001...)
   ↓
6. 기본 정보 입력
   - 시험일자, 사출기, 수지, 톤수, 캐비티, 샷중량, 싸이클
   ↓
7. 성형 조건 입력
   - 용융온도, 금형온도, 보압, 냉각시간 등
   ↓
8. 불량 기록 (있는 경우)
   - [+ 불량 추가] 클릭
   - 불량 유형, 심각도, 위치, 설명, 원인, 조치 계획 입력
   ↓
9. [저장] 클릭 (여러 번 가능, status = 'draft')
   ↓
10. [승인요청] 클릭 (status = 'submitted')
    ↓
11. 본사 승인 대기
```

### 본사 시나리오

```
1. 본사 대시보드
   ↓
2. "승인 대기 목록" 에서 TRY-OUT 확인
   ↓
3. TRY-OUT 상세 페이지 진입
   ↓
4. 내용 검토
   - 기본 정보 확인
   - 성형 조건 확인
   - 불량 기록 확인
   ↓
5-A. [승인하기] 클릭
     - "양산 기준 조건으로 사용?" 확인
     - 승인 코멘트 입력
     - status = 'approved'
     - use_as_mass_condition = true 시 금형사양에 자동 반영
     
5-B. [반려하기] 클릭
     - 반려 사유 입력 (필수)
     - status = 'rejected'
     - 제작처/생산처에 알림
```

---

## ✅ 테스트 체크리스트

### 제작처 (maker)
- [ ] QR 로그인 → 금형육성 메뉴 보임
- [ ] T0 회차 선택 → 새 TRY-OUT 생성
- [ ] 기본 정보 입력 가능
- [ ] 성형 조건 입력 가능
- [ ] 불량 추가/삭제 가능
- [ ] [저장] 클릭 → 성공
- [ ] [승인요청] 클릭 → status = 'submitted'
- [ ] submitted 상태에서 수정 불가
- [ ] rejected 상태에서 수정 가능

### 생산처 (production)
- [ ] QR 로그인 → 금형육성 메뉴 보임
- [ ] MASS-001 회차 선택 → 새 TRY-OUT 생성
- [ ] 기본 정보 입력 가능
- [ ] 성형 조건 입력 가능
- [ ] [저장] → [승인요청] 가능
- [ ] 다른 공장 금형은 403 에러

### 본사 (developer)
- [ ] TRY-OUT 상세 조회 가능
- [ ] 모든 필드 읽기 전용
- [ ] submitted 상태에서 [승인][반려] 버튼 보임
- [ ] [승인] 클릭 → 양산 기준 조건 선택 가능
- [ ] [승인] 클릭 → 코멘트 입력 → status = 'approved'
- [ ] [반려] 클릭 → 사유 입력 → status = 'rejected'

### 통합 테스트
- [ ] 제작처 T0 작성 → 제출 → 본사 승인
- [ ] 생산처 MASS-001 작성 → 제출 → 본사 승인
- [ ] 승인 시 양산 기준 조건 선택 → 금형사양 반영 확인
- [ ] 반려 시 반려 사유 표시 확인
- [ ] 회차 변경 시 데이터 자동 로드

---

## 🚀 다음 단계

### 1. 백엔드 API 구현
`TRYOUT_IMPLEMENTATION_GUIDE.md`의 Phase 2 참고
- Sequelize 모델 생성
- 컨트롤러 구현
- 라우트 등록

### 2. 라우트 등록
`client/src/App.jsx`에 라우트 추가

### 3. 메뉴 연결
`client/src/constants/moldMenus.ts` 수정

### 4. 테스트
위의 체크리스트 수행

---

**TRY-OUT 페이지 구현이 완료되었습니다!** 🎉

**이제 백엔드 API만 연결하면 바로 사용 가능합니다!** 💪
