-- =============================================
-- 1. checklist_instances 테이블에 승인 워크플로우 컬럼 추가
-- =============================================
ALTER TABLE checklist_instances
  ALTER COLUMN template_id DROP NOT NULL,
  ALTER COLUMN site_type DROP NOT NULL;

ALTER TABLE checklist_instances
  ADD COLUMN IF NOT EXISTS check_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS results JSONB,
  ADD COLUMN IF NOT EXISTS production_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS summary JSONB,
  ADD COLUMN IF NOT EXISTS inspector_id BIGINT,
  ADD COLUMN IF NOT EXISTS inspector_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS approver_id BIGINT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_by BIGINT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejected_by BIGINT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id);

-- status 컬럼 comment 업데이트 (draft | pending_approval | completed | rejected)
CREATE INDEX IF NOT EXISTS idx_checklist_instances_status ON checklist_instances(status);
CREATE INDEX IF NOT EXISTS idx_checklist_instances_approver ON checklist_instances(approver_id);
CREATE INDEX IF NOT EXISTS idx_checklist_instances_inspector ON checklist_instances(inspector_id);

-- =============================================
-- 2. repair_requests 테이블에 plant_id 컬럼 추가 (누락분)
-- =============================================
ALTER TABLE repair_requests
  ADD COLUMN IF NOT EXISTS plant_id BIGINT,
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS developer_id BIGINT,
  ADD COLUMN IF NOT EXISTS developer_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS maker_company_id BIGINT,
  ADD COLUMN IF NOT EXISTS maker_company_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS first_approved_by BIGINT,
  ADD COLUMN IF NOT EXISTS first_approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS first_approval_notes TEXT,
  ADD COLUMN IF NOT EXISTS final_approved_by BIGINT,
  ADD COLUMN IF NOT EXISTS final_approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS final_approval_notes TEXT,
  ADD COLUMN IF NOT EXISTS maker_started_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS maker_completed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS maker_notes TEXT,
  ADD COLUMN IF NOT EXISTS plant_confirmed_by BIGINT,
  ADD COLUMN IF NOT EXISTS plant_confirmed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS plant_confirmation_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_repair_requests_plant_id ON repair_requests(plant_id);
CREATE INDEX IF NOT EXISTS idx_repair_requests_workflow_status ON repair_requests(workflow_status);
