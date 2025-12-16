# 📊 금형육성(TRY-OUT) 시스템 설계

## 🎯 시스템 개요

**개발계획과 동일한 승인 구조를 적용한 TRY-OUT 관리 시스템**

- 제작처/생산처가 TRY-OUT 조건 및 결과 기록
- 본사(developer)가 승인/반려
- 회차별 관리 (T0, T1, T2, PPAP, MASS-001...)
- 성형 조건, 품질 평가, 불량 기록, 사진 첨부
- 승인된 조건을 양산 기준으로 자동 반영

---

## 🔐 역할별 권한 (수정됨)

| 역할 | 접근 | 작성/수정 | 승인/반려 | 비고 |
|------|------|----------|----------|------|
| **제작처(maker)** | ✅ | ✅ | ❌ | 개발 단계 TRY-OUT (T0~PPAP) |
| **본사(developer)** | ✅ | ❌ | ✅ | 전체 조회, 승인/반려 |
| **생산처(production)** | ✅ | ✅ | ❌ | **양산 단계 TRY-OUT (MASS-001~)** |

### 권한 변경 사항
- **생산처에 작성/수정 권한 부여**
- 생산처는 양산 중 조건 최적화를 위한 TRY-OUT 수행 가능
- 개발 단계(T0~PPAP): 제작처 작성
- 양산 단계(MASS-001~): 생산처 작성

---

## 📊 상태 플로우

```
draft (작성 중)
  ↓ [제출 및 승인요청]
submitted (승인 대기)
  ↓ [승인하기]        ↓ [반려하기]
approved (승인 완료)  rejected (반려됨)
  ↓                    ↓ [수정 후 재제출]
양산 기준 조건 반영   submitted
```

---

## 📊 데이터 구조

### 1️⃣ 테이블 구조

```
mold_tryout (TRY-OUT 헤더)
  ├─ mold_tryout_conditions (성형 조건)
  ├─ mold_tryout_defects (품질 평가/불량 기록)
  ├─ mold_tryout_files (사진/파일 첨부)
  └─ mold_tryout_history (변경 이력)
```

### 2️⃣ mold_tryout (TRY-OUT 헤더)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| mold_id | INTEGER | 금형 ID |
| maker_id | INTEGER | 제작처 ID (개발 단계) |
| plant_id | INTEGER | 생산처 ID (양산 단계) |
| trial_no | VARCHAR(20) | 회차 (T0, T1, T2, PPAP, MASS-001) |
| trial_date | DATE | 시험 일자 |
| status | VARCHAR(20) | draft/submitted/approved/rejected |
| **machine_name** | TEXT | 사용 사출기 |
| **tonnage** | INTEGER | 톤수 |
| **resin** | TEXT | 사용 수지 |
| **resin_maker** | TEXT | 수지 제조사 |
| **color** | TEXT | 색상 |
| **cavity_used** | INTEGER | 사용 캐비티 수 |
| **shot_weight_g** | NUMERIC(8,2) | 샷 중량 (g) |
| **cycle_sec** | NUMERIC(6,2) | 싸이클 타임 (초) |
| **overall_quality** | VARCHAR(20) | OK/NG/CONDITIONAL |
| **is_mass_ready** | BOOLEAN | 양산 준비 완료 여부 |
| **use_as_mass_condition** | BOOLEAN | 양산 기준 조건으로 사용 |
| comment | TEXT | 종합 코멘트 |
| approval_comment | TEXT | 승인/반려 코멘트 |

### 3️⃣ mold_tryout_conditions (성형 조건)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| tryout_id | INTEGER | TRY-OUT ID |
| category | VARCHAR(50) | temperature/pressure/speed/time |
| name | TEXT | 조건명 (용융온도, 금형온도, 보압...) |
| value | TEXT | 설정값 |
| unit | TEXT | 단위 (℃, bar, sec, mm/s) |
| target_value | TEXT | 목표값 |
| tolerance | TEXT | 허용 오차 |
| is_critical | BOOLEAN | 중요 조건 여부 |
| order_index | INTEGER | 표시 순서 |

**카테고리별 조건:**

| Category | 조건 예시 | 단위 |
|----------|----------|------|
| temperature | 용융온도, 실린더온도, 금형온도 | ℃ |
| pressure | 사출압력, 보압, 배압 | bar |
| speed | 사출속도, 스크류 회전수 | mm/s, rpm |
| time | 사출시간, 보압시간, 냉각시간 | sec |

### 4️⃣ mold_tryout_defects (품질 평가/불량 기록)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| tryout_id | INTEGER | TRY-OUT ID |
| defect_type | VARCHAR(50) | sink/warp/weld/short/burr/flash/burn |
| severity | VARCHAR(20) | none/minor/major/critical |
| location | TEXT | 불량 위치 |
| description | TEXT | 상세 내용 |
| cause_analysis | TEXT | 원인 분석 |
| action_plan | TEXT | 개선 대책 |
| is_resolved | BOOLEAN | 해결 여부 |
| resolved_at | TIMESTAMP | 해결 일시 |

**불량 타입:**
- `sink`: 싱크마크 (수축)
- `warp`: 변형 (휨)
- `weld`: 웰드라인 (접합선)
- `short`: 미성형 (쇼트샷)
- `burr`: 버 (플래시)
- `flash`: 플래시 (빠리)
- `burn`: 탄화 (번)

### 5️⃣ mold_tryout_files (사진/파일 첨부)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| tryout_id | INTEGER | TRY-OUT ID |
| file_url | TEXT | 파일 URL |
| file_type | VARCHAR(50) | part_photo/mold_photo/report/analysis |
| file_name | TEXT | 파일명 |
| file_size | INTEGER | 파일 크기 (bytes) |
| description | TEXT | 설명 |

---

## 🔄 워크플로우

### 1️⃣ 제작처/생산처: TRY-OUT 기록

```
제작처/생산처 로그인
  ↓
금형 상세 → "금형개발 > 금형육성" 메뉴
  ↓
GET /api/v1/molds/:id/tryouts
  - 기존 TRY-OUT 히스토리 조회
  ↓
[+ 새 TRY-OUT 추가] 클릭
  ↓
회차 선택 (T0, T1, T2, PPAP, MASS-001...)
  ↓
기본 정보 입력
  - 시험 일자, 사출기, 수지, 색상
  - 캐비티 수, 샷 중량, 싸이클 타임
  ↓
탭 1: 성형 조건 입력
  - 온도 (용융, 실린더, 금형)
  - 압력 (사출, 보압, 배압)
  - 속도 (사출속도, 스크류)
  - 시간 (사출, 보압, 냉각)
  ↓
탭 2: 품질 평가
  - 불량 타입별 평가 (없음/경미/심각/치명적)
  - 불량 위치, 원인 분석, 개선 대책
  ↓
탭 3: 사진/리포트 첨부
  - 제품 사진, 금형 사진
  - 분석 리포트 PDF
  ↓
[저장] → POST /api/v1/molds/:id/tryouts
  - status = 'draft' 유지
  ↓
[제출 및 승인요청] → POST /api/v1/tryouts/:id/submit
  - 필수 필드 검증
  - status = 'submitted'
  - 본사에 알림
```

### 2️⃣ 본사: 승인/반려

```
본사 로그인
  ↓
승인 대기 목록
  GET /api/v1/tryouts/pending
  ↓
TRY-OUT 상세 확인
  - 성형 조건 검토
  - 품질 평가 확인
  - 불량 항목 확인
  - 사진/리포트 확인
  ↓
[승인하기]
  POST /api/v1/tryouts/:id/approve
  - 양산 기준 조건으로 사용 여부 선택
  - status = 'approved'
  - use_as_mass_condition = true 시
    → 금형사양에 성형 조건 자동 반영
  ↓
[반려하기]
  POST /api/v1/tryouts/:id/reject
  - 반려 사유 입력 (필수)
  - status = 'rejected'
  - 제작처/생산처에 알림
```

---

## 🔌 API 엔드포인트

### 조회 (전체 역할)

```
GET /api/v1/molds/:moldId/tryouts
  - 금형의 TRY-OUT 히스토리 조회
  - 권한: maker, developer, production
  - 응답: 회차별 TRY-OUT 목록 (T0, T1, T2...)
  
GET /api/v1/tryouts/:id
  - TRY-OUT 상세 조회
  - 권한: maker, developer, production
  - 응답: 헤더 + 성형조건 + 불량기록 + 파일
```

### 작성/수정 (제작처/생산처)

```
POST /api/v1/molds/:moldId/tryouts
  - TRY-OUT 생성/수정
  - 권한: maker, production
  - 조건: status = 'draft' or 'rejected'
  
Body:
{
  "trial_no": "T0",
  "trial_date": "2024-12-02",
  "machine_name": "LS350",
  "tonnage": 350,
  "resin": "PP",
  "resin_maker": "LG화학",
  "color": "Black",
  "cavity_used": 2,
  "shot_weight_g": 450.5,
  "cycle_sec": 35.2,
  "conditions": [
    {
      "category": "temperature",
      "name": "용융온도",
      "value": "230",
      "unit": "℃"
    },
    {
      "category": "pressure",
      "name": "사출압력",
      "value": "800",
      "unit": "bar"
    }
  ],
  "defects": [
    {
      "defect_type": "sink",
      "severity": "minor",
      "location": "상단 모서리",
      "description": "경미한 싱크마크 발생",
      "action_plan": "보압 증가 필요"
    }
  ]
}
```

### 제출 (제작처/생산처)

```
POST /api/v1/tryouts/:id/submit
  - 승인 요청
  - 권한: maker, production
  - 조건: status = 'draft' or 'rejected'
  - 검증:
    - 필수 필드 입력 여부
    - 성형 조건 입력 여부
    - 품질 평가 입력 여부
```

### 승인/반려 (본사)

```
POST /api/v1/tryouts/:id/approve
  - 승인
  - 권한: developer
  - 조건: status = 'submitted'
  
Body:
{
  "comment": "승인합니다. 양산 조건으로 사용하세요.",
  "use_as_mass_condition": true
}

POST /api/v1/tryouts/:id/reject
  - 반려
  - 권한: developer
  - 조건: status = 'submitted'
  
Body:
{
  "comment": "싱크마크 개선 후 재제출 바랍니다."
}
```

---

## 🎨 UI 구성

### 1️⃣ TRY-OUT 히스토리 (목록)

```
┌─────────────────────────────────────────────────┐
│ 📊 금형육성(TRY-OUT) 히스토리                    │
│ [+ 새 TRY-OUT 추가]                             │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐    │
│ │ T0 (2024-11-15) ✅ 승인됨               │    │
│ │ 사출기: LS350 | 수지: PP | 싸이클: 35.2s│    │
│ │ 불량: 0건 | 양산 기준 조건 ⭐           │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
│ ┌─────────────────────────────────────────┐    │
│ │ T1 (2024-11-20) 🟡 승인 대기           │    │
│ │ 사출기: LS350 | 수지: PP | 싸이클: 33.5s│    │
│ │ 불량: 2건 (경미 1, 심각 1)              │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
│ ┌─────────────────────────────────────────┐    │
│ │ T2 (2024-11-25) ❌ 반려됨               │    │
│ │ 반려 사유: 싱크마크 개선 필요           │    │
│ └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### 2️⃣ TRY-OUT 상세 (제작처/생산처 작성 모드)

```
┌─────────────────────────────────────────────────┐
│ 📊 TRY-OUT: T1                                  │
│ [저장] [제출 및 승인요청]                        │
├─────────────────────────────────────────────────┤
│ 기본 정보                                        │
│  회차: [T1 ▼]  시험일: [2024-12-02]           │
│  사출기: [LS350]  톤수: [350]                  │
│  수지: [PP ▼]  제조사: [LG화학]               │
│  색상: [Black]  캐비티: [2]                    │
│  샷중량: [450.5g]  싸이클: [35.2s]             │
├─────────────────────────────────────────────────┤
│ 탭: [성형조건] [품질평가] [사진/리포트]         │
├─────────────────────────────────────────────────┤
│ 📌 성형 조건                                     │
│                                                  │
│ 온도 (Temperature)                              │
│ ┌───────────────────────────────────────┐      │
│ │ 항목          │ 설정값  │ 단위 │ 중요 │      │
│ ├───────────────────────────────────────┤      │
│ │ 용융온도      │ [230]  │ ℃   │ [✓] │      │
│ │ 실린더온도 1구│ [220]  │ ℃   │ [ ] │      │
│ │ 금형온도(고정)│ [60]   │ ℃   │ [✓] │      │
│ └───────────────────────────────────────┘      │
│                                                  │
│ 압력 (Pressure)                                 │
│ ┌───────────────────────────────────────┐      │
│ │ 사출압력      │ [800]  │ bar  │ [✓] │      │
│ │ 보압 1단      │ [600]  │ bar  │ [✓] │      │
│ │ 배압          │ [50]   │ bar  │ [ ] │      │
│ └───────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

### 3️⃣ 품질 평가 탭

```
┌─────────────────────────────────────────────────┐
│ 📌 품질 평가 / 불량 기록                         │
│ [+ 불량 항목 추가]                              │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐    │
│ │ 싱크마크 (Sink) - 경미 🟡               │    │
│ │ 위치: 상단 모서리                        │    │
│ │ 원인: 냉각 불균형                        │    │
│ │ 대책: 보압 증가 (600→650bar)            │    │
│ │ 상태: ⚠️ 미해결                          │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
│ ┌─────────────────────────────────────────┐    │
│ │ 웰드라인 (Weld) - 심각 🔴               │    │
│ │ 위치: 중앙부                             │    │
│ │ 원인: 게이트 위치 부적절                 │    │
│ │ 대책: 게이트 위치 변경 필요              │    │
│ │ 상태: ⚠️ 미해결                          │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
│ 종합 평가: [NG ▼]                               │
│ 양산 준비: [아니오 ▼]                           │
└─────────────────────────────────────────────────┘
```

### 4️⃣ 본사 승인 화면

```
┌─────────────────────────────────────────────────┐
│ 📊 TRY-OUT: T1 (승인 대기)                      │
│ [승인하기] [반려하기]                            │
├─────────────────────────────────────────────────┤
│ 기본 정보 (읽기 전용)                            │
│  회차: T1  시험일: 2024-12-02                  │
│  사출기: LS350 (350톤)                         │
│  수지: PP (LG화학) Black                       │
│  샷중량: 450.5g  싸이클: 35.2s                 │
├─────────────────────────────────────────────────┤
│ 성형 조건 요약                                   │
│  용융온도: 230℃  금형온도: 60℃                │
│  사출압력: 800bar  보압: 600bar                │
│  냉각시간: 25s                                  │
├─────────────────────────────────────────────────┤
│ 품질 평가                                        │
│  ⚠️ 불량 2건 (경미 1, 심각 1)                  │
│  - 싱크마크 (경미): 보압 증가 계획              │
│  - 웰드라인 (심각): 게이트 위치 변경 필요       │
│                                                  │
│  종합 평가: NG                                  │
│  양산 준비: 아니오                              │
├─────────────────────────────────────────────────┤
│ 승인 옵션                                        │
│  [✓] 양산 기준 조건으로 사용                    │
│      (금형사양에 성형 조건 자동 반영)           │
└─────────────────────────────────────────────────┘
```

---

## 💻 프론트엔드 로직

### 1️⃣ 제작처/생산처 화면

```typescript
const isMaker = role === 'maker';
const isProduction = role === 'production';
const editable = (isMaker || isProduction) && 
                 (data.status === 'draft' || data.status === 'rejected');

// 저장
const handleSave = async () => {
  await api.post(`/api/v1/molds/${moldId}/tryouts`, {
    ...data,
    conditions: conditions,
    defects: defects
  });
  toast.success('저장되었습니다.');
};

// 제출
const handleSubmit = async () => {
  // 필수 필드 검증
  if (!data.trial_no || !data.trial_date) {
    toast.error('회차와 시험일을 입력해주세요.');
    return;
  }
  
  if (conditions.length === 0) {
    toast.error('성형 조건을 입력해주세요.');
    return;
  }
  
  await api.post(`/api/v1/tryouts/${data.id}/submit`);
  toast.success('승인 요청되었습니다.');
  navigate('/dashboard');
};

// 불량 심각도별 색상
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'red';
    case 'major': return 'orange';
    case 'minor': return 'yellow';
    default: return 'gray';
  }
};
```

### 2️⃣ 본사 화면

```typescript
const isDeveloper = role === 'developer';

// 승인
const handleApprove = async () => {
  const useAsMass = confirm(
    '이 조건을 양산 기준 조건으로 사용하시겠습니까?\n' +
    '(금형사양에 성형 조건이 자동 반영됩니다)'
  );
  
  const comment = prompt('승인 코멘트를 입력하세요.');
  
  await api.post(`/api/v1/tryouts/${data.id}/approve`, {
    comment,
    use_as_mass_condition: useAsMass
  });
  
  toast.success('승인되었습니다.');
};

// 반려
const handleReject = async () => {
  const comment = prompt('반려 사유를 입력하세요. (필수)');
  if (!comment) {
    toast.error('반려 사유를 입력해주세요.');
    return;
  }
  
  await api.post(`/api/v1/tryouts/${data.id}/reject`, { comment });
  toast.success('반려되었습니다.');
};
```

---

## 🔗 다른 모듈과의 연계

### 1️⃣ 개발계획 연동

```javascript
// TRY-OUT 제출 시 경도측정 승인 확인
const handleSubmit = async () => {
  const hardness = await api.get(`/api/v1/molds/${moldId}/hardness`);
  
  if (hardness.status !== 'approved') {
    toast.error('경도측정이 승인된 후 TRY-OUT을 제출할 수 있습니다.');
    return;
  }
  
  await api.post(`/api/v1/tryouts/${data.id}/submit`);
};

// 대시보드: 개발계획 vs 실제 TRY-OUT 진척률
const devPlan = await api.get(`/api/v1/molds/${moldId}/dev-plan`);
const tryouts = await api.get(`/api/v1/molds/${moldId}/tryouts`);

const timeline = {
  T0: {
    planned: devPlan.t0_target_date,
    actual: tryouts.find(t => t.trial_no === 'T0')?.trial_date,
    status: tryouts.find(t => t.trial_no === 'T0')?.status
  },
  T1: {
    planned: devPlan.t1_target_date,
    actual: tryouts.find(t => t.trial_no === 'T1')?.trial_date,
    status: tryouts.find(t => t.trial_no === 'T1')?.status
  }
};
```

### 2️⃣ 금형 체크리스트 연동

```javascript
// TRY-OUT 화면에서 체크리스트 NG 항목 표시
const checklist = await api.get(`/api/v1/molds/${moldId}/checklist/latest`);
const ngItems = checklist.answers.filter(a => a.is_ng);

if (ngItems.length > 0) {
  // 경고 메시지 표시
  toast.warning(
    `체크리스트에서 ${ngItems.length}개 NG 항목이 있습니다.\n` +
    `TRY-OUT 시 주의하세요: ${ngItems.map(i => i.question.label).join(', ')}`
  );
}
```

### 3️⃣ 금형사양 자동 반영

```javascript
// 백엔드: TRY-OUT 승인 시
const approve = async (req, res) => {
  const tryout = await MoldTryout.findByPk(req.params.id, {
    include: [{ model: MoldTryoutCondition }]
  });
  
  // 승인 처리
  tryout.status = 'approved';
  tryout.approved_by = req.user.id;
  tryout.approved_at = new Date();
  await tryout.save();
  
  // 양산 기준 조건으로 사용 시
  if (req.body.use_as_mass_condition) {
    const moldSpec = await MoldSpec.findOne({ 
      where: { mold_id: tryout.mold_id } 
    });
    
    // 성형 조건을 JSON으로 저장
    moldSpec.recommended_conditions = {
      trial_no: tryout.trial_no,
      machine: tryout.machine_name,
      resin: tryout.resin,
      cycle_sec: tryout.cycle_sec,
      conditions: tryout.conditions.map(c => ({
        category: c.category,
        name: c.name,
        value: c.value,
        unit: c.unit
      }))
    };
    
    await moldSpec.save();
  }
  
  res.json({ success: true });
};
```

### 4️⃣ 생산처 QR 로그인 → 추천 조건 조회

```javascript
// 생산처: QR 로그인 → 금형 상세 → 추천 조건
const moldSpec = await api.get(`/api/v1/molds/${moldId}/spec`);

if (moldSpec.recommended_conditions) {
  // 추천 조건 표시
  const conditions = moldSpec.recommended_conditions;
  
  return (
    <div className="recommended-conditions">
      <h3>추천 성형 조건 (기준: {conditions.trial_no})</h3>
      <p>사출기: {conditions.machine}</p>
      <p>수지: {conditions.resin}</p>
      <p>싸이클: {conditions.cycle_sec}초</p>
      
      <table>
        {conditions.conditions.map(c => (
          <tr key={c.name}>
            <td>{c.name}</td>
            <td>{c.value} {c.unit}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

---

## 📈 개발 단계 전체 흐름

```
1. 개발계획 (mold_dev_plan)
   - 제작처 작성 → 본사 승인
   - T0/T1/T2 목표일 설정
   ↓
2. 금형 체크리스트 (checklist_instances)
   - 제작처 작성 → 본사 승인
   - NG 항목 → 수리요청 자동 생성
   ↓
3. 경도측정 (mold_hardness)
   - 제작처 측정 → 본사 승인
   - 경도 값 → 금형사양 반영
   ↓
4. 금형육성 (mold_tryout)
   - 제작처 TRY-OUT → 본사 승인
   - 성형 조건 → 금형사양 반영
   ↓
5. 금형사양 확정 (mold_spec)
   - 모든 단계 승인 완료
   - 양산 준비 완료
   ↓
6. 양산 시작
   - 생산처 QR 로그인
   - 추천 조건 조회
   - 양산 TRY-OUT 수행 (MASS-001~)
```

---

## 🚀 구현 단계

### Phase 1: DB 및 백엔드 기초 ✅
- [x] 마이그레이션 파일 생성
- [x] 성형 조건 템플릿 데이터
- [x] 불량 집계 뷰
- [ ] Sequelize 모델
- [ ] CRUD API

### Phase 2: 제작처/생산처 화면
- [ ] TRY-OUT 히스토리 목록
- [ ] TRY-OUT 상세 입력 폼
- [ ] 성형 조건 입력 (카테고리별)
- [ ] 품질 평가 / 불량 기록
- [ ] 사진/리포트 첨부
- [ ] 저장/제출

### Phase 3: 본사 화면
- [ ] 승인 대기 목록
- [ ] TRY-OUT 상세 조회
- [ ] 승인/반려 처리
- [ ] 양산 기준 조건 선택

### Phase 4: 연계 기능
- [ ] 개발계획 vs 실제 진척률
- [ ] 체크리스트 NG 항목 연동
- [ ] 경도측정 선행 조건 확인
- [ ] 금형사양 자동 반영

### Phase 5: 대시보드
- [ ] 개발진행률 타임라인
- [ ] TRY-OUT 회차별 상태
- [ ] 불량 항목 집계
- [ ] 양산 준비도 평가

---

**이 시스템이 완성되면 개발계획 → 체크리스트 → 경도측정 → TRY-OUT → 금형사양 확정 → 양산까지 완전한 개발 단계 품질 데이터 흐름이 완성됩니다!** 🎉
