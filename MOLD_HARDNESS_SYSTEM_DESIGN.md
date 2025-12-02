# 📏 금형 경도측정 시스템 설계

## 🎯 시스템 개요

**개발계획과 동일한 역할/승인 구조를 적용한 경도측정 시스템**

- 제작처(maker)가 경도측정 데이터 입력
- 본사(developer)가 승인/반려
- 생산처(production)는 기본적으로 접근 불가
- 승인 시 금형사양에 자동 반영

---

## 🔐 역할별 권한

| 역할 | 접근 | 작성/수정 | 승인/반려 | 비고 |
|------|------|----------|----------|------|
| **제작처(maker)** | ✅ | ✅ | ❌ | 자기 제작처의 금형만 |
| **본사(developer)** | ✅ | ❌ | ✅ | 승인/반려, 코멘트 입력 |
| **생산처(production)** | ❌ (옵션) | ❌ | ❌ | 기본 비공개, 필요 시 조회만 허용 |

---

## 📊 상태 플로우

```
draft (작성 중)
  ↓ [제출 및 승인요청]
submitted (승인 대기)
  ↓ [승인하기]        ↓ [반려하기]
approved (승인 완료)  rejected (반려됨)
                        ↓ [수정 후 재제출]
                      submitted
```

### 상태별 동작

| 상태 | 제작처 | 본사 |
|------|--------|------|
| `draft` | 작성/수정 가능, 저장/제출 버튼 | 조회만 |
| `submitted` | 읽기 전용 | 승인/반려 버튼 |
| `approved` | 읽기 전용 | 읽기 전용 |
| `rejected` | 수정 가능, 재제출 버튼 | 조회만 |

---

## 📊 데이터 구조

### 1️⃣ 테이블 구조

```
hardness_material_std (재질별 경도 기준 마스터)
  ↓
mold_hardness (경도측정 헤더)
  ├─ mold_hardness_measurements (측정값: 상측/하측 각 3포인트)
  └─ mold_hardness_history (변경 이력)
```

### 2️⃣ hardness_material_std (재질별 경도 기준)

**관리자만 수정 가능한 마스터 데이터**

| 컬럼 | 타입 | 설명 | 예시 |
|------|------|------|------|
| grade | TEXT | 재질 등급 | HP4A, NAK80, SKD61 |
| hardness_min | NUMERIC(4,1) | 최소 경도 (HRC) | 35.0 |
| hardness_max | NUMERIC(4,1) | 최대 경도 (HRC) | 41.0 |
| feature | TEXT | 특성, 비고 | 프리하든강 |

**샘플 데이터:**
- S45C: 20.0 ~ 25.0 HRC (일반 구조용 탄소강)
- HP4A: 35.0 ~ 41.0 HRC (프리하든강)
- NAK80: 37.0 ~ 43.0 HRC (프리하든 미러강)
- SKD61: 48.0 ~ 52.0 HRC (열간 금형용강)
- SKD11: 58.0 ~ 62.0 HRC (냉간 금형용강)

### 3️⃣ mold_hardness (경도측정 헤더)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| mold_id | INTEGER | 금형 ID |
| maker_id | INTEGER | 제작처 ID |
| status | VARCHAR(20) | draft/submitted/approved/rejected |
| material | TEXT | 재질 |
| mold_type | TEXT | 형별 |
| ms_spec | TEXT | MS SPEC |
| supply_type | TEXT | 공급 타입 (사출금형 등) |
| mold_number | TEXT | 금형 번호 (M-2024-001) |
| mold_name | TEXT | 금형명 |
| cavity_count | INTEGER | 캐비티 수 |
| tonnage | INTEGER | 톤수 |
| **cavity_material** | TEXT | 상측 재질 (선택값) |
| **cavity_std_id** | INTEGER | 상측 기준 ID |
| **cavity_image_url** | TEXT | 상측 사진 URL |
| **cavity_avg_hrc** | NUMERIC(4,1) | 상측 평균 HRC (자동 계산) |
| **core_material** | TEXT | 하측 재질 (선택값) |
| **core_std_id** | INTEGER | 하측 기준 ID |
| **core_image_url** | TEXT | 하측 사진 URL |
| **core_avg_hrc** | NUMERIC(4,1) | 하측 평균 HRC (자동 계산) |
| approval_comment | TEXT | 승인/반려 코멘트 |

### 4️⃣ mold_hardness_measurements (측정값)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| hardness_id | INTEGER | 경도측정 ID |
| position | VARCHAR(20) | 'cavity' or 'core' |
| measure_no | INTEGER | 1, 2, 3 (측정 #1~3) |
| value_hrc | NUMERIC(4,1) | HRC 값 |

**예시:**
```
hardness_id=1, position='cavity', measure_no=1, value_hrc=38.5
hardness_id=1, position='cavity', measure_no=2, value_hrc=39.0
hardness_id=1, position='cavity', measure_no=3, value_hrc=38.8
→ cavity_avg_hrc = 38.77 (자동 계산)
```

---

## 🔄 워크플로우

### 1️⃣ 제작처: 경도측정 입력

```
제작처 로그인
  ↓
금형 상세 → "금형개발 > 경도측정" 메뉴
  ↓
GET /api/v1/molds/:id/hardness
  - 기존 데이터 있으면 조회
  - 없으면 빈 폼 표시
  ↓
기본 정보 입력
  - 재질, 형별, MS SPEC, 금형 번호 등
  ↓
상측(Cavity) 정보 입력
  - 재질 선택 (콤보박스: HP4A, NAK80...)
  - 기준 자동 표시 (35.0~41.0 HRC)
  - 측정값 3포인트 입력
  - 평균 HRC 자동 계산
  - 사진 업로드
  ↓
하측(Core) 정보 입력
  - 동일한 방식
  ↓
[저장] → POST /api/v1/molds/:id/hardness
  - status = 'draft' 유지
  ↓
[제출 및 승인요청] → POST /api/v1/molds/:id/hardness/submit
  - 필수 필드 검증
  - status = 'submitted'
  - 본사에 알림
```

### 2️⃣ 본사: 승인/반려

```
본사 로그인
  ↓
승인 대기 목록
  GET /api/v1/hardness/pending
  ↓
경도측정 상세 확인
  - 측정값 확인
  - 평균 HRC vs 기준 범위 비교
  - OK/NG 자동 판정
  ↓
[승인하기]
  POST /api/v1/molds/:id/hardness/approve
  - 평균 HRC가 기준 범위 내인지 확인
  - 범위 밖이면 경고 (그래도 승인 가능)
  - status = 'approved'
  - 금형사양에 경도 값 자동 반영
  ↓
[반려하기]
  POST /api/v1/molds/:id/hardness/reject
  - 반려 사유 입력 (필수)
  - status = 'rejected'
  - 제작처에 알림
```

### 3️⃣ 금형사양 자동 반영

```
경도측정 승인 시
  ↓
UPDATE mold_spec
SET 
  cavity_hardness = cavity_avg_hrc,
  core_hardness = core_avg_hrc
WHERE mold_id = :moldId
```

---

## 🔌 API 엔드포인트

### 조회 (제작처 + 본사)

```
GET /api/v1/molds/:moldId/hardness
  - 금형의 경도측정 데이터 조회
  - 권한: maker (자기 것만), developer (전체)
  
GET /api/v1/hardness/pending
  - 승인 대기 목록
  - 권한: developer
  
GET /api/v1/hardness/material-standards
  - 재질별 경도 기준 마스터 조회
  - 권한: maker, developer
```

### 작성/수정 (제작처)

```
POST /api/v1/molds/:moldId/hardness
  - 경도측정 생성/수정
  - 권한: maker
  - 조건: status = 'draft' or 'rejected'
  
Body:
{
  "material": "HP4A",
  "mold_type": "사출금형",
  "cavity_material": "HP4A",
  "cavity_std_id": 4,
  "core_material": "NAK80",
  "core_std_id": 6,
  "measurements": [
    { "position": "cavity", "measure_no": 1, "value_hrc": 38.5 },
    { "position": "cavity", "measure_no": 2, "value_hrc": 39.0 },
    { "position": "cavity", "measure_no": 3, "value_hrc": 38.8 },
    { "position": "core", "measure_no": 1, "value_hrc": 40.2 },
    { "position": "core", "measure_no": 2, "value_hrc": 40.5 },
    { "position": "core", "measure_no": 3, "value_hrc": 40.0 }
  ]
}
```

### 제출 (제작처)

```
POST /api/v1/molds/:moldId/hardness/submit
  - 승인 요청
  - 권한: maker
  - 조건: status = 'draft' or 'rejected'
  - 검증:
    - 필수 필드 입력 여부
    - 측정값 3포인트 모두 입력
    - 사진 업로드 여부
```

### 승인/반려 (본사)

```
POST /api/v1/molds/:moldId/hardness/approve
  - 승인
  - 권한: developer
  - 조건: status = 'submitted'
  - 동작:
    - status = 'approved'
    - 금형사양에 경도 값 반영
    - 알림 발송
  
Body:
{
  "comment": "승인합니다."
}

POST /api/v1/molds/:moldId/hardness/reject
  - 반려
  - 권한: developer
  - 조건: status = 'submitted'
  - 동작:
    - status = 'rejected'
    - 반려 사유 저장
    - 알림 발송
  
Body:
{
  "comment": "측정값이 기준 범위를 벗어났습니다. 재측정 바랍니다."
}
```

---

## 🎨 UI 구성

### 1️⃣ 제작처 화면 (작성 모드)

```
┌─────────────────────────────────────────────────┐
│ 📏 경도측정                                      │
│ [저장] [제출 및 승인요청]                        │
├─────────────────────────────────────────────────┤
│ 기본 정보                                        │
│  재질: [HP4A ▼]  형별: [사출금형 ▼]            │
│  MS SPEC: [MS-001]  금형번호: [M-2024-001]     │
│  금형명: [범퍼 금형]  캐비티: [2]  톤수: [350] │
├─────────────────────────────────────────────────┤
│ 상측 (Cavity)                                   │
│  재질: [HP4A ▼]  기준: 35.0 ~ 41.0 HRC         │
│  ┌───────────────────────────────────┐         │
│  │ 측정 #1: [38.5] HRC               │         │
│  │ 측정 #2: [39.0] HRC               │         │
│  │ 측정 #3: [38.8] HRC               │         │
│  │ 평균: 38.77 HRC ✅ OK              │         │
│  └───────────────────────────────────┘         │
│  사진: [📷 업로드] cavity_photo.jpg            │
├─────────────────────────────────────────────────┤
│ 하측 (Core)                                     │
│  재질: [NAK80 ▼]  기준: 37.0 ~ 43.0 HRC       │
│  ┌───────────────────────────────────┐         │
│  │ 측정 #1: [40.2] HRC               │         │
│  │ 측정 #2: [40.5] HRC               │         │
│  │ 측정 #3: [40.0] HRC               │         │
│  │ 평균: 40.23 HRC ✅ OK              │         │
│  └───────────────────────────────────┘         │
│  사진: [📷 업로드] core_photo.jpg              │
├─────────────────────────────────────────────────┤
│ 측정 결과 요약                                   │
│  ✅ 상측: 38.77 HRC (기준: 35.0~41.0) OK       │
│  ✅ 하측: 40.23 HRC (기준: 37.0~43.0) OK       │
└─────────────────────────────────────────────────┘
```

### 2️⃣ 본사 화면 (승인 모드)

```
┌─────────────────────────────────────────────────┐
│ 📏 경도측정 (승인 대기)                          │
│ [승인하기] [반려하기]                            │
├─────────────────────────────────────────────────┤
│ 기본 정보 (읽기 전용)                            │
│  재질: HP4A  형별: 사출금형                     │
│  금형번호: M-2024-001  금형명: 범퍼 금형        │
├─────────────────────────────────────────────────┤
│ 상측 (Cavity)                                   │
│  재질: HP4A  기준: 35.0 ~ 41.0 HRC             │
│  측정값: 38.5, 39.0, 38.8 HRC                  │
│  평균: 38.77 HRC ✅ OK                          │
│  [사진 보기]                                    │
├─────────────────────────────────────────────────┤
│ 하측 (Core)                                     │
│  재질: NAK80  기준: 37.0 ~ 43.0 HRC            │
│  측정값: 40.2, 40.5, 40.0 HRC                  │
│  평균: 40.23 HRC ✅ OK                          │
│  [사진 보기]                                    │
├─────────────────────────────────────────────────┤
│ 종합 판정                                        │
│  ✅ 모든 측정값이 기준 범위 내에 있습니다.       │
│  승인 시 금형사양에 자동 반영됩니다.             │
└─────────────────────────────────────────────────┘
```

### 3️⃣ NG 케이스 (범위 밖)

```
┌─────────────────────────────────────────────────┐
│ 측정 결과 요약                                   │
│  ❌ 상측: 29.5 HRC (기준: 35.0~41.0) NG        │
│     → 기준보다 5.5 HRC 낮습니다.                │
│  ✅ 하측: 40.23 HRC (기준: 37.0~43.0) OK       │
│                                                  │
│  ⚠️ NG 항목이 있습니다. 재측정이 필요합니다.    │
└─────────────────────────────────────────────────┘
```

---

## 💻 프론트엔드 로직

### 1️⃣ 제작처 화면

```typescript
const isMaker = role === 'maker';
const editable = isMaker && (data.status === 'draft' || data.status === 'rejected');

// 평균 HRC 자동 계산
const calculateAvg = (position: 'cavity' | 'core') => {
  const measurements = data.measurements.filter(m => m.position === position);
  const sum = measurements.reduce((acc, m) => acc + m.value_hrc, 0);
  return (sum / measurements.length).toFixed(2);
};

// OK/NG 판정
const checkResult = (avgHrc: number, min: number, max: number) => {
  if (avgHrc >= min && avgHrc <= max) {
    return { status: 'OK', color: 'green' };
  } else {
    return { status: 'NG', color: 'red', diff: avgHrc < min ? min - avgHrc : avgHrc - max };
  }
};

// 저장
const handleSave = async () => {
  await api.post(`/api/v1/molds/${moldId}/hardness`, data);
  toast.success('저장되었습니다.');
};

// 제출
const handleSubmit = async () => {
  // 필수 필드 검증
  if (!data.cavity_material || !data.core_material) {
    toast.error('재질을 선택해주세요.');
    return;
  }
  
  const cavityMeasurements = data.measurements.filter(m => m.position === 'cavity');
  if (cavityMeasurements.length !== 3) {
    toast.error('상측 측정값 3개를 모두 입력해주세요.');
    return;
  }
  
  await api.post(`/api/v1/molds/${moldId}/hardness/submit`);
  toast.success('승인 요청되었습니다.');
  navigate('/dashboard/maker');
};
```

### 2️⃣ 본사 화면

```typescript
const isDeveloper = role === 'developer';

// 승인
const handleApprove = async () => {
  // 범위 밖 경고
  const cavityResult = checkResult(data.cavity_avg_hrc, cavityStd.min, cavityStd.max);
  const coreResult = checkResult(data.core_avg_hrc, coreStd.min, coreStd.max);
  
  if (cavityResult.status === 'NG' || coreResult.status === 'NG') {
    const confirmed = confirm(
      '측정값이 기준 범위를 벗어났습니다. 그래도 승인하시겠습니까?'
    );
    if (!confirmed) return;
  }
  
  const comment = prompt('승인 코멘트를 입력하세요.');
  await api.post(`/api/v1/molds/${moldId}/hardness/approve`, { comment });
  toast.success('승인되었습니다.');
};

// 반려
const handleReject = async () => {
  const comment = prompt('반려 사유를 입력하세요. (필수)');
  if (!comment) {
    toast.error('반려 사유를 입력해주세요.');
    return;
  }
  
  await api.post(`/api/v1/molds/${moldId}/hardness/reject`, { comment });
  toast.success('반려되었습니다.');
};
```

---

## 🔗 다른 모듈과의 연계

### 1️⃣ 개발계획 연동

```javascript
// 경도측정 제출 시 개발계획 승인 여부 확인
const handleSubmit = async () => {
  const devPlan = await api.get(`/api/v1/molds/${moldId}/dev-plan`);
  
  if (devPlan.status !== 'approved') {
    toast.error('개발계획이 승인된 후 경도측정을 제출할 수 있습니다.');
    return;
  }
  
  await api.post(`/api/v1/molds/${moldId}/hardness/submit`);
};
```

### 2️⃣ 금형사양 자동 반영

```javascript
// 백엔드: 경도측정 승인 시
const approve = async (req, res) => {
  const hardness = await MoldHardness.findByPk(req.params.id);
  
  // 승인 처리
  hardness.status = 'approved';
  hardness.approved_by = req.user.id;
  hardness.approved_at = new Date();
  await hardness.save();
  
  // 금형사양에 반영
  await MoldSpec.update(
    {
      cavity_hardness: hardness.cavity_avg_hrc,
      core_hardness: hardness.core_avg_hrc
    },
    { where: { mold_id: hardness.mold_id } }
  );
  
  res.json({ success: true });
};
```

### 3️⃣ 개발 단계 품질 데이터 흐름

```
개발계획 (mold_dev_plan)
  ↓ 승인
금형 체크리스트 (checklist_instances)
  ↓ 승인
경도측정 (mold_hardness)
  ↓ 승인
금형사양 확정 (mold_spec)
  ↓
양산 시작
```

---

## 🚀 구현 단계

### Phase 1: DB 및 백엔드 기초 ✅
- [x] 마이그레이션 파일 생성
- [x] 재질별 경도 기준 마스터 데이터
- [x] 평균 HRC 자동 계산 트리거
- [x] OK/NG 판정 뷰
- [ ] Sequelize 모델
- [ ] 기본 CRUD API

### Phase 2: 제작처 화면
- [ ] 경도측정 입력 폼
- [ ] 재질 선택 → 기준 자동 표시
- [ ] 측정값 입력 → 평균 자동 계산
- [ ] OK/NG 실시간 판정
- [ ] 사진 업로드
- [ ] 저장/제출 기능

### Phase 3: 본사 화면
- [ ] 승인 대기 목록
- [ ] 경도측정 상세 조회
- [ ] 승인/반려 처리
- [ ] 범위 밖 경고

### Phase 4: 연계 기능
- [ ] 개발계획 승인 여부 확인
- [ ] 금형사양 자동 반영
- [ ] 알림 시스템 연동

### Phase 5: 통계 및 대시보드
- [ ] 경도측정 완료율
- [ ] NG 항목 집계
- [ ] 재질별 통계

---

## 📝 핵심 기능 요약

### 1️⃣ 자동 계산
- 측정값 3포인트 입력 → 평균 HRC 자동 계산 (트리거)
- 평균 HRC vs 기준 범위 → OK/NG 자동 판정 (뷰)

### 2️⃣ 역할 기반 UI
- 제작처: draft/rejected 상태에서만 수정 가능
- 본사: submitted 상태에서만 승인/반려 가능
- 생산처: 기본 접근 불가

### 3️⃣ 승인 워크플로우
- 제출 → 승인 대기 → 승인/반려
- 반려 시 수정 후 재제출 가능
- 승인 시 금형사양에 자동 반영

### 4️⃣ 데이터 품질 관리
- 필수 필드 검증
- 측정값 3포인트 필수
- 기준 범위 벗어나면 경고

---

**이 시스템이 완성되면 개발계획 → 체크리스트 → 경도측정 → 금형사양 확정까지 한 줄로 이어지는 개발 단계 품질 데이터 흐름이 완성됩니다!** 🎉
