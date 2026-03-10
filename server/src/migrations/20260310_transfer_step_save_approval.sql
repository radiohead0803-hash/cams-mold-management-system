-- ============================================================
-- 이관관리 단계별 임시저장/승인 시스템 마이그레이션 (2026-03-10)
-- transfers 테이블 확장 + 관련 테이블 보정
-- ============================================================

-- 1. transfers 테이블: from_location/to_location NULL 허용 (업체 ID 기반으로 변경)
ALTER TABLE transfers ALTER COLUMN from_location DROP NOT NULL;
ALTER TABLE transfers ALTER COLUMN to_location DROP NOT NULL;

-- 2. transfers 테이블: 단계별 저장/승인에 필요한 컬럼 추가
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS current_step VARCHAR(50) DEFAULT '요청';
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT '보통';
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS from_manager_name VARCHAR(100);
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS from_manager_contact VARCHAR(50);
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS to_manager_name VARCHAR(100);
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS to_manager_contact VARCHAR(50);
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS developer_name VARCHAR(100);
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS developer_contact VARCHAR(50);

-- 3. 단계별 승인 상태 컬럼 (3단계: 인계승인, 검수승인, 이관승인)
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS handover_approval_status VARCHAR(20) DEFAULT '대기';
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS handover_approval_date TIMESTAMP;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS handover_approver_id INTEGER REFERENCES users(id);
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS handover_rejection_reason TEXT;

ALTER TABLE transfers ADD COLUMN IF NOT EXISTS inspection_approval_status VARCHAR(20) DEFAULT '대기';
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS inspection_approval_date TIMESTAMP;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS inspection_approver_id INTEGER REFERENCES users(id);
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS inspection_rejection_reason TEXT;

ALTER TABLE transfers ADD COLUMN IF NOT EXISTS transfer_approval_status VARCHAR(20) DEFAULT '대기';
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS transfer_approval_date TIMESTAMP;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS transfer_approver_id INTEGER REFERENCES users(id);
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS transfer_rejection_reason TEXT;

-- 4. PostgreSQL에서는 COMMENT ON 사용
COMMENT ON COLUMN transfers.current_step IS '현재 저장 단계 (요청/점검/인계승인/검수승인/이관승인/완료)';
COMMENT ON COLUMN transfers.priority IS '우선순위 (낮음/보통/높음/긴급)';
COMMENT ON COLUMN transfers.from_manager_name IS '인계업체 담당자명';
COMMENT ON COLUMN transfers.from_manager_contact IS '인계업체 담당자 연락처';
COMMENT ON COLUMN transfers.to_manager_name IS '인수업체 담당자명';
COMMENT ON COLUMN transfers.to_manager_contact IS '인수업체 담당자 연락처';
COMMENT ON COLUMN transfers.developer_name IS '개발담당자명';
COMMENT ON COLUMN transfers.developer_contact IS '개발담당자 연락처';
COMMENT ON COLUMN transfers.handover_approval_status IS '인계준비 승인상태 (대기/승인완료/반려)';
COMMENT ON COLUMN transfers.inspection_approval_status IS '검수 승인상태 (대기/승인완료/반려)';
COMMENT ON COLUMN transfers.transfer_approval_status IS '이관 승인상태 (대기/승인완료/반려)';

-- 5. transfer_4m_checklist 테이블 (없으면 생성)
CREATE TABLE IF NOT EXISTS transfer_4m_checklist (
  id SERIAL PRIMARY KEY,
  transfer_id INTEGER NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  checklist_type VARCHAR(50) NOT NULL,
  -- Man
  man_operator_assigned BOOLEAN DEFAULT false,
  man_operator_name VARCHAR(100),
  man_training_completed BOOLEAN DEFAULT false,
  man_training_date DATE,
  man_skill_level VARCHAR(20),
  man_notes TEXT,
  -- Machine
  machine_tonnage_check BOOLEAN DEFAULT false,
  machine_tonnage_value INTEGER,
  machine_spec_compatible BOOLEAN DEFAULT false,
  machine_condition_check BOOLEAN DEFAULT false,
  machine_injection_unit_check BOOLEAN DEFAULT false,
  machine_notes TEXT,
  -- Material
  material_type_confirmed BOOLEAN DEFAULT false,
  material_name VARCHAR(100),
  material_grade VARCHAR(100),
  material_drying_condition BOOLEAN DEFAULT false,
  material_drying_temp INTEGER,
  material_drying_time INTEGER,
  material_color_confirmed BOOLEAN DEFAULT false,
  material_notes TEXT,
  -- Method
  method_sop_available BOOLEAN DEFAULT false,
  method_sop_version VARCHAR(50),
  method_injection_condition BOOLEAN DEFAULT false,
  method_cycle_time_set BOOLEAN DEFAULT false,
  method_cycle_time_value NUMERIC(10,2),
  method_quality_standard BOOLEAN DEFAULT false,
  method_notes TEXT,
  -- Status
  overall_status VARCHAR(20) DEFAULT 'pending',
  checked_by INTEGER REFERENCES users(id),
  checked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. transfer_shipment_checklist 테이블 (없으면 생성)
CREATE TABLE IF NOT EXISTS transfer_shipment_checklist (
  id SERIAL PRIMARY KEY,
  transfer_id INTEGER NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  mold_condition_check BOOLEAN DEFAULT false,
  mold_condition_notes TEXT,
  mold_cleaning_done BOOLEAN DEFAULT false,
  mold_rust_prevention BOOLEAN DEFAULT false,
  accessories_check BOOLEAN DEFAULT false,
  accessories_list JSONB DEFAULT '[]',
  spare_parts_included BOOLEAN DEFAULT false,
  spare_parts_list JSONB DEFAULT '[]',
  documents_included BOOLEAN DEFAULT false,
  document_list JSONB DEFAULT '[]',
  drawing_included BOOLEAN DEFAULT false,
  sop_included BOOLEAN DEFAULT false,
  packaging_done BOOLEAN DEFAULT false,
  packaging_type VARCHAR(50),
  packaging_photos JSONB DEFAULT '[]',
  shipment_gps_lat NUMERIC(10,7),
  shipment_gps_lng NUMERIC(10,7),
  shipper_name VARCHAR(100),
  shipper_signature TEXT,
  shipped_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 7. transfer_receiving_checklist 테이블 (없으면 생성)
CREATE TABLE IF NOT EXISTS transfer_receiving_checklist (
  id SERIAL PRIMARY KEY,
  transfer_id INTEGER NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  mold_condition_check BOOLEAN DEFAULT false,
  mold_condition_notes TEXT,
  damage_found BOOLEAN DEFAULT false,
  damage_description TEXT,
  damage_photos JSONB DEFAULT '[]',
  accessories_received BOOLEAN DEFAULT false,
  accessories_missing JSONB DEFAULT '[]',
  spare_parts_received BOOLEAN DEFAULT false,
  spare_parts_missing JSONB DEFAULT '[]',
  documents_received BOOLEAN DEFAULT false,
  documents_missing JSONB DEFAULT '[]',
  packaging_condition VARCHAR(50),
  packaging_notes TEXT,
  receiving_gps_lat NUMERIC(10,7),
  receiving_gps_lng NUMERIC(10,7),
  receiver_name VARCHAR(100),
  receiver_signature TEXT,
  received_at TIMESTAMP,
  issue_reported BOOLEAN DEFAULT false,
  issue_description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 8. 인덱스
CREATE INDEX IF NOT EXISTS idx_transfers_current_step ON transfers(current_step);
CREATE INDEX IF NOT EXISTS idx_transfers_priority ON transfers(priority);
CREATE INDEX IF NOT EXISTS idx_transfer_4m_transfer_id ON transfer_4m_checklist(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_shipment_transfer_id ON transfer_shipment_checklist(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_receiving_transfer_id ON transfer_receiving_checklist(transfer_id);

SELECT '이관관리 단계별 임시저장/승인 마이그레이션 완료' as result;
