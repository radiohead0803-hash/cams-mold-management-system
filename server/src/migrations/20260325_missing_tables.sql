-- =============================================
-- 누락 테이블 6개 생성 (컨트롤러에서 참조하지만 DB에 없는 테이블)
-- =============================================

-- 1. checklist_template_versions (체크리스트 템플릿 버전 관리)
CREATE TABLE IF NOT EXISTS checklist_template_versions (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  version_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'draft',
  items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by INTEGER,
  approved_by INTEGER,
  deployed_by INTEGER,
  approved_at TIMESTAMP,
  deployed_at TIMESTAMP,
  rollback_from INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_template_versions_template ON checklist_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_status ON checklist_template_versions(status);

-- 2. injection_condition_history (사출조건 변경 이력)
CREATE TABLE IF NOT EXISTS injection_condition_history (
  id SERIAL PRIMARY KEY,
  injection_condition_id INTEGER REFERENCES injection_conditions(id) ON DELETE CASCADE,
  mold_spec_id INTEGER,
  change_type VARCHAR(50),
  field_name VARCHAR(100),
  field_label VARCHAR(200),
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  changed_by INTEGER,
  changed_at TIMESTAMP DEFAULT NOW(),
  approved_by INTEGER,
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  writer_type VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_injection_history_condition ON injection_condition_history(injection_condition_id);
CREATE INDEX IF NOT EXISTS idx_injection_history_mold_spec ON injection_condition_history(mold_spec_id);
CREATE INDEX IF NOT EXISTS idx_injection_history_status ON injection_condition_history(status);
COMMENT ON TABLE injection_condition_history IS '사출조건 변경 이력 테이블';

-- 3. mold_transfers (금형 이관 마스터)
CREATE TABLE IF NOT EXISTS mold_transfers (
  id SERIAL PRIMARY KEY,
  transfer_number VARCHAR(50) UNIQUE,
  mold_id INTEGER NOT NULL REFERENCES molds(id),
  from_company_id INTEGER REFERENCES companies(id),
  to_company_id INTEGER REFERENCES companies(id),
  transfer_type VARCHAR(30),
  reason TEXT,
  status VARCHAR(30) DEFAULT 'pending',
  requested_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  shipped_at TIMESTAMP,
  received_at TIMESTAMP,
  received_by INTEGER,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mold_transfers_mold ON mold_transfers(mold_id);
CREATE INDEX IF NOT EXISTS idx_mold_transfers_status ON mold_transfers(status);

-- 4. pre_production_checklist_results (제작전 체크리스트 점검 결과)
CREATE TABLE IF NOT EXISTS pre_production_checklist_results (
  id SERIAL PRIMARY KEY,
  checklist_id INTEGER NOT NULL REFERENCES pre_production_checklists(id),
  item_id INTEGER NOT NULL REFERENCES pre_production_checklist_items(id),
  is_applicable BOOLEAN DEFAULT true,
  spec_value TEXT,
  is_checked BOOLEAN DEFAULT false,
  result_value TEXT,
  remarks TEXT,
  checked_by INTEGER,
  checked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_preproduction_results_checklist ON pre_production_checklist_results(checklist_id);
CREATE INDEX IF NOT EXISTS idx_preproduction_results_item ON pre_production_checklist_results(item_id);

-- 5. production_transfer_attachments (양산이관 첨부파일)
CREATE TABLE IF NOT EXISTS production_transfer_attachments (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES production_transfer_requests(id) ON DELETE CASCADE,
  item_id INTEGER,
  mold_id INTEGER,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  file_path TEXT,
  file_url TEXT,
  file_data BYTEA,
  upload_type VARCHAR(30) DEFAULT 'local',
  cloudinary_public_id VARCHAR(255),
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_production_transfer_attachments_request_id ON production_transfer_attachments(request_id);
CREATE INDEX IF NOT EXISTS idx_production_transfer_attachments_item_id ON production_transfer_attachments(item_id);
CREATE INDEX IF NOT EXISTS idx_production_transfer_attachments_mold_id ON production_transfer_attachments(mold_id);

-- 6. transfer_history (이관 이력)
CREATE TABLE IF NOT EXISTS transfer_history (
  id SERIAL PRIMARY KEY,
  transfer_id INTEGER,
  mold_id INTEGER,
  action_type VARCHAR(50) NOT NULL,
  action_description TEXT,
  old_status VARCHAR(30),
  new_status VARCHAR(30),
  performed_by INTEGER REFERENCES users(id),
  performed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transfer_history_transfer ON transfer_history(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_history_mold ON transfer_history(mold_id);
CREATE INDEX IF NOT EXISTS idx_transfer_history_performed_at ON transfer_history(performed_at);
