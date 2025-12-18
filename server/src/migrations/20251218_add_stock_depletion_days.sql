-- 수리요청 테이블 확장 (2024-12-18)
-- 재고소진 예상일, 생산처 담당자, 캠스 담당자, 생산처 검수, 체크리스트 점검 필드 추가

ALTER TABLE repair_requests
-- 재고 관련
ADD COLUMN IF NOT EXISTS stock_depletion_days DECIMAL(5,1),

-- 생산처 담당자
ADD COLUMN IF NOT EXISTS plant_manager_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS plant_manager_contact VARCHAR(50),

-- 캠스 담당자
ADD COLUMN IF NOT EXISTS cams_manager_id INTEGER,
ADD COLUMN IF NOT EXISTS cams_manager_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS cams_manager_contact VARCHAR(50),

-- 생산처 검수
ADD COLUMN IF NOT EXISTS plant_inspection_status VARCHAR(20) DEFAULT '대기',
ADD COLUMN IF NOT EXISTS plant_inspection_result VARCHAR(20),
ADD COLUMN IF NOT EXISTS plant_inspection_comment TEXT,
ADD COLUMN IF NOT EXISTS plant_inspection_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS plant_inspection_date DATE,
ADD COLUMN IF NOT EXISTS plant_inspection_rejection_reason TEXT,

-- 체크리스트 점검
ADD COLUMN IF NOT EXISTS checklist_result VARCHAR(20),
ADD COLUMN IF NOT EXISTS checklist_comment TEXT,
ADD COLUMN IF NOT EXISTS checklist_inspector VARCHAR(100),
ADD COLUMN IF NOT EXISTS checklist_date DATE,
ADD COLUMN IF NOT EXISTS checklist_status VARCHAR(20) DEFAULT '대기';

-- 코멘트 추가
COMMENT ON COLUMN repair_requests.stock_depletion_days IS '재고소진 예상일 (예: 2.5일)';
COMMENT ON COLUMN repair_requests.stock_quantity IS '현재 재고 수량';
COMMENT ON COLUMN repair_requests.plant_manager_name IS '생산처 담당자명';
COMMENT ON COLUMN repair_requests.cams_manager_name IS '캠스 담당자명';
COMMENT ON COLUMN repair_requests.plant_inspection_status IS '생산처 검수 상태 (대기/승인/반려)';
COMMENT ON COLUMN repair_requests.checklist_status IS '체크리스트 점검 상태 (대기/승인/반려)';

SELECT '수리요청 테이블 확장 완료 (2024-12-18)' as result;
