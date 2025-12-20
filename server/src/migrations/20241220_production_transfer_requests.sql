-- 양산이관 요청 테이블
CREATE TABLE IF NOT EXISTS production_transfer_requests (
    id SERIAL PRIMARY KEY,
    mold_id INTEGER REFERENCES molds(id),
    mold_spec_id INTEGER REFERENCES mold_specifications(id),
    
    -- 이관 정보
    transfer_date DATE,
    reason TEXT,
    remarks TEXT,
    
    -- 체크리스트 결과 (JSON)
    checklist_results JSONB DEFAULT '{}',
    
    -- 첨부파일 정보 (JSON)
    attachments JSONB DEFAULT '{}',
    
    -- 상태
    status VARCHAR(50) DEFAULT 'draft',
    -- draft, pending_plant, pending_quality, pending_final, approved, rejected, transferred
    
    -- 승인 정보
    plant_approved_by INTEGER REFERENCES users(id),
    plant_approved_at TIMESTAMP,
    quality_approved_by INTEGER REFERENCES users(id),
    quality_approved_at TIMESTAMP,
    final_approved_by INTEGER REFERENCES users(id),
    final_approved_at TIMESTAMP,
    
    -- 거절 정보
    rejected_by INTEGER REFERENCES users(id),
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- 작성자 정보
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_production_transfer_requests_mold_id ON production_transfer_requests(mold_id);
CREATE INDEX IF NOT EXISTS idx_production_transfer_requests_mold_spec_id ON production_transfer_requests(mold_spec_id);
CREATE INDEX IF NOT EXISTS idx_production_transfer_requests_status ON production_transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_production_transfer_requests_created_by ON production_transfer_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_production_transfer_requests_created_at ON production_transfer_requests(created_at);

-- 양산이관 첨부파일 테이블
CREATE TABLE IF NOT EXISTS production_transfer_attachments (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES production_transfer_requests(id) ON DELETE CASCADE,
    item_id INTEGER, -- 체크리스트 항목 ID
    mold_id INTEGER REFERENCES molds(id),
    
    -- 파일 정보
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    file_path VARCHAR(500),
    file_url VARCHAR(500),
    
    -- 업로드 유형
    upload_type VARCHAR(50) DEFAULT 'image', -- image, document
    
    -- 메타데이터
    metadata JSONB DEFAULT '{}',
    
    -- 작성자 정보
    uploaded_by INTEGER REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_production_transfer_attachments_request_id ON production_transfer_attachments(request_id);
CREATE INDEX IF NOT EXISTS idx_production_transfer_attachments_item_id ON production_transfer_attachments(item_id);
CREATE INDEX IF NOT EXISTS idx_production_transfer_attachments_mold_id ON production_transfer_attachments(mold_id);

-- 코멘트
COMMENT ON TABLE production_transfer_requests IS '양산이관 요청 테이블';
COMMENT ON TABLE production_transfer_attachments IS '양산이관 첨부파일 테이블';
COMMENT ON COLUMN production_transfer_requests.checklist_results IS '체크리스트 점검 결과 (JSON 형식)';
COMMENT ON COLUMN production_transfer_requests.attachments IS '첨부파일 정보 요약 (JSON 형식)';
