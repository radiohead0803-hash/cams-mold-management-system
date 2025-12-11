-- 양산이관 체크리스트 마스터 테이블
CREATE TABLE IF NOT EXISTS production_transfer_checklist_master (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  item_code VARCHAR(50) NOT NULL,
  item_name VARCHAR(200) NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT TRUE,
  requires_attachment BOOLEAN DEFAULT FALSE,
  attachment_type VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfer_checklist_master_category ON production_transfer_checklist_master(category);
CREATE INDEX IF NOT EXISTS idx_transfer_checklist_master_active ON production_transfer_checklist_master(is_active);

-- 양산이관 신청 테이블 (다단계 승인)
CREATE TABLE IF NOT EXISTS production_transfer_requests (
  id SERIAL PRIMARY KEY,
  request_number VARCHAR(50) UNIQUE NOT NULL,
  mold_id INTEGER REFERENCES molds(id),
  mold_spec_id INTEGER REFERENCES mold_specifications(id),
  from_maker_id INTEGER REFERENCES users(id),
  to_plant_id INTEGER REFERENCES users(id),
  requested_date DATE NOT NULL,
  planned_transfer_date DATE,
  actual_transfer_date DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  current_approval_step INTEGER DEFAULT 0,
  
  -- 1차 승인 (생산처)
  plant_approved_by INTEGER REFERENCES users(id),
  plant_approved_at TIMESTAMP WITH TIME ZONE,
  plant_approval_status VARCHAR(20),
  plant_rejection_reason TEXT,
  
  -- 2차 승인 (본사 품질팀)
  quality_approved_by INTEGER REFERENCES users(id),
  quality_approved_at TIMESTAMP WITH TIME ZONE,
  quality_approval_status VARCHAR(20),
  quality_rejection_reason TEXT,
  
  -- 3차 최종 승인 (금형개발 담당)
  final_approved_by INTEGER REFERENCES users(id),
  final_approved_at TIMESTAMP WITH TIME ZONE,
  final_approval_status VARCHAR(20),
  final_rejection_reason TEXT,
  
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfer_requests_mold ON production_transfer_requests(mold_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_status ON production_transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_date ON production_transfer_requests(requested_date);

-- 양산이관 체크리스트 항목 테이블
CREATE TABLE IF NOT EXISTS production_transfer_checklist_items (
  id SERIAL PRIMARY KEY,
  transfer_request_id INTEGER NOT NULL REFERENCES production_transfer_requests(id),
  master_item_id INTEGER NOT NULL REFERENCES production_transfer_checklist_master(id),
  is_checked BOOLEAN DEFAULT FALSE,
  check_result VARCHAR(20),
  check_value TEXT,
  remarks TEXT,
  attachment_url TEXT,
  attachment_filename VARCHAR(255),
  checked_by INTEGER REFERENCES users(id),
  checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfer_checklist_items_request ON production_transfer_checklist_items(transfer_request_id);
CREATE INDEX IF NOT EXISTS idx_transfer_checklist_items_master ON production_transfer_checklist_items(master_item_id);

-- 양산이관 승인 이력 테이블
CREATE TABLE IF NOT EXISTS production_transfer_approvals (
  id SERIAL PRIMARY KEY,
  transfer_request_id INTEGER NOT NULL REFERENCES production_transfer_requests(id),
  approval_step INTEGER DEFAULT 1,
  approval_type VARCHAR(30) NOT NULL,
  approver_id INTEGER REFERENCES users(id),
  approver_name VARCHAR(100),
  approver_role VARCHAR(50),
  decision VARCHAR(20),
  comments TEXT,
  action_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfer_approvals_request ON production_transfer_approvals(transfer_request_id);
CREATE INDEX IF NOT EXISTS idx_transfer_approvals_approver ON production_transfer_approvals(approver_id);

-- 초기 체크리스트 마스터 데이터 삽입
INSERT INTO production_transfer_checklist_master (category, item_code, item_name, description, is_required, requires_attachment, attachment_type, display_order) VALUES
-- 금형 상태 (Mold Condition)
('금형상태', 'MC001', '금형 외관 상태 확인', '금형 외관에 손상, 녹, 변형 등이 없는지 확인', TRUE, TRUE, 'image', 1),
('금형상태', 'MC002', '상형/하형 상태 확인', '상형과 하형의 맞물림 및 상태 확인', TRUE, TRUE, 'image', 2),
('금형상태', 'MC003', '냉각 라인 상태 확인', '냉각 라인의 누수 및 막힘 여부 확인', TRUE, FALSE, NULL, 3),
('금형상태', 'MC004', '슬라이드/리프터 작동 확인', '슬라이드 및 리프터의 원활한 작동 확인', TRUE, FALSE, NULL, 4),
('금형상태', 'MC005', '이젝터 핀 상태 확인', '이젝터 핀의 마모 및 손상 여부 확인', TRUE, FALSE, NULL, 5),
('금형상태', 'MC006', '핫러너 작동 확인', '핫러너 시스템의 정상 작동 확인 (해당시)', FALSE, FALSE, NULL, 6),

-- 서류 (Documents)
('서류', 'DC001', '금형 도면', '금형 2D/3D 도면 첨부', TRUE, TRUE, 'document', 10),
('서류', 'DC002', '금형 인자표', '금형 인자표(파라미터 시트) 첨부', TRUE, TRUE, 'document', 11),
('서류', 'DC003', '성형해석 자료', '성형해석 결과 자료 첨부', TRUE, TRUE, 'document', 12),
('서류', 'DC004', '경도 측정 성적서', '금형 경도 측정 성적서 첨부', TRUE, TRUE, 'document', 13),
('서류', 'DC005', '시운전 결과 보고서', '시운전(Try-out) 결과 보고서 첨부', TRUE, TRUE, 'document', 14),

-- 시운전 결과 (Try-out Results)
('시운전결과', 'TR001', '초도품 치수 검사 결과', '초도품 치수 검사 결과 확인', TRUE, TRUE, 'document', 20),
('시운전결과', 'TR002', '초도품 외관 검사 결과', '초도품 외관 검사 결과 및 사진', TRUE, TRUE, 'image', 21),
('시운전결과', 'TR003', '사이클 타임 확인', '목표 사이클 타임 달성 여부 확인', TRUE, FALSE, NULL, 22),
('시운전결과', 'TR004', '사출 조건 기록', '최적 사출 조건 기록 확인', TRUE, TRUE, 'document', 23),

-- 이관 준비 (Transfer Preparation)
('이관준비', 'TP001', 'QR 코드 명판 부착 확인', '금형에 QR 코드 명판이 정상 부착되었는지 확인', TRUE, TRUE, 'image', 30),
('이관준비', 'TP002', '금형 청소 완료', '금형 내외부 청소 완료 확인', TRUE, FALSE, NULL, 31),
('이관준비', 'TP003', '방청 처리 완료', '금형 방청 처리 완료 확인', TRUE, FALSE, NULL, 32),
('이관준비', 'TP004', '포장 상태 확인', '운송을 위한 포장 상태 확인', TRUE, TRUE, 'image', 33)
ON CONFLICT DO NOTHING;
