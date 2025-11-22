# 금형 문제점 개선 현황 관리 시스템

## 개요

금형 제작 완료 후 초도 T/O부터 금형육성 완료 및 양산 단계까지 발생하는 **금형 문제점을 체계적으로 관리**하고, 개선 대책 및 일정을 추적하는 시스템입니다.

---

## 🔄 전체 프로세스 흐름

```
[금형 제작 완료]
    ↓
[금형제작처 T/O 단계]
    ├─ PROTO (시제품)
    ├─ P1 (1차 시제품)
    └─ P2 (2차 시제품)
    ↓ 문제점 발견 → 개선
[생산처 인수]
    ↓
[생산처 T/O 단계]
    ├─ T1 (1차 시험생산)
    ├─ T2 (2차 시험생산)
    ├─ M (양산 준비)
    └─ SOP (양산 시작)
    ↓ 문제점 발견 → 개선
[금형 육성 완료]
    ↓
[양산 단계]
    ↓ 문제점 발견 → 개선
[문제점 개선 완료]
```

---

## 📊 T/O 장소 및 이벤트 구분

### T/O 장소 (Location)

| 장소 | 설명 |
|------|------|
| **금형제작처** | 금형 제작 업체에서 실시하는 T/O |
| **생산처** | 실제 생산 공장에서 실시하는 T/O |

### T/O 이벤트 단계 (Event Stage)

**모든 이벤트는 T/O 장소와 무관하게 선택 가능**

| 단계 | 명칭 | 설명 | 일반적 사용 장소 |
|------|------|------|-----------------|
| **PROTO** | 시제품 | 최초 금형 시험, 기본 기능 확인 | 주로 금형제작처 |
| **P1** | 1차 시제품 | PROTO 개선 후 재시험, 치수 정밀도 확인 | 주로 금형제작처 |
| **P2** | 2차 시제품 | P1 개선 후 최종 시험, 생산처 인수 준비 | 주로 금형제작처 |
| **T1** | 1차 시험생산 | 생산 설비 적합성 확인, 초기 문제점 파악 | 주로 생산처 |
| **T2** | 2차 시험생산 | T1 개선 후 재시험, 생산 안정성 확인 | 주로 생산처 |
| **M** | 양산 준비 | 양산 전 최종 점검, 대량 생산 준비 | 주로 생산처 |
| **SOP** | 양산 시작 | Start Of Production, 정식 양산 개시 | 생산처 |
| **PRODUCTION** | 양산 중 | 양산 단계에서 발생한 문제점 및 수리 | 생산처 |

**참고**: 위 표의 "일반적 사용 장소"는 참고용이며, 실제로는 어떤 장소에서든 모든 이벤트를 선택할 수 있습니다.

### 문제점 발생 단계 구분

| 구분 | 단계 | 설명 |
|------|------|------|
| **T/O 단계** | PROTO, P1, P2, T1, T2, M, SOP | T/O 과정에서 발견된 문제점 |
| **양산 단계** | PRODUCTION | 양산 중 발생한 문제점 및 금형 수리 결과 |

---

## 📋 금형 문제점 개선 데이터 구조

### 문제점 마스터 (mold_issues)

```javascript
{
  // === 기본 정보 ===
  no: 1,                               // 순번
  issue_id: "ISS-2024-001",
  mold_id: 123,
  mold_number: "M-2024-001",
  
  // === 차종/부품 정보 ===
  car_model_id: 5,
  car_model: "GV80",                   // 차종
  item_id: 15,
  item_name: "H/LAMP L/GUIDE",         // 부품명
  part_number: "86563-P1010",          // 품번
  part_name: "L/GUIDE S/ASS'Y 조립 시 HOOK 불 와각 노출 현상",  // 품명 (상세 설명)
  
  // === 단계 정보 ===
  to_location: "maker",                // T/O 장소: 'maker' or 'production'
  to_stage: "P1",                      // 단계: PROTO, P1, P2, T1, T2, M, SOP, PRODUCTION
  to_date: "2024-03-15",
  
  // === 문제점 정보 ===
  issue_description: "L/GUIDE S/ASS'Y 조립 시 HOOK 불 와각 노출 현상",  // 문제점
  issue_images: [                      // 문제점 사진
    {
      url: "https://storage.../issue_photo1.jpg",
      caption: "HOOK 노출 현상",
      uploaded_at: "2024-03-15T10:00:00Z"
    }
  ],
  
  // === 원인 및 대책 ===
  root_cause: "원인: 조립 구조가 HOOK은 설정되어 있지 노출 현상 발생",  // 원인
  improvement_plan: "대책: HOOK 조립 불 부식 추가 하여 노출 최소화",    // 대책
  improvement_images: [                // 대책 사진/도면
    {
      url: "https://storage.../solution_drawing.jpg",
      caption: "개선 도면",
      uploaded_at: "2024-03-16T14:00:00Z"
    }
  ],
  
  // === 문제 유형 ===
  issue_type: "설계 불량",              // 문제 유형: 설계 불량, 외관 불량, 치수 불량, 성형 불량 등
  severity: "high",                    // 심각도: low, medium, high, critical
  
  // === 개선 일정 ===
  target_completion_date: "2024-09-20", // 개선 완료 목표일
  actual_completion_date: null,         // 실제 완료일
  schedule_status: "on_track",          // 일정 상태: on_track, delayed, completed
  
  // === 담당자 ===
  responsible_person: "정길자",
  responsible_company: "아이에이테크",
  responsible_department: "금형개발팀",
  
  // === 상태 ===
  status: "in_progress",               // registered, in_progress, completed, verified, closed
  progress_rate: 50,
  
  // === 양산 단계 추가 정보 (to_stage가 'PRODUCTION'인 경우) ===
  production_issue_type: "금형 수리",   // 양산 문제 유형
  repair_type: "정기 수리",             // 수리 유형
  downtime_hours: 4,                   // 생산 중단 시간
  auto_registered: false,              // 금형 수리 완료 후 자동 등록 여부
  repair_work_id: null,                // 연관된 금형 수리 작업 ID
  
  // === 메타 정보 ===
  created_by: 5,
  created_at: "2024-03-15T10:00:00Z",
  updated_at: "2024-03-16T14:30:00Z"
}
```

---

## 🗄️ 데이터베이스 스키마

### 1. 차종 마스터 (car_models)

```sql
CREATE TABLE car_models (
  id SERIAL PRIMARY KEY,
  car_model_code VARCHAR(50) UNIQUE,
  car_model_name VARCHAR(100),
  car_year VARCHAR(10),
  manufacturer VARCHAR(100),
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. 아이템 마스터 (items)

```sql
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  item_code VARCHAR(50) UNIQUE,
  item_name VARCHAR(200),
  item_category VARCHAR(100),
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. 차종-아이템 매핑 (car_model_items)

```sql
CREATE TABLE car_model_items (
  id SERIAL PRIMARY KEY,
  car_model_id INTEGER REFERENCES car_models(id),
  item_id INTEGER REFERENCES items(id),
  part_number VARCHAR(50),
  part_name VARCHAR(200),
  specification TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(car_model_id, item_id, part_number)
);
```

### 4. 금형 문제점 (mold_issues)

```sql
CREATE TABLE mold_issues (
  id SERIAL PRIMARY KEY,
  no INTEGER,                           -- 순번
  issue_id VARCHAR(50) UNIQUE,
  mold_id INTEGER REFERENCES molds(id),
  mold_number VARCHAR(50),
  
  -- 차종/부품 정보
  car_model_id INTEGER REFERENCES car_models(id),
  car_model VARCHAR(100),               -- 차종
  item_id INTEGER REFERENCES items(id),
  item_name VARCHAR(200),               -- 부품명
  part_number VARCHAR(50),              -- 품번
  part_name TEXT,                       -- 품명 (상세 설명)
  
  -- 단계 정보
  to_location VARCHAR(20),              -- T/O 장소: 'maker', 'production'
  to_stage VARCHAR(20),                 -- 단계: PROTO, P1, P2, T1, T2, M, SOP, PRODUCTION
  to_date DATE,
  
  -- 문제점 정보
  issue_description TEXT,               -- 문제점
  issue_images JSONB,                   -- 문제점 사진 [{url, caption, uploaded_at}]
  
  -- 원인 및 대책
  root_cause TEXT,                      -- 원인
  improvement_plan TEXT,                -- 대책
  improvement_images JSONB,             -- 대책 사진/도면 [{url, caption, uploaded_at}]
  
  -- 문제 유형
  issue_type VARCHAR(100),              -- 문제 유형: 설계 불량, 외관 불량, 치수 불량, 성형 불량 등
  severity VARCHAR(20),                 -- 심각도: low, medium, high, critical
  
  -- 개선 일정
  target_completion_date DATE,          -- 개선 완료 목표일
  actual_completion_date DATE,          -- 실제 완료일
  schedule_status VARCHAR(20),          -- 일정 상태: on_track, delayed, completed
  
  -- 담당자
  responsible_person VARCHAR(100),
  responsible_company VARCHAR(100),
  responsible_department VARCHAR(100),
  
  -- 상태
  status VARCHAR(20) DEFAULT 'registered',
  progress_rate INTEGER DEFAULT 0,
  
  -- 양산 단계 추가 정보
  production_issue_type VARCHAR(100),   -- 양산 문제 유형
  repair_type VARCHAR(50),              -- 수리 유형
  downtime_hours DECIMAL(10, 2),        -- 생산 중단 시간
  auto_registered BOOLEAN DEFAULT FALSE,-- 금형 수리 완료 후 자동 등록 여부
  repair_work_id INTEGER,               -- 연관된 금형 수리 작업 ID
  
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mold_issues_mold ON mold_issues(mold_id);
CREATE INDEX idx_mold_issues_car_model ON mold_issues(car_model_id);
CREATE INDEX idx_mold_issues_item ON mold_issues(item_id);
CREATE INDEX idx_mold_issues_to_stage ON mold_issues(to_stage);
CREATE INDEX idx_mold_issues_status ON mold_issues(status);
```

### 5. T/O 이력 관리 (trial_order_history)

```sql
CREATE TABLE trial_order_history (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER REFERENCES molds(id),
  mold_number VARCHAR(50),
  
  to_location VARCHAR(20),              -- T/O 장소: 'maker', 'production'
  to_stage VARCHAR(20),                 -- T/O 이벤트: PROTO, P1, P2, T1, T2, M, SOP, PRODUCTION
  to_date DATE,
  to_place VARCHAR(200),                -- T/O 실시 상세 장소 (예: 아이에이테크 공장, 지금강 1공장)
  
  result VARCHAR(20),
  total_issues INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  
  participants JSONB,
  notes TEXT,
  attachments JSONB,
  
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API 엔드포인트

```javascript
// 1. 문제점 목록 조회
GET /api/mold-issues
Query: car_model_id, item_id, to_stage, status, severity

// 2. 문제점 등록
POST /api/mold-issues

// 3. 문제점 수정
PATCH /api/mold-issues/:id

// 4. 문제점 삭제
DELETE /api/mold-issues/:id

// 5. 개선 완료 처리
POST /api/mold-issues/:id/complete

// 6. 검증 처리
POST /api/mold-issues/:id/verify

// 7. T/O 이력 등록
POST /api/trial-orders

// 8. 차종 마스터 관리
GET/POST/PATCH/DELETE /api/car-models

// 9. 아이템 마스터 관리
GET/POST/PATCH/DELETE /api/items
```

```javascript
// 1. 문제점 관리
POST   /api/mold-issues              // 문제점 등록
GET    /api/mold-issues              // 문제점 목록 조회
GET    /api/mold-issues/:id          // 문제점 상세 조회
PATCH  /api/mold-issues/:id          // 문제점 수정
DELETE /api/mold-issues/:id          // 문제점 삭제
POST   /api/mold-issues/:id/complete // 개선 완료 처리
POST   /api/mold-issues/:id/verify   // 검증 처리

// T/O 이력 관리
POST   /api/trial-orders             // T/O 이력 등록
GET    /api/trial-orders             // T/O 이력 조회

// 마스터 관리
GET    /api/car-models               // 차종 목록
POST   /api/car-models               // 차종 등록
PATCH  /api/car-models/:id           // 차종 수정
DELETE /api/car-models/:id           // 차종 삭제

GET    /api/items                    // 아이템 목록
POST   /api/items                    // 아이템 등록
PATCH  /api/items/:id                // 아이템 수정
DELETE /api/items/:id                // 아이템 삭제

GET    /api/car-model-items          // 차종-아이템 매핑 조회
POST   /api/car-model-items          // 차종-아이템 매핑 등록
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 1. 기본 정보                                                          │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ 금형 번호*     [M-2024-001 ▼]                                        │  │
│  │ 차종*          [GV80 ▼]                                               │  │
│  │ 아이템*        [프론트 범퍼 ▼]                                        │  │
│  │ 품번           86563-P1010 (자동 입력)                                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 2. T/O 정보                                                           │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ T/O 장소*      ⚪ 금형제작처   ⚪ 생산처                              │  │
│  │                                                                        │  │
│  │ T/O 이벤트*    [선택하세요 ▼]                                        │  │
│  │                                                                        │  │
│  │                ┌────────────────────────────────────────────────┐    │  │
│  │                │ ⚪ PROTO (시제품)                               │    │  │
│  │                │ ⚪ P1 (1차 시제품)                              │    │  │
│  │                │ ⚪ P2 (2차 시제품)                              │    │  │
│  │                │ ⚪ T1 (1차 시험생산)                            │    │  │
│  │                │ ⚪ T2 (2차 시험생산)                            │    │  │
│  │                │ ⚪ M (양산 준비)                                │    │  │
│  │                │ ⚪ SOP (양산 시작)                              │    │  │
│  │                │ ⚪ PRODUCTION (양산 중)                         │    │  │
│  │                └────────────────────────────────────────────────┘    │  │
│  │                                                                        │  │
│  │                ℹ️ 모든 이벤트는 T/O 장소와 무관하게 선택 가능합니다.  │  │
│  │                                                                        │  │
│  │ T/O 일자*      [2024-03-15]                                           │  │
│  │                                                                        │  │
│  │ T/O 실시 장소  [아이에이테크 공장_____________________________]       │  │
│  │                (상세 장소 입력 - 선택사항)                            │  │
│  │                                                                        │  │
│  │ ┌─ PRODUCTION 선택 시 추가 입력 ──────────────────────────────┐    │  │
│  │ │ 양산 문제 유형* [금형 수리 ▼]                                 │    │  │
│  │ │                 - 금형 수리, 품질 불량, 생산 중단 등           │    │  │
│  │ │                                                                │    │  │
│  │ │ 수리 유형*     [정기 수리 ▼]                                  │    │  │
│  │ │                 - 긴급 수리, 정기 수리, 예방 수리             │    │  │
│  │ │                                                                │    │  │
│  │ │ 생산 중단 시간 [4.0] 시간                                     │    │  │
│  │ └────────────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 3. 문제점 상세                                                        │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ 문제 카테고리* [외관 불량 ▼]                                         │  │
│  │                - 외관 불량, 치수 불량, 성형 불량, 조립 불량 등        │  │
│  │                                                                        │  │
│  │ 문제 유형*     [싱크마크 ▼]                                          │  │
│  │                - 싱크마크, 웰드라인, 변형, 크랙, 버 등                │  │
│  │                                                                        │  │
│  │ 심각도*        ⚪ 낮음  ⚪ 중간  ⚪ 높음  ⚪ 긴급                      │  │
│  │                                                                        │  │
│  │ 발생 위치*     [좌측 하단부 리브 부위_____________]                   │  │
│  │                                                                        │  │
│  │ 문제 설명*     ┌────────────────────────────────────────────────┐    │  │
│  │                │리브 부위에 싱크마크가 발생하여 외관 품질 저하  │    │  │
│  │                │깊이 약 0.3mm, 면적 약 5cm²                    │    │  │
│  │                └────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 4. 담당자 정보                                                        │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ 담당자*        [정길자_____________________]                          │  │
│  │ 담당 회사*     [아이에이테크 ▼]                                      │  │
│  │ 담당 부서      [금형개발팀_________________]                          │  │
│  │ 연락처         [010-1234-5678______________]                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 5. 일정                                                               │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ 목표 완료일*   [2024-03-25]                                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 6. 첨부 파일                                                          │  │
│  │                                                                        │  │
│  │ [파일 선택] 또는 드래그 앤 드롭                                       │  │
│  │                                                                        │  │
│  │ • 싱크마크_사진1.jpg (2.3 MB) [X]                                    │  │
│  │ • 싱크마크_사진2.jpg (1.8 MB) [X]                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│                                              [저장] [취소]                   │
└────────────────────────────────────────────────────────────────────────────┘
```

### 사용 예시

**예시 1: 금형제작처에서 T1 이벤트 실시**
- T/O 장소: 금형제작처
- T/O 이벤트: T1 (1차 시험생산)
- 상황: 금형제작처에서 생산처 설비 없이 T1 단계 시험 실시

**예시 2: 생산처에서 P2 이벤트 실시**
- T/O 장소: 생산처
- T/O 이벤트: P2 (2차 시제품)
- 상황: 생산처에서 금형 인수 전 P2 단계 재검증

**예시 3: 금형제작처에서 SOP 이벤트 실시**
- T/O 장소: 금형제작처
- T/O 이벤트: SOP (양산 시작)
- 상황: 금형제작처에서 양산 시작 전 최종 확인

**예시 4: 생산처에서 양산 중 금형 수리**
- T/O 장소: 생산처
- T/O 이벤트: PRODUCTION (양산 중)
- 양산 문제 유형: 금형 수리
- 수리 유형: 긴급 수리
- 생산 중단 시간: 8.0 시간
- 상황: 양산 중 금형 손상 발생, 긴급 수리 실시
