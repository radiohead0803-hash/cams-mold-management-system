# 양산이관 프로세스 워크플로우

## 📋 개요

제작처에서 금형 제작 완료 후 생산처로 양산 이관하는 전체 프로세스를 정의합니다.

---

## 🔄 양산이관 프로세스 흐름

```
제작완료 → 체크리스트작성 → 1차승인 → 2차승인 → 3차최종승인 → 이관완료 → 양산시작
    ↓           ↓            ↓          ↓           ↓            ↓           ↓
 maker       maker        생산처     품질팀    금형개발담당     자동처리     plant
```

### 다단계 승인 구조

| 단계 | 담당 | 역할 | 상태값 |
|------|------|------|--------|
| 0 | 제작처 | 체크리스트 작성 | `draft`, `checklist_in_progress` |
| 1차 | 생산처 | 점검 및 승인/반려 | `pending_plant_approval` |
| 2차 | 본사 품질팀 | 품질 검토 승인/반려 | `pending_quality_approval` |
| 3차 | 금형개발 담당 | 최종 승인/반려 | `pending_final_approval` |
| 완료 | 시스템 | 자동 상태 변경 | `approved`, `transferred` |

### 상세 단계

1. **제작완료 (Maker)**
   - 금형 제작 완료 상태 변경
   - 시운전(Try-out) PASS 확인
   - 제작완료 필수 서류 첨부

2. **체크리스트 작성 (Maker)**
   - 양산이관 체크리스트 마스터 기반 점검
   - 필수 항목 모두 체크
   - 첨부 자료 업로드
   - 완료 후 생산처로 점검 요청

3. **1차 승인 - 생산처 점검 (Plant)**
   - 제작처가 작성한 체크리스트 검토
   - 금형 실물 점검
   - 승인 → 2차 승인 단계로 이동
   - 반려 → 제작처에 보완 요청

4. **2차 승인 - 본사 품질팀**
   - 품질 관련 서류 검토
   - 시운전 결과 확인
   - 승인 → 3차 최종 승인 단계로 이동
   - 반려 → 사유와 함께 반려

5. **3차 최종 승인 - 금형개발 담당**
   - 전체 프로세스 최종 검토
   - 승인 시 자동 처리:
     - `development_stage`: '개발' → '양산'
     - 연동 테이블 자동 업데이트
   - 반려 → 사유와 함께 반려

6. **이관완료**
   - 최종 승인 완료 시 자동 상태 변경
   - 생산처 금형 마스터 자동 생성

7. **양산시작 (Plant)**
   - 생산처에서 금형 인수
   - 사출조건 입력
   - 양산 시작

---

## 📊 데이터베이스 스키마

### production_transfer_checklist_master (양산이관 체크리스트 마스터)
```sql
CREATE TABLE production_transfer_checklist_master (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,           -- 카테고리 (금형상태, 서류, 시운전결과 등)
  item_code VARCHAR(50) NOT NULL,           -- 항목 코드
  item_name VARCHAR(200) NOT NULL,          -- 항목명
  description TEXT,                          -- 상세 설명
  is_required BOOLEAN DEFAULT TRUE,          -- 필수 여부
  requires_attachment BOOLEAN DEFAULT FALSE, -- 첨부파일 필요 여부
  attachment_type VARCHAR(50),               -- 첨부파일 유형 (image, document, etc)
  display_order INTEGER DEFAULT 0,           -- 표시 순서
  is_active BOOLEAN DEFAULT TRUE,            -- 활성화 여부
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transfer_checklist_master_category ON production_transfer_checklist_master(category);
CREATE INDEX idx_transfer_checklist_master_active ON production_transfer_checklist_master(is_active);
```

### production_transfer_requests (양산이관 신청)
```sql
CREATE TABLE production_transfer_requests (
  id SERIAL PRIMARY KEY,
  request_number VARCHAR(50) UNIQUE NOT NULL, -- 신청번호 (자동생성)
  mold_id INTEGER NOT NULL REFERENCES molds(id),
  mold_spec_id INTEGER REFERENCES mold_specifications(id),
  
  -- 이관 정보
  from_maker_id INTEGER REFERENCES users(id),  -- 제작처
  to_plant_id INTEGER REFERENCES users(id),    -- 이관 대상 생산처
  
  -- 일정
  requested_date DATE NOT NULL,                -- 신청일
  planned_transfer_date DATE,                  -- 예정 이관일
  actual_transfer_date DATE,                   -- 실제 이관일
  
  -- 상태
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  -- 'draft': 작성중
  -- 'checklist_in_progress': 체크리스트 작성중
  -- 'pending_approval': 승인대기
  -- 'approved': 승인완료
  -- 'rejected': 반려
  -- 'transferred': 이관완료
  -- 'cancelled': 취소
  
  -- 승인 정보
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- 비고
  notes TEXT,
  
  -- 생성 정보
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transfer_requests_mold ON production_transfer_requests(mold_id);
CREATE INDEX idx_transfer_requests_status ON production_transfer_requests(status);
CREATE INDEX idx_transfer_requests_date ON production_transfer_requests(requested_date);
```

### production_transfer_checklist_items (양산이관 체크리스트 항목)
```sql
CREATE TABLE production_transfer_checklist_items (
  id SERIAL PRIMARY KEY,
  transfer_request_id INTEGER NOT NULL REFERENCES production_transfer_requests(id),
  master_item_id INTEGER NOT NULL REFERENCES production_transfer_checklist_master(id),
  
  -- 체크 결과
  is_checked BOOLEAN DEFAULT FALSE,
  check_result VARCHAR(20),                   -- 'pass', 'fail', 'na'
  check_value TEXT,                           -- 입력값 (필요시)
  remarks TEXT,                               -- 비고
  
  -- 첨부파일
  attachment_url TEXT,
  attachment_filename VARCHAR(255),
  
  -- 체크 정보
  checked_by INTEGER REFERENCES users(id),
  checked_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transfer_checklist_items_request ON production_transfer_checklist_items(transfer_request_id);
CREATE INDEX idx_transfer_checklist_items_master ON production_transfer_checklist_items(master_item_id);
```

### production_transfer_approvals (양산이관 승인 이력)
```sql
CREATE TABLE production_transfer_approvals (
  id SERIAL PRIMARY KEY,
  transfer_request_id INTEGER NOT NULL REFERENCES production_transfer_requests(id),
  
  -- 승인 단계 (다단계 승인 지원)
  approval_step INTEGER DEFAULT 1,            -- 승인 단계
  approval_type VARCHAR(30) NOT NULL,         -- 'submit', 'approve', 'reject', 'cancel'
  
  -- 승인자 정보
  approver_id INTEGER REFERENCES users(id),
  approver_name VARCHAR(100),
  approver_role VARCHAR(50),
  
  -- 승인 결과
  decision VARCHAR(20),                       -- 'approved', 'rejected', 'pending'
  comments TEXT,
  
  -- 시간
  action_at TIMESTAMP DEFAULT NOW(),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transfer_approvals_request ON production_transfer_approvals(transfer_request_id);
CREATE INDEX idx_transfer_approvals_approver ON production_transfer_approvals(approver_id);
```

---

## 📝 양산이관 체크리스트 마스터 항목

### 1. 금형 상태 (Mold Condition)
| 코드 | 항목명 | 필수 | 첨부 |
|------|--------|------|------|
| MC001 | 금형 외관 상태 확인 | ✅ | 사진 |
| MC002 | 상형/하형 상태 확인 | ✅ | 사진 |
| MC003 | 냉각 라인 상태 확인 | ✅ | - |
| MC004 | 슬라이드/리프터 작동 확인 | ✅ | - |
| MC005 | 이젝터 핀 상태 확인 | ✅ | - |
| MC006 | 핫러너 작동 확인 | ⬜ | - |

### 2. 서류 (Documents)
| 코드 | 항목명 | 필수 | 첨부 |
|------|--------|------|------|
| DC001 | 금형 도면 | ✅ | 문서 |
| DC002 | 금형 인자표 | ✅ | 문서 |
| DC003 | 성형해석 자료 | ✅ | 문서 |
| DC004 | 경도 측정 성적서 | ✅ | 문서 |
| DC005 | 시운전 결과 보고서 | ✅ | 문서 |

### 3. 시운전 결과 (Try-out Results)
| 코드 | 항목명 | 필수 | 첨부 |
|------|--------|------|------|
| TR001 | 초도품 치수 검사 결과 | ✅ | 문서 |
| TR002 | 초도품 외관 검사 결과 | ✅ | 사진 |
| TR003 | 사이클 타임 확인 | ✅ | - |
| TR004 | 사출 조건 기록 | ✅ | 문서 |

### 4. 이관 준비 (Transfer Preparation)
| 코드 | 항목명 | 필수 | 첨부 |
|------|--------|------|------|
| TP001 | QR 코드 명판 부착 확인 | ✅ | 사진 |
| TP002 | 금형 청소 완료 | ✅ | - |
| TP003 | 방청 처리 완료 | ✅ | - |
| TP004 | 포장 상태 확인 | ✅ | 사진 |

---

## 🔔 알림 및 연동

### 알림 발송 시점
1. **이관신청 시**: 본사 담당자에게 알림
2. **체크리스트 완료 시**: 승인자에게 알림
3. **승인/반려 시**: 신청자에게 알림
4. **이관완료 시**: 생산처 담당자에게 알림

### 자동 연동
1. **승인 완료 시**:
   - `mold_specifications.development_stage` → '양산'
   - `maker_specifications.development_stage` → '양산'
   - `plant_molds` 레코드 자동 생성

2. **이관 완료 시**:
   - `molds.current_location` 업데이트
   - `mold_location_logs` 이력 추가

---

## 📱 화면 구성

### 1. 양산이관 목록 (PC)
- 전체 이관 신청 목록
- 상태별 필터링
- 검색 기능

### 2. 양산이관 신청 (PC/Mobile)
- 금형 선택
- 이관 대상 생산처 선택
- 예정 이관일 입력

### 3. 체크리스트 작성 (PC/Mobile)
- 카테고리별 체크 항목
- 첨부파일 업로드
- 비고 입력

### 4. 승인 화면 (PC)
- 체크리스트 검토
- 승인/반려 버튼
- 반려 사유 입력

---

## 🔐 권한

| 기능 | system_admin | mold_developer | quality_team | maker | plant |
|------|:------------:|:--------------:|:------------:|:-----:|:-----:|
| 체크리스트 마스터 관리 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| 이관 신청 | ⬜ | ⬜ | ⬜ | ✅ | ⬜ |
| 체크리스트 작성 | ⬜ | ⬜ | ⬜ | ✅ | ⬜ |
| 1차 승인 (점검) | ⬜ | ⬜ | ⬜ | ⬜ | ✅ |
| 2차 승인 (품질) | ⬜ | ⬜ | ✅ | ⬜ | ⬜ |
| 3차 최종 승인 | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| 이관 완료 확인 | ⬜ | ✅ | ⬜ | ⬜ | ✅ |
