# 📋 금형사양(Mold Spec) 시스템 설계

## 🎯 시스템 개요

**개발 단계의 모든 데이터를 통합하여 최종 금형사양을 확정하는 시스템**

- 개발계획 → 체크리스트 → 경도측정 → TRY-OUT 데이터 자동 통합
- 제작처가 초안 작성, 본사가 최종 확정(Lock)
- 생산처는 확정된 사양 조회만 가능
- Lock 후 양산 이관

---

## 🔐 역할별 권한

| 역할 | 조회 | 작성/수정 | 승인/Lock | 비고 |
|------|------|----------|----------|------|
| **제작처(maker)** | ✅ | ✅ draft | ❌ | 개발 중 사양 초안 작성 |
| **본사(developer)** | ✅ | ✅ draft/submitted | ✅ Lock | 최종 사양 확정 |
| **생산처(production)** | ✅ | ❌ | ❌ | 확정본 조회만 |

### 권한 상세

**제작처 (maker)**
- draft 상태에서 자유롭게 사양 입력/수정
- [사양 제출 및 승인요청] → status = 'submitted'
- submitted/locked 상태에서는 수정 불가

**본사 (developer)**
- submitted 상태에서도 일부 수정 가능
- [사양 확정 및 Lock] → status = 'locked'
- Lock 후에는 본사도 수정 불가 (별도 Unlock 절차 필요)

**생산처 (production)**
- 항상 읽기 전용
- QR 로그인 → 금형 상세에서 "금형사양 카드" 조회

---

## 📊 상태 플로우

```
draft (작성 중)
  ↓ [제작처: 사양 제출]
submitted (승인 대기)
  ↓ [본사: 사양 확정 및 Lock]
locked (확정 완료)
  ↓
양산 이관 (mold.status = 'ready_for_mass')
```

---

## 📊 데이터 구조

### 1️⃣ mold_spec (금형사양)

| 카테고리 | 필드 | 타입 | 설명 |
|---------|------|------|------|
| **기본 정보** | mold_name | TEXT | 금형명 |
| | customer | TEXT | 고객사 |
| | car_name | TEXT | 차종 |
| | part_name | TEXT | 부품명 |
| | part_no | TEXT | 부품 번호 |
| **구조/사양** | cavity_count | INTEGER | 캐비티 수 |
| | mold_base | TEXT | 몰드베이스 타입 |
| | runner_type | TEXT | Hot/Cold/Valve Gate |
| | gate_type | TEXT | 게이트 타입 |
| | slide_cnt | INTEGER | 슬라이드 수 |
| | lifter_cnt | INTEGER | 리프터 수 |
| **재질/경도** | cavity_material | TEXT | 캐비티 재질 |
| | core_material | TEXT | 코어 재질 |
| | cavity_hardness_min/max/avg | NUMERIC | 캐비티 경도 |
| | core_hardness_min/max/avg | NUMERIC | 코어 경도 |
| **성형기/조건** | tonnage_min/max | INTEGER | 톤수 범위 |
| | recommend_tonnage | INTEGER | 추천 톤수 |
| | resin | TEXT | 수지 |
| | resin_maker | TEXT | 수지 제조사 |
| | color | TEXT | 색상 |
| | shot_weight_g | NUMERIC | 샷 중량 |
| | cycle_sec | NUMERIC | 싸이클 타임 |
| **성형 조건** | melt_temp | NUMERIC | 용융온도 (℃) |
| | mold_temp | NUMERIC | 금형온도 (℃) |
| | injection_pressure | NUMERIC | 사출압력 (bar) |
| | hold_pressure | NUMERIC | 보압 (bar) |
| | injection_speed | NUMERIC | 사출속도 (mm/s) |
| | cooling_time | NUMERIC | 냉각시간 (sec) |
| **기타** | remark | TEXT | 비고 |
| | special_note | TEXT | 특이사항 |
| **상태** | status | VARCHAR | draft/submitted/locked |

### 2️⃣ mold_spec_history (변경 이력)

| 필드 | 타입 | 설명 |
|------|------|------|
| spec_id | INTEGER | 금형사양 ID |
| action | VARCHAR | created/updated/submitted/locked/unlocked |
| changed_by | INTEGER | 변경자 |
| comment | TEXT | 코멘트 |
| snapshot | JSONB | 변경 시점 스냅샷 |

---

## 🔗 개발 모듈 자동 연동

### 1️⃣ 개발계획 → 기본 정보

```javascript
// 개발계획에서 가져오기
const devPlan = await MoldDevPlan.findOne({ where: { mold_id: moldId } });

await MoldSpec.upsert({
  mold_id: moldId,
  car_name: devPlan.car_name,
  customer: devPlan.customer,
  tonnage_min: devPlan.tonnage_min,
  tonnage_max: devPlan.tonnage_max
});
```

### 2️⃣ 경도측정 → 재질/경도 (자동 트리거)

```sql
-- 트리거: 경도측정 승인 시 자동 반영
CREATE TRIGGER trigger_sync_hardness_to_spec
AFTER UPDATE ON mold_hardness
FOR EACH ROW
EXECUTE FUNCTION sync_hardness_to_spec();
```

**반영 항목:**
- cavity_material, core_material
- cavity_hardness_avg, core_hardness_avg

### 3️⃣ TRY-OUT → 성형 조건 (자동 트리거)

```sql
-- 트리거: TRY-OUT 승인 시 자동 반영 (use_as_mass_condition = true)
CREATE TRIGGER trigger_sync_tryout_to_spec
AFTER UPDATE ON mold_tryout
FOR EACH ROW
EXECUTE FUNCTION sync_tryout_to_spec();
```

**반영 항목:**
- recommend_tonnage, resin, resin_maker, color
- shot_weight_g, cycle_sec
- melt_temp, mold_temp, hold_pressure, cooling_time

### 자동 연동 흐름

```
경도측정 승인 (approved)
  ↓ 트리거 자동 실행
금형사양에 재질/경도 반영
  ↓
TRY-OUT 승인 (approved + use_as_mass_condition = true)
  ↓ 트리거 자동 실행
금형사양에 성형 조건 반영
  ↓
제작처가 금형사양 화면에서 확인
  ↓ 일부 수정 후 제출
본사가 최종 확정 (Lock)
```

---

## 🔌 API 엔드포인트

### 조회 (전체 역할)

```javascript
GET /api/v1/molds/:moldId/spec
  - 금형사양 조회
  - 권한: maker, developer, production
  - 응답: 금형사양 + 개발 모듈 연동 상태
```

### 작성/수정 (제작처 + 본사)

```javascript
POST /api/v1/molds/:moldId/spec
  - 금형사양 생성/수정
  - 권한: maker (draft만), developer (draft/submitted)
  - Body: { ...spec_data }
  
  // 제작처: draft 상태만 수정 가능
  if (role === 'maker' && spec.status !== 'draft') {
    return res.status(403).json({ error: '제출된 사양은 수정할 수 없습니다.' });
  }
  
  // 본사: locked 상태는 수정 불가
  if (role === 'developer' && spec.status === 'locked') {
    return res.status(403).json({ error: '확정된 사양은 수정할 수 없습니다.' });
  }
```

### 제출 (제작처)

```javascript
POST /api/v1/molds/:moldId/spec/submit
  - 사양 제출 (승인 요청)
  - 권한: maker
  - 조건: status = 'draft'
  
  // 선행 조건 검증
  const devPlan = await MoldDevPlan.findOne({ where: { mold_id: moldId } });
  if (devPlan.status !== 'approved') {
    return res.status(400).json({ error: '개발계획이 승인되지 않았습니다.' });
  }
  
  const hardness = await MoldHardness.findOne({ where: { mold_id: moldId } });
  if (hardness.status !== 'approved') {
    return res.status(400).json({ error: '경도측정이 승인되지 않았습니다.' });
  }
  
  const tryoutCount = await MoldTryout.count({ 
    where: { mold_id: moldId, status: 'approved' } 
  });
  if (tryoutCount === 0) {
    return res.status(400).json({ error: 'TRY-OUT이 승인되지 않았습니다.' });
  }
  
  // 제출 처리
  await spec.update({ 
    status: 'submitted',
    submitted_by: req.user.id,
    submitted_at: new Date()
  });
```

### 확정/Lock (본사)

```javascript
POST /api/v1/molds/:moldId/spec/lock
  - 사양 확정 및 Lock
  - 권한: developer
  - 조건: status = 'submitted'
  - Body: { comment }
  
  // Lock 처리
  await spec.update({
    status: 'locked',
    locked_by: req.user.id,
    locked_at: new Date(),
    lock_comment: req.body.comment
  });
  
  // 금형 상태 변경 (양산 준비 완료)
  await Mold.update(
    { status: 'ready_for_mass' },
    { where: { id: moldId } }
  );
  
  // 생산처에 알림 발송
  // TODO: 신규 양산 금형 알림
```

### Unlock (본사 - 특수 상황)

```javascript
POST /api/v1/molds/:moldId/spec/unlock
  - 사양 Lock 해제
  - 권한: developer (관리자 권한 필요)
  - 조건: status = 'locked'
  - Body: { reason }
  
  // Unlock 처리
  await spec.update({
    status: 'submitted',
    updated_by: req.user.id,
    updated_at: new Date()
  });
  
  // 이력 기록
  await MoldSpecHistory.create({
    spec_id: spec.id,
    action: 'unlocked',
    changed_by: req.user.id,
    comment: req.body.reason
  });
```

---

## 🎨 UI 구성

### 1️⃣ 금형사양 페이지

```
┌─────────────────────────────────────────────────────────┐
│ 📋 금형사양                                              │
│ [뒤로가기] M-2024-001 범퍼 금형                         │
│                                                           │
│ 상태: [작성중] / [승인대기] / [확정완료]                │
│                                                           │
│ [제작처] [저장] [제출 및 승인요청]                      │
│ [본사]   [저장] [사양 확정 및 Lock]                     │
├─────────────────────────────────────────────────────────┤
│ 📌 기본 정보                                             │
│  금형명: [범퍼 금형]                                     │
│  고객사: [현대자동차]  차종: [AVANTE CN7]              │
│  부품명: [범퍼]  부품번호: [BP-2024-001]               │
├─────────────────────────────────────────────────────────┤
│ 📌 구조/사양                                             │
│  캐비티 수: [2]  몰드베이스: [LKM]                     │
│  러너 타입: [Hot Runner]  게이트: [Valve Gate]         │
│  슬라이드: [4]  리프터: [2]                            │
├─────────────────────────────────────────────────────────┤
│ 📌 재질/경도 (경도측정에서 자동 반영) ✅                │
│  캐비티 재질: [HP4A]  경도: 38.7 HRC                   │
│  코어 재질: [NAK80]  경도: 40.2 HRC                    │
├─────────────────────────────────────────────────────────┤
│ 📌 성형기/조건 (TRY-OUT에서 자동 반영) ✅               │
│  추천 톤수: [350톤]  (범위: 300~400톤)                │
│  수지: [PP]  제조사: [LG화학]  색상: [Black]          │
│  샷 중량: [450.5g]  싸이클: [35.2초]                  │
├─────────────────────────────────────────────────────────┤
│ 📌 성형 조건 상세                                        │
│  용융온도: [230℃]  금형온도: [60℃]                    │
│  사출압력: [800bar]  보압: [600bar]                    │
│  사출속도: [50mm/s]  냉각시간: [25초]                  │
├─────────────────────────────────────────────────────────┤
│ 📌 비고/특이사항                                         │
│  [텍스트 입력 영역]                                     │
└─────────────────────────────────────────────────────────┘
```

### 2️⃣ 금형 상세 - 사양 요약 카드

```
┌─────────────────────────────────────────────────────────┐
│ 금형 상세 페이지                                         │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐    │
│ │ 📋 금형사양 요약                                 │    │
│ │                                                   │    │
│ │ 캐비티: 2  |  추천 톤수: 350톤                  │    │
│ │ 재질: HP4A/NAK80  |  경도: 38.7/40.2 HRC        │    │
│ │ 수지: PP (LG화학)  |  색상: Black               │    │
│ │ 싸이클: 35.2초  |  샷중량: 450.5g               │    │
│ │                                                   │    │
│ │ 상태: ✅ 확정 완료 (2024-12-01)                 │    │
│ │                                                   │    │
│ │ [상세 보기]                                      │    │
│ └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 3️⃣ 역할별 UI 상태

```typescript
const { role } = useAuth();
const { status } = spec;

// 편집 가능 여부
const editable = 
  (role === 'maker' && status === 'draft') ||
  (role === 'developer' && status !== 'locked');

// Lock 가능 여부
const canLock = role === 'developer' && status === 'submitted';

// 생산처는 항상 읽기 전용
const readOnly = role === 'production' || status === 'locked';
```

---

## 💻 프론트엔드 로직

### 1️⃣ 금형사양 조회

```typescript
const fetchMoldSpec = async () => {
  try {
    const res = await api.get(`/api/v1/molds/${moldId}/spec`);
    const data = res.data.data;
    
    setSpec(data.spec);
    
    // 개발 모듈 연동 상태 표시
    setDevModuleStatus({
      devPlan: data.dev_plan_status,
      hardness: data.hardness_status,
      tryoutCount: data.tryout_approved_count
    });
  } catch (err) {
    console.error('금형사양 조회 오류:', err);
  }
};
```

### 2️⃣ 저장

```typescript
const handleSave = async () => {
  if (!editable) return;
  
  try {
    await api.post(`/api/v1/molds/${moldId}/spec`, spec);
    alert('저장되었습니다.');
  } catch (err) {
    console.error('저장 오류:', err);
    alert('저장에 실패했습니다.');
  }
};
```

### 3️⃣ 제출 (제작처)

```typescript
const handleSubmit = async () => {
  if (!confirm('금형사양을 제출하시겠습니까?')) return;
  
  try {
    await api.post(`/api/v1/molds/${moldId}/spec/submit`);
    alert('제출되었습니다.');
    fetchMoldSpec();
  } catch (err) {
    const message = err.response?.data?.error || '제출에 실패했습니다.';
    alert(message);
  }
};
```

### 4️⃣ Lock (본사)

```typescript
const handleLock = async () => {
  const comment = prompt('확정 코멘트를 입력하세요.');
  if (!comment) return;
  
  if (!confirm('금형사양을 확정하시겠습니까?\n확정 후에는 수정할 수 없습니다.')) return;
  
  try {
    await api.post(`/api/v1/molds/${moldId}/spec/lock`, { comment });
    alert('금형사양이 확정되었습니다.\n양산 준비가 완료되었습니다.');
    fetchMoldSpec();
  } catch (err) {
    alert('확정에 실패했습니다.');
  }
};
```

### 5️⃣ 자동 반영 데이터 표시

```typescript
// 경도측정에서 자동 반영된 데이터 표시
{spec.cavity_material && (
  <div className="flex items-center gap-2">
    <span>캐비티 재질: {spec.cavity_material}</span>
    <span className="text-xs text-green-600">✅ 경도측정 반영</span>
  </div>
)}

// TRY-OUT에서 자동 반영된 데이터 표시
{spec.recommend_tonnage && (
  <div className="flex items-center gap-2">
    <span>추천 톤수: {spec.recommend_tonnage}톤</span>
    <span className="text-xs text-blue-600">✅ TRY-OUT 반영</span>
  </div>
)}
```

---

## 🔄 전체 개발 단계 흐름

```
1️⃣ 개발계획 (mold_dev_plan)
   제작처 작성 → 본사 승인
   ↓ 차종, 고객사, 톤수 범위 → 금형사양
   
2️⃣ 금형 체크리스트 (checklist_instances)
   제작처 작성 → 본사 승인
   NG 항목 → 수리요청 자동 생성
   ↓
   
3️⃣ 경도측정 (mold_hardness)
   제작처 측정 → 본사 승인
   ↓ 트리거 자동 실행
   재질/경도 → 금형사양 자동 반영 ✅
   
4️⃣ 금형육성 TRY-OUT (mold_tryout)
   제작처/생산처 TRY-OUT → 본사 승인
   ↓ 트리거 자동 실행 (use_as_mass_condition = true)
   성형 조건 → 금형사양 자동 반영 ✅
   
5️⃣ 금형사양 (mold_spec)
   제작처: 자동 반영된 데이터 확인 + 추가 입력
   제작처: [제출 및 승인요청] → status = 'submitted'
   본사: 최종 검토 + 일부 수정
   본사: [사양 확정 및 Lock] → status = 'locked'
   ↓
   금형 상태 변경: mold.status = 'ready_for_mass'
   
6️⃣ 양산 이관
   생산처 대시보드에 "신규 양산 금형" 표시
   생산처 QR 로그인 → 금형사양 조회
   일상점검/정기점검/수리 → 금형사양 기준으로 NG 판정
```

---

## 🚀 구현 단계

### Phase 1: DB 및 백엔드 기초 ✅
- [x] 마이그레이션 파일 생성
- [x] 자동 연동 트리거 생성
- [x] 상세 뷰 생성
- [ ] Sequelize 모델
- [ ] CRUD API

### Phase 2: 제작처 화면
- [ ] 금형사양 입력 폼
- [ ] 자동 반영 데이터 표시
- [ ] 저장/제출 기능

### Phase 3: 본사 화면
- [ ] 금형사양 검토
- [ ] 일부 수정 기능
- [ ] Lock 처리

### Phase 4: 생산처 화면
- [ ] 금형사양 요약 카드
- [ ] 상세 조회 (읽기 전용)

### Phase 5: 통합
- [ ] 개발 모듈 연동 상태 표시
- [ ] 양산 이관 처리
- [ ] 알림 시스템

---

**이제 개발 단계 → 양산 이관까지 완전한 흐름이 완성되었습니다!** 🎉

**금형사양이 확정되면 생산처로 자동 이관되어 양산 관리가 시작됩니다!** 🏭✨
