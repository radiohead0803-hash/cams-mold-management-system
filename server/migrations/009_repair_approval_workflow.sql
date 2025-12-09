-- 수리요청 승인 워크플로우 필드 추가
-- 업무 흐름: 생산처 요청 → 개발담당 승인 → 제작처 수리 → 개발담당 승인 → 생산처 확인

-- 1. repair_requests 테이블에 워크플로우 필드 추가
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50) DEFAULT 'plant_requested';
-- workflow_status 값:
-- plant_requested: 생산처 요청
-- hq_approved: 개발담당 1차 승인 (제작처 배정)
-- maker_in_progress: 제작처 수리 진행
-- maker_completed: 제작처 수리 완료
-- hq_final_approved: 개발담당 최종 승인
-- plant_confirmed: 생산처 확인 완료
-- rejected: 반려

-- 개발담당자 정보
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS developer_id BIGINT;
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS developer_name VARCHAR(100);

-- 1차 승인 (개발담당 → 제작처 배정)
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS first_approved_by BIGINT;
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS first_approved_at TIMESTAMP;
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS first_approval_notes TEXT;

-- 제작처 정보
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS maker_company_id BIGINT;
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS maker_company_name VARCHAR(100);
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS maker_started_at TIMESTAMP;
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS maker_completed_at TIMESTAMP;
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS maker_notes TEXT;

-- 최종 승인 (개발담당)
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS final_approved_by BIGINT;
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS final_approved_at TIMESTAMP;
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS final_approval_notes TEXT;

-- 생산처 확인
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS plant_confirmed_by BIGINT;
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS plant_confirmed_at TIMESTAMP;
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS plant_confirmation_notes TEXT;

-- 2. 알림 테이블 (notifications)에 수리요청 관련 필드 추가
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS repair_request_id BIGINT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS workflow_action VARCHAR(50);
-- workflow_action 값: request, approve, reject, assign, complete, confirm

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_repair_requests_workflow_status ON repair_requests(workflow_status);
CREATE INDEX IF NOT EXISTS idx_repair_requests_developer_id ON repair_requests(developer_id);
CREATE INDEX IF NOT EXISTS idx_repair_requests_maker_company_id ON repair_requests(maker_company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_repair_request_id ON notifications(repair_request_id);

-- 4. 개발단계 승인 테이블 (development_approvals)
CREATE TABLE IF NOT EXISTS development_approvals (
    id SERIAL PRIMARY KEY,
    mold_spec_id BIGINT NOT NULL,
    process_step_id BIGINT,
    approval_type VARCHAR(50) NOT NULL, -- checklist, specification, design, trial, etc.
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, revision_requested
    
    -- 요청자 (제작처)
    requester_id BIGINT,
    requester_company_id BIGINT,
    requester_company_name VARCHAR(100),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    request_notes TEXT,
    
    -- 승인자 (개발담당)
    approver_id BIGINT,
    approver_name VARCHAR(100),
    approved_at TIMESTAMP,
    approval_notes TEXT,
    
    -- 반려/재승인
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    revision_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_development_approvals_mold_spec_id ON development_approvals(mold_spec_id);
CREATE INDEX IF NOT EXISTS idx_development_approvals_status ON development_approvals(status);
CREATE INDEX IF NOT EXISTS idx_development_approvals_approver_id ON development_approvals(approver_id);
