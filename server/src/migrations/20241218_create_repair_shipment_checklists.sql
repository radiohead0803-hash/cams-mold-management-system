-- 금형 수리 후 출하단계 점검 체크리스트 테이블
-- 수리 완료 → 출하 전 필수 점검
-- 제작처 1차 점검 → 본사 승인

-- 1. 체크리스트 메인 테이블
CREATE TABLE IF NOT EXISTS repair_shipment_checklists (
  id SERIAL PRIMARY KEY,
  
  -- 체크리스트 번호 (RSC-YYYYMMDD-XXX)
  checklist_number VARCHAR(50),
  
  -- 수리요청 연결
  repair_request_id BIGINT NOT NULL,
  
  -- 금형 정보
  mold_id BIGINT NOT NULL,
  mold_spec_id BIGINT,
  
  -- 상태: draft | in_progress | pending_approval | approved | rejected | shipped
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  
  -- 제작처 정보
  maker_id BIGINT,
  maker_checker_id BIGINT,
  maker_checker_name VARCHAR(100),
  maker_check_date TIMESTAMP,
  
  -- 본사 승인 정보
  hq_approver_id BIGINT,
  hq_approver_name VARCHAR(100),
  hq_approval_date TIMESTAMP,
  hq_rejection_reason TEXT,
  
  -- GPS 위치
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  gps_address VARCHAR(500),
  
  -- 출하 정보
  shipment_destination VARCHAR(200),
  shipment_date TIMESTAMP,
  
  -- 시운전 정보
  trial_run_required BOOLEAN DEFAULT FALSE,
  trial_run_result VARCHAR(30), -- pass | conditional_pass | fail
  trial_run_condition TEXT,
  
  -- 점검 결과 요약
  total_items INTEGER DEFAULT 0,
  passed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  na_items INTEGER DEFAULT 0,
  
  -- 비고
  notes TEXT,
  
  -- 메타데이터
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_repair_shipment_checklists_repair_request ON repair_shipment_checklists(repair_request_id);
CREATE INDEX IF NOT EXISTS idx_repair_shipment_checklists_mold ON repair_shipment_checklists(mold_id);
CREATE INDEX IF NOT EXISTS idx_repair_shipment_checklists_status ON repair_shipment_checklists(status);
CREATE INDEX IF NOT EXISTS idx_repair_shipment_checklists_maker ON repair_shipment_checklists(maker_id);
CREATE INDEX IF NOT EXISTS idx_repair_shipment_checklists_hq_approver ON repair_shipment_checklists(hq_approver_id);

-- 2. 체크리스트 항목 테이블
CREATE TABLE IF NOT EXISTS repair_shipment_checklist_items (
  id SERIAL PRIMARY KEY,
  
  checklist_id BIGINT NOT NULL REFERENCES repair_shipment_checklists(id) ON DELETE CASCADE,
  
  -- 카테고리 정보
  category_code VARCHAR(20) NOT NULL, -- repair_history, surface, function, dimension, cooling, trial, shipment, final
  category_name VARCHAR(100) NOT NULL,
  category_order INTEGER DEFAULT 0,
  
  -- 항목 정보
  item_code VARCHAR(20) NOT NULL, -- 1-1, 1-2, ...
  item_name VARCHAR(200) NOT NULL,
  item_description TEXT,
  item_order INTEGER DEFAULT 0,
  
  -- 점검 결과: pass | fail | na | pending
  result VARCHAR(20),
  
  -- 사진 필수 여부 (전체 항목 사진 필수)
  photo_required BOOLEAN DEFAULT TRUE,
  
  -- 첨부 사진 URL들
  photo_urls JSONB,
  
  -- Before/After 사진 (수리 전후 비교)
  before_photo_url VARCHAR(500),
  after_photo_url VARCHAR(500),
  
  -- 비고/메모
  notes TEXT,
  
  -- 불합격 사유
  fail_reason TEXT,
  
  -- 점검자 정보
  checked_by BIGINT,
  checked_by_name VARCHAR(100),
  checked_at TIMESTAMP,
  
  -- 메타데이터 (Shim 변경 정보 등)
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_repair_shipment_checklist_items_checklist ON repair_shipment_checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_repair_shipment_checklist_items_category ON repair_shipment_checklist_items(category_code);
CREATE INDEX IF NOT EXISTS idx_repair_shipment_checklist_items_result ON repair_shipment_checklist_items(result);

-- 코멘트
COMMENT ON TABLE repair_shipment_checklists IS '금형 수리 후 출하단계 점검 체크리스트';
COMMENT ON TABLE repair_shipment_checklist_items IS '금형 수리 후 출하단계 점검 체크리스트 항목';

COMMENT ON COLUMN repair_shipment_checklists.status IS 'draft: 작성중, in_progress: 점검중, pending_approval: 승인대기, approved: 승인완료, rejected: 반려, shipped: 출하완료';
COMMENT ON COLUMN repair_shipment_checklist_items.category_code IS 'repair_history: 수리이력, surface: 성형면, function: 기능부, dimension: 치수, cooling: 냉각, trial: 시운전, shipment: 출하준비, final: 최종확인';
COMMENT ON COLUMN repair_shipment_checklist_items.result IS 'pass: 합격, fail: 불합격, na: 해당없음, pending: 미점검';
