-- 금형수리요청 테이블 확장
-- 협력사 작성항목 및 관리 항목 추가

-- 기존 repair_requests 테이블에 컬럼 추가
ALTER TABLE repair_requests
-- 기본 정보
ADD COLUMN IF NOT EXISTS problem TEXT,
ADD COLUMN IF NOT EXISTS cause_and_reason TEXT,
ADD COLUMN IF NOT EXISTS problem_source TEXT,
ADD COLUMN IF NOT EXISTS occurred_date DATE,
ADD COLUMN IF NOT EXISTS manager_id INTEGER,
ADD COLUMN IF NOT EXISTS manager_name VARCHAR(100),

-- 금형/제품 정보
ADD COLUMN IF NOT EXISTS requester_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS car_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS part_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS part_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS occurrence_type VARCHAR(50) DEFAULT '신규',
ADD COLUMN IF NOT EXISTS production_site VARCHAR(200),
ADD COLUMN IF NOT EXISTS production_manager VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact VARCHAR(50),
ADD COLUMN IF NOT EXISTS production_shot INTEGER,
ADD COLUMN IF NOT EXISTS maker VARCHAR(200),
ADD COLUMN IF NOT EXISTS operation_type VARCHAR(50) DEFAULT '양산',
ADD COLUMN IF NOT EXISTS problem_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS repair_category VARCHAR(50),

-- 수리 정보
ADD COLUMN IF NOT EXISTS repair_cost DECIMAL(12,0),
ADD COLUMN IF NOT EXISTS completion_date DATE,
ADD COLUMN IF NOT EXISTS temporary_action TEXT,
ADD COLUMN IF NOT EXISTS root_cause_action TEXT,
ADD COLUMN IF NOT EXISTS mold_arrival_date DATE,
ADD COLUMN IF NOT EXISTS repair_start_date DATE,
ADD COLUMN IF NOT EXISTS repair_end_date DATE,
ADD COLUMN IF NOT EXISTS stock_schedule_date DATE,
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER,
ADD COLUMN IF NOT EXISTS stock_unit VARCHAR(20) DEFAULT 'EA',
ADD COLUMN IF NOT EXISTS repair_company VARCHAR(200),
ADD COLUMN IF NOT EXISTS repair_duration VARCHAR(50),
ADD COLUMN IF NOT EXISTS management_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS sign_off_status VARCHAR(100) DEFAULT '제출되지 않음',
ADD COLUMN IF NOT EXISTS representative_part_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS order_company VARCHAR(200),
ADD COLUMN IF NOT EXISTS related_files JSONB DEFAULT '[]'::jsonb,

-- 수리처 선정
ADD COLUMN IF NOT EXISTS repair_shop_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS repair_shop_selected_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS repair_shop_selected_date DATE,
ADD COLUMN IF NOT EXISTS repair_shop_approval_status VARCHAR(20) DEFAULT '대기',
ADD COLUMN IF NOT EXISTS repair_shop_approved_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS repair_shop_approved_date DATE,
ADD COLUMN IF NOT EXISTS repair_shop_rejection_reason TEXT,

-- 귀책 협의
ADD COLUMN IF NOT EXISTS liability_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS liability_ratio_maker INTEGER,
ADD COLUMN IF NOT EXISTS liability_ratio_plant INTEGER,
ADD COLUMN IF NOT EXISTS liability_reason TEXT,
ADD COLUMN IF NOT EXISTS liability_decided_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS liability_decided_date DATE;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_repair_requests_occurred_date ON repair_requests(occurred_date);
CREATE INDEX IF NOT EXISTS idx_repair_requests_car_model ON repair_requests(car_model);
CREATE INDEX IF NOT EXISTS idx_repair_requests_part_number ON repair_requests(part_number);
CREATE INDEX IF NOT EXISTS idx_repair_requests_occurrence_type ON repair_requests(occurrence_type);
CREATE INDEX IF NOT EXISTS idx_repair_requests_problem_type ON repair_requests(problem_type);
CREATE INDEX IF NOT EXISTS idx_repair_requests_repair_category ON repair_requests(repair_category);
CREATE INDEX IF NOT EXISTS idx_repair_requests_repair_shop_approval_status ON repair_requests(repair_shop_approval_status);

SELECT '금형수리요청 테이블 확장 완료' as result;
