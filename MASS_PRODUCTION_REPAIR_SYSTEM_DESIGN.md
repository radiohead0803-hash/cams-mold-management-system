# 🏭 양산 단계 - NG 자동 수리요청 시스템 설계

## 🎯 시스템 개요

**일상/정기점검 NG → 자동 수리요청 → 3자 협업 → 귀책협의 → EO 연계**

- 생산처 QR 로그인 → 일상/정기점검 체크리스트 작성
- NG 항목 자동 분석 → 조건 충족 시 수리요청 자동 생성
- 생산처 → 본사 → 제작처 3자 협업 프로세스
- 귀책(책임자) 협의 및 확정
- EO(설계변경) 연계

---

## 🔄 전체 흐름

```
생산처 QR 로그인
  ↓
일상/정기점검 체크리스트 작성
  ↓
[제출] 클릭
  ↓
서버에서 NG 항목 자동 분석
  ↓
┌─────────────────────┬─────────────────────┐
│ NG 없음             │ NG 있음 (critical)  │
├─────────────────────┼─────────────────────┤
│ "점검 완료" 메시지  │ 수리요청 자동 생성  │
│                     │ ↓                   │
│                     │ requested 상태      │
│                     │ ↓                   │
│                     │ 본사 검토           │
│                     │ ↓                   │
│                     │ approved → assigned │
│                     │ ↓                   │
│                     │ 제작처 수리 진행    │
│                     │ ↓                   │
│                     │ in_progress → done  │
│                     │ ↓                   │
│                     │ 생산처 정상 복귀 확인│
│                     │ ↓                   │
│                     │ confirmed           │
│                     │ ↓                   │
│                     │ 귀책 협의 및 확정   │
│                     │ ↓                   │
│                     │ closed              │
└─────────────────────┴─────────────────────┘
```

---

## 📊 데이터 구조

### 1️⃣ repair_requests (수리요청 헤더)

```sql
CREATE TABLE IF NOT EXISTS repair_requests (
  id               SERIAL PRIMARY KEY,
  mold_id          INTEGER NOT NULL REFERENCES molds(id),
  
  -- 출처 정보
  source_type      VARCHAR(20) NOT NULL,   -- 'checklist', 'manual', 'eo'
  source_id        INTEGER,                -- checklist_instance_id or eo_request_id
  
  -- 요청자 정보
  request_site_id  INTEGER NOT NULL REFERENCES companies(id),  -- 생산처 공장
  requester_role   VARCHAR(20) NOT NULL,   -- 'production', 'maker', 'developer'
  
  -- 기본 정보
  title            TEXT NOT NULL,
  description      TEXT,
  status           VARCHAR(30) NOT NULL DEFAULT 'requested',
  priority         VARCHAR(20) DEFAULT 'normal',  -- low, normal, high, urgent
  
  -- 일정 추적
  requested_at     TIMESTAMP NOT NULL DEFAULT now(),
  approved_at      TIMESTAMP,
  assigned_at      TIMESTAMP,
  started_at       TIMESTAMP,
  completed_at     TIMESTAMP,
  confirmed_at     TIMESTAMP,              -- 생산처 정상 복귀 확인
  closed_at        TIMESTAMP,
  
  -- 귀책/원인 분석
  cause_category   VARCHAR(30),            -- damage, design_defect, wear, operation_error, material
  cause_detail     TEXT,                   -- 원인 상세 설명
  blame_party      VARCHAR(20),            -- 'maker', 'production', 'developer', 'shared', 'none'
  blame_reason     TEXT,                   -- 귀책 판단 근거
  blame_confirmed  BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- EO 연계
  eo_link_id       INTEGER,                -- eo_requests.id
  
  -- 비용 정보 (옵션)
  estimated_cost   NUMERIC(10,2),
  actual_cost      NUMERIC(10,2),
  
  -- 추적 정보
  created_by       INTEGER NOT NULL REFERENCES users(id),
  created_at       TIMESTAMP NOT NULL DEFAULT now(),
  updated_by       INTEGER REFERENCES users(id),
  updated_at       TIMESTAMP NOT NULL DEFAULT now(),
  approved_by      INTEGER REFERENCES users(id),
  assigned_to      INTEGER REFERENCES users(id),  -- 제작처 담당자
  confirmed_by     INTEGER REFERENCES users(id),  -- 생산처 확인자
  closed_by        INTEGER REFERENCES users(id)
);

CREATE INDEX idx_repair_requests_mold ON repair_requests(mold_id);
CREATE INDEX idx_repair_requests_status ON repair_requests(status);
CREATE INDEX idx_repair_requests_site ON repair_requests(request_site_id);
CREATE INDEX idx_repair_requests_source ON repair_requests(source_type, source_id);
```

### 2️⃣ repair_request_ng_items (NG 항목 상세)

```sql
CREATE TABLE IF NOT EXISTS repair_request_ng_items (
  id                    SERIAL PRIMARY KEY,
  repair_request_id     INTEGER NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
  checklist_instance_id INTEGER NOT NULL REFERENCES checklist_instances(id),
  question_id           INTEGER NOT NULL REFERENCES checklist_questions(id),
  answer_id             INTEGER NOT NULL REFERENCES checklist_answers(id),
  ng_reason             TEXT,                   -- NG 사유
  action_taken          TEXT,                   -- 조치 내용
  created_at            TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_repair_ng_items_request ON repair_request_ng_items(repair_request_id);
CREATE INDEX idx_repair_ng_items_checklist ON repair_request_ng_items(checklist_instance_id);
```

### 3️⃣ repair_request_history (수리요청 이력)

```sql
CREATE TABLE IF NOT EXISTS repair_request_history (
  id                SERIAL PRIMARY KEY,
  repair_request_id INTEGER NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
  action            VARCHAR(30) NOT NULL,   -- created, approved, assigned, started, completed, confirmed, closed, rejected
  changed_by        INTEGER NOT NULL REFERENCES users(id),
  comment           TEXT,
  snapshot          JSONB,                  -- 변경 시점 스냅샷
  created_at        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_repair_history_request ON repair_request_history(repair_request_id);
```

### 4️⃣ repair_request_files (수리 관련 파일)

```sql
CREATE TABLE IF NOT EXISTS repair_request_files (
  id                SERIAL PRIMARY KEY,
  repair_request_id INTEGER NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
  file_url          TEXT NOT NULL,
  file_type         VARCHAR(30),            -- before_photo, after_photo, report, invoice
  file_name         TEXT,
  file_size         INTEGER,
  description       TEXT,
  uploaded_by       INTEGER REFERENCES users(id),
  uploaded_at       TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_repair_files_request ON repair_request_files(repair_request_id);
```

### 5️⃣ eo_requests (설계변경 요청)

```sql
CREATE TABLE IF NOT EXISTS eo_requests (
  id              SERIAL PRIMARY KEY,
  mold_id         INTEGER NOT NULL REFERENCES molds(id),
  eo_no           VARCHAR(50) UNIQUE NOT NULL,  -- EO 번호 (EO-2024-001)
  title           TEXT NOT NULL,
  reason          TEXT,                         -- 고객사 요청, 품질개선, 원가절감
  reason_category VARCHAR(30),                  -- customer_request, quality, cost, design
  description     TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'requested',  -- requested, approved, in_progress, done, rejected
  priority        VARCHAR(20) DEFAULT 'normal',
  
  -- 일정
  requested_at    TIMESTAMP NOT NULL DEFAULT now(),
  approved_at     TIMESTAMP,
  completed_at    TIMESTAMP,
  
  -- 추적
  requested_by    INTEGER NOT NULL REFERENCES users(id),
  approved_by     INTEGER REFERENCES users(id),
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_eo_requests_mold ON eo_requests(mold_id);
CREATE INDEX idx_eo_requests_status ON eo_requests(status);
```

---

## 🔍 NG 판정 규칙

### 1️⃣ checklist_questions 테이블 확장

```sql
ALTER TABLE checklist_questions
ADD COLUMN is_critical BOOLEAN DEFAULT FALSE,
ADD COLUMN ng_when VARCHAR(20),              -- 'NO', 'BELOW_SPEC', 'NG_OPTION'
ADD COLUMN spec_min NUMERIC(10,2),           -- 수치형 최소값
ADD COLUMN spec_max NUMERIC(10,2);           -- 수치형 최대값
```

### 2️⃣ NG 판정 로직

```javascript
function isNgAnswer(question, answer) {
  // 중요 항목이 아니면 NG 아님
  if (!question.is_critical) return false;
  
  // 예/아니오형
  if (question.type === 'boolean' && question.ng_when === 'NO') {
    return answer.value_option === 'NO';
  }
  
  // 선택형 (OK/NG)
  if (question.type === 'select' && question.ng_when === 'NG_OPTION') {
    return answer.value_option === 'NG';
  }
  
  // 수치형 (범위 벗어남)
  if (question.type === 'number' && question.ng_when === 'BELOW_SPEC') {
    const value = parseFloat(answer.value_text);
    if (question.spec_min && value < question.spec_min) return true;
    if (question.spec_max && value > question.spec_max) return true;
  }
  
  return false;
}
```

---

## 🔄 상태 플로우

### 전체 상태

```
requested (요청됨)
  ↓ [본사: 승인]
approved (승인됨)
  ↓ [본사: 제작처 배정]
assigned (배정됨)
  ↓ [제작처: 작업 시작]
in_progress (진행 중)
  ↓ [제작처: 완료 보고]
done (완료됨)
  ↓ [생산처: 정상 복귀 확인]
confirmed (확인됨)
  ↓ [본사: 귀책 확정 및 종료]
closed (종료됨)

rejected (반려됨) ← [본사: 반려]
```

### 역할별 상태 전환 권한

| 현재 상태 | 다음 상태 | 권한 | 액션 |
|----------|----------|------|------|
| requested | approved | 본사 | 승인 |
| requested | rejected | 본사 | 반려 |
| approved | assigned | 본사 | 제작처 배정 |
| assigned | in_progress | 제작처 | 작업 시작 |
| in_progress | done | 제작처 | 완료 보고 |
| done | confirmed | 생산처 | 정상 복귀 확인 |
| confirmed | closed | 본사 | 귀책 확정 및 종료 |

---

## 🔌 API 엔드포인트

### 체크리스트 제출 (NG 자동 분석)

```javascript
POST /api/v1/checklists/:id/submit
  - 체크리스트 제출
  - 권한: production, maker
  
  // 로직
  1. 체크리스트 상태 변경 (submitted)
  2. NG 항목 자동 분석
  3. critical NG가 있으면 수리요청 자동 생성
  
  // 응답
  {
    success: true,
    data: {
      checklist: { ... },
      ngCount: 3,
      repairRequest: {
        id: 123,
        title: "[자동] M-2024-001 점검 NG 수리요청",
        status: "requested"
      }
    }
  }
```

### 수리요청 목록 조회

```javascript
GET /api/v1/repair-requests
  - 수리요청 목록
  - 권한: 전체
  - Query: status, mold_id, site_id, priority
  
GET /api/v1/molds/:moldId/repair-requests
  - 금형별 수리요청 목록
  - 권한: 전체
```

### 수리요청 상세 조회

```javascript
GET /api/v1/repair-requests/:id
  - 수리요청 상세
  - 권한: 전체
  - 응답: 수리요청 + NG 항목 + 이력 + 파일
```

### 수리요청 생성 (수동)

```javascript
POST /api/v1/molds/:moldId/repair-requests
  - 수리요청 수동 생성
  - 권한: production, maker, developer
  
Body:
{
  "title": "금형 파손 수리 요청",
  "description": "...",
  "priority": "urgent",
  "source_type": "manual"
}
```

### 수리요청 승인/반려 (본사)

```javascript
POST /api/v1/repair-requests/:id/approve
  - 수리요청 승인
  - 권한: developer
  
Body:
{
  "comment": "승인합니다."
}

POST /api/v1/repair-requests/:id/reject
  - 수리요청 반려
  - 권한: developer
  
Body:
{
  "comment": "수리 불필요. 조정으로 해결 가능."
}
```

### 제작처 배정 (본사)

```javascript
POST /api/v1/repair-requests/:id/assign
  - 제작처 배정
  - 권한: developer
  
Body:
{
  "assigned_to": 123,  // 제작처 담당자 ID
  "comment": "ABC 금형에 배정"
}
```

### 작업 시작/완료 (제작처)

```javascript
POST /api/v1/repair-requests/:id/start
  - 작업 시작
  - 권한: maker (assigned_to)
  
Body:
{
  "comment": "수리 작업 시작"
}

POST /api/v1/repair-requests/:id/complete
  - 작업 완료
  - 권한: maker (assigned_to)
  
Body:
{
  "cause_category": "wear",
  "cause_detail": "슬라이드 마모로 인한 불량",
  "blame_party": "shared",
  "blame_reason": "정상 마모로 판단",
  "comment": "슬라이드 교체 완료"
}
```

### 정상 복귀 확인 (생산처)

```javascript
POST /api/v1/repair-requests/:id/confirm
  - 정상 복귀 확인
  - 권한: production
  
Body:
{
  "comment": "샘플 사출 결과 정상 확인"
}
```

### 귀책 확정 및 종료 (본사)

```javascript
POST /api/v1/repair-requests/:id/close
  - 귀책 확정 및 종료
  - 권한: developer
  
Body:
{
  "cause_category": "wear",
  "blame_party": "shared",
  "blame_reason": "정상 마모로 공유 부담",
  "blame_confirmed": true,
  "comment": "종료 처리"
}
```

---

## 💻 백엔드 로직

### 1️⃣ 체크리스트 제출 시 NG 자동 분석

```javascript
// controllers/checklistController.js

exports.submitChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. 체크리스트 상태 변경
    const instance = await ChecklistInstance.findByPk(id, {
      include: [
        { model: Mold, as: 'mold' },
        { 
          model: ChecklistAnswer, 
          as: 'answers',
          include: [{ model: ChecklistQuestion, as: 'question' }]
        }
      ]
    });
    
    await instance.update({ 
      status: 'submitted',
      submitted_at: new Date()
    });
    
    // 2. NG 항목 분석
    const ngItems = instance.answers.filter(answer => {
      return isNgAnswer(answer.question, answer);
    });
    
    let repairRequest = null;
    
    // 3. critical NG가 있으면 수리요청 자동 생성
    if (ngItems.length > 0) {
      repairRequest = await createRepairRequestFromChecklist(
        instance,
        ngItems,
        req.user
      );
    }
    
    res.json({
      success: true,
      data: {
        checklist: instance,
        ngCount: ngItems.length,
        repairRequest
      }
    });
    
  } catch (error) {
    console.error('체크리스트 제출 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// NG 판정 함수
function isNgAnswer(question, answer) {
  if (!question.is_critical) return false;
  
  if (question.type === 'boolean' && question.ng_when === 'NO') {
    return answer.value_option === 'NO';
  }
  
  if (question.type === 'select' && question.ng_when === 'NG_OPTION') {
    return answer.value_option === 'NG';
  }
  
  if (question.type === 'number' && question.ng_when === 'BELOW_SPEC') {
    const value = parseFloat(answer.value_text);
    if (question.spec_min && value < question.spec_min) return true;
    if (question.spec_max && value > question.spec_max) return true;
  }
  
  return false;
}

// 수리요청 자동 생성
async function createRepairRequestFromChecklist(instance, ngItems, user) {
  const title = `[자동] ${instance.mold.code} 점검 NG 수리요청`;
  const description = ngItems
    .map(item => `- ${item.question.label}: ${item.value_option || item.value_text}`)
    .join('\n');
  
  const repairRequest = await RepairRequest.create({
    mold_id: instance.mold_id,
    source_type: 'checklist',
    source_id: instance.id,
    request_site_id: instance.site_id,
    requester_role: instance.role,
    title,
    description,
    status: 'requested',
    priority: 'normal',
    created_by: user.id
  });
  
  // NG 항목 상세 기록
  for (const ng of ngItems) {
    await RepairRequestNgItem.create({
      repair_request_id: repairRequest.id,
      checklist_instance_id: instance.id,
      question_id: ng.question_id,
      answer_id: ng.id,
      ng_reason: ng.ng_reason || null
    });
  }
  
  // 이력 기록
  await RepairRequestHistory.create({
    repair_request_id: repairRequest.id,
    action: 'created',
    changed_by: user.id,
    comment: 'NG 항목 자동 감지로 생성'
  });
  
  // TODO: 본사에 알림 발송
  
  return repairRequest;
}
```

### 2️⃣ 수리요청 상태 변경

```javascript
// controllers/repairRequestController.js

// 승인
exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    const repair = await RepairRequest.findByPk(id);
    
    if (repair.status !== 'requested') {
      return res.status(400).json({ 
        success: false, 
        error: '요청 상태만 승인할 수 있습니다.' 
      });
    }
    
    await repair.update({
      status: 'approved',
      approved_by: req.user.id,
      approved_at: new Date()
    });
    
    await RepairRequestHistory.create({
      repair_request_id: repair.id,
      action: 'approved',
      changed_by: req.user.id,
      comment
    });
    
    res.json({ success: true, data: repair });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 제작처 배정
exports.assign = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to, comment } = req.body;
    
    const repair = await RepairRequest.findByPk(id);
    
    await repair.update({
      status: 'assigned',
      assigned_to,
      assigned_at: new Date()
    });
    
    await RepairRequestHistory.create({
      repair_request_id: repair.id,
      action: 'assigned',
      changed_by: req.user.id,
      comment
    });
    
    // TODO: 제작처 담당자에게 알림
    
    res.json({ success: true, data: repair });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 작업 완료
exports.complete = async (req, res) => {
  try {
    const { id } = req.params;
    const { cause_category, cause_detail, blame_party, blame_reason, comment } = req.body;
    
    const repair = await RepairRequest.findByPk(id);
    
    await repair.update({
      status: 'done',
      completed_at: new Date(),
      cause_category,
      cause_detail,
      blame_party,
      blame_reason
    });
    
    await RepairRequestHistory.create({
      repair_request_id: repair.id,
      action: 'completed',
      changed_by: req.user.id,
      comment
    });
    
    // TODO: 생산처에 알림 (정상 복귀 확인 요청)
    
    res.json({ success: true, data: repair });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 정상 복귀 확인
exports.confirm = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    const repair = await RepairRequest.findByPk(id);
    
    await repair.update({
      status: 'confirmed',
      confirmed_by: req.user.id,
      confirmed_at: new Date()
    });
    
    await RepairRequestHistory.create({
      repair_request_id: repair.id,
      action: 'confirmed',
      changed_by: req.user.id,
      comment
    });
    
    // TODO: 본사에 알림 (귀책 확정 요청)
    
    res.json({ success: true, data: repair });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 귀책 확정 및 종료
exports.close = async (req, res) => {
  try {
    const { id } = req.params;
    const { cause_category, blame_party, blame_reason, comment } = req.body;
    
    const repair = await RepairRequest.findByPk(id);
    
    await repair.update({
      status: 'closed',
      cause_category,
      blame_party,
      blame_reason,
      blame_confirmed: true,
      closed_by: req.user.id,
      closed_at: new Date()
    });
    
    await RepairRequestHistory.create({
      repair_request_id: repair.id,
      action: 'closed',
      changed_by: req.user.id,
      comment
    });
    
    res.json({ success: true, data: repair });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

---

## 🎨 UI 구성

### 1️⃣ 체크리스트 제출 후 화면

```
┌─────────────────────────────────────────────────────────┐
│ ✅ 점검이 제출되었습니다                                 │
├─────────────────────────────────────────────────────────┤
│ ⚠️ NG 항목 3건 발생                                     │
│                                                           │
│ 자동으로 수리요청이 생성되었습니다.                      │
│ 수리요청 번호: RR-2024-00123                            │
│                                                           │
│ [수리요청 상세보기]  [확인]                             │
└─────────────────────────────────────────────────────────┘
```

### 2️⃣ 수리요청 목록 (생산처)

```
┌─────────────────────────────────────────────────────────┐
│ 🔧 수리요청 목록                                         │
│ [+ 새 수리요청]                                         │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐    │
│ │ RR-2024-00123  🟡 승인 대기                     │    │
│ │ [자동] M-2024-001 점검 NG 수리요청              │    │
│ │ 요청일: 2024-12-02  |  우선순위: 보통          │    │
│ │ NG 항목: 3건                                    │    │
│ └─────────────────────────────────────────────────┘    │
│                                                           │
│ ┌─────────────────────────────────────────────────┐    │
│ │ RR-2024-00122  🔵 진행 중                       │    │
│ │ 슬라이드 파손 수리                               │    │
│ │ 요청일: 2024-11-28  |  우선순위: 긴급          │    │
│ │ 담당: ABC 금형                                   │    │
│ └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 3️⃣ 수리요청 상세 (역할별)

**생산처 화면:**
```
┌─────────────────────────────────────────────────────────┐
│ 🔧 수리요청 상세                                         │
│ RR-2024-00123  🟢 완료됨                                │
├─────────────────────────────────────────────────────────┤
│ 기본 정보                                                │
│  금형: M-2024-001 범퍼 금형                             │
│  요청일: 2024-12-02                                     │
│  우선순위: 보통                                          │
│  출처: 일상점검 (CI-2024-456)                           │
├─────────────────────────────────────────────────────────┤
│ NG 항목 (3건)                                            │
│  ✗ 슬라이드 작동 상태: NG                               │
│  ✗ 냉각수 누수: 있음                                    │
│  ✗ 게이트 마모: 심각                                    │
├─────────────────────────────────────────────────────────┤
│ 수리 내용                                                │
│  원인: 슬라이드 마모 (wear)                             │
│  조치: 슬라이드 교체 완료                               │
│  완료일: 2024-12-05                                     │
├─────────────────────────────────────────────────────────┤
│ 정상 복귀 확인                                           │
│  [샘플 사출 결과 정상 확인]                             │
│  [정상 복귀 확인]                                       │
└─────────────────────────────────────────────────────────┘
```

**본사 화면:**
```
┌─────────────────────────────────────────────────────────┐
│ 🔧 수리요청 상세 (본사)                                 │
│ RR-2024-00123  🟢 확인됨                                │
├─────────────────────────────────────────────────────────┤
│ ... (기본 정보, NG 항목, 수리 내용 동일)                │
├─────────────────────────────────────────────────────────┤
│ 귀책 협의                                                │
│  원인 분류: [마모 ▼]                                    │
│  귀책 당사자: [공유 부담 ▼]                             │
│  판단 근거: [정상 마모로 공유 부담 적절]                │
│                                                           │
│  [귀책 확정 및 종료]                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 귀책 협의 시스템

### 원인 분류 (cause_category)

| 코드 | 이름 | 설명 |
|------|------|------|
| damage | 파손 | 외부 충격, 낙하 등 |
| design_defect | 설계 불량 | 설계 오류로 인한 문제 |
| wear | 마모 | 정상 사용으로 인한 마모 |
| operation_error | 조작 실수 | 잘못된 사용, 설정 오류 |
| material | 재료 문제 | 재질 불량, 열처리 문제 |
| assembly | 조립 불량 | 조립 오류 |
| other | 기타 | 기타 원인 |

### 귀책 당사자 (blame_party)

| 코드 | 이름 | 설명 |
|------|------|------|
| maker | 제작처 | 제작 불량, 설계 오류 |
| production | 생산처 | 조작 실수, 관리 소홀 |
| developer | 본사 | 설계 지시 오류 |
| shared | 공유 부담 | 정상 마모 등 |
| none | 귀책 없음 | 불가항력 |

### 귀책 확정 프로세스

```
제작처 수리 완료 보고
  ↓ 원인 분석 + 제안 귀책
생산처 정상 복귀 확인
  ↓ 의견 제시
본사 검토
  ↓ 사진/데이터 확인
  ↓ 필요 시 회의
최종 귀책 확정
  ↓ blame_confirmed = true
종료 (closed)
```

---

## 🔗 EO 연계

### EO 요청 → 수리요청 생성

```javascript
// EO 화면에서 "금형 수리요청 생성" 버튼 클릭
const handleCreateRepairFromEO = async (eoId) => {
  const eo = await api.get(`/api/v1/eo-requests/${eoId}`);
  
  navigate('/repair-requests/new', {
    state: {
      source_type: 'eo',
      source_id: eoId,
      mold_id: eo.mold_id,
      title: `[EO] ${eo.eo_no} - ${eo.title}`,
      description: `EO 사유: ${eo.reason}\n\n${eo.description}`
    }
  });
};
```

### 수리요청 → EO 연계

```javascript
// 수리요청 화면에서 "EO 연계" 버튼 클릭
const handleLinkToEO = async (repairId, eoId) => {
  await api.post(`/api/v1/repair-requests/${repairId}/link-eo`, {
    eo_link_id: eoId
  });
  
  alert('EO와 연계되었습니다.');
};
```

---

## 🚀 구현 단계

### Phase 1: DB 및 백엔드 기초
- [ ] 마이그레이션 파일 생성
- [ ] Sequelize 모델
- [ ] NG 판정 로직
- [ ] 수리요청 자동 생성 로직

### Phase 2: 수리요청 API
- [ ] CRUD API
- [ ] 상태 변경 API (승인/배정/시작/완료/확인/종료)
- [ ] 파일 업로드 API

### Phase 3: 생산처 화면
- [ ] 수리요청 목록
- [ ] 수리요청 상세
- [ ] 정상 복귀 확인

### Phase 4: 제작처 화면
- [ ] 배정된 수리요청 목록
- [ ] 수리 진행 상황 입력
- [ ] 완료 보고 (원인/귀책 제안)

### Phase 5: 본사 화면
- [ ] 전체 수리요청 목록
- [ ] 승인/반려
- [ ] 제작처 배정
- [ ] 귀책 확정

### Phase 6: EO 연계
- [ ] EO 요청 시스템
- [ ] EO → 수리요청 생성
- [ ] 수리요청 → EO 연계

---

**이제 양산 단계의 핵심인 NG 자동 수리요청 시스템이 완성되었습니다!** 🎉

**개발 단계 → 양산 단계까지 완전한 금형 생애주기 관리 시스템이 설계되었습니다!** 🏭✨
