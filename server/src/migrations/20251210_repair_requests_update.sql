-- 금형수리요청 테이블 확장
-- 협력사 작성항목 및 관리 항목 추가

-- 기존 repair_requests 테이블에 컬럼 추가
ALTER TABLE repair_requests
-- 기본 정보
ADD COLUMN IF NOT EXISTS problem TEXT,                           -- 문제
ADD COLUMN IF NOT EXISTS cause_and_reason TEXT,                  -- 원인 및 발생사유
ADD COLUMN IF NOT EXISTS problem_source TEXT,                    -- 문제점 출처
ADD COLUMN IF NOT EXISTS occurred_date DATE,                     -- 발생일자
ADD COLUMN IF NOT EXISTS manager_id INTEGER,                     -- 추진담당 ID
ADD COLUMN IF NOT EXISTS manager_name VARCHAR(100),              -- 추진담당 이름

-- 금형/제품 정보
ADD COLUMN IF NOT EXISTS requester_id INTEGER,                   -- 접수 및 요청담당 ID
ADD COLUMN IF NOT EXISTS requester_name VARCHAR(100),            -- 접수 및 요청담당 이름
ADD COLUMN IF NOT EXISTS car_model VARCHAR(100),                 -- 대상차종
ADD COLUMN IF NOT EXISTS part_number VARCHAR(100),               -- 품번
ADD COLUMN IF NOT EXISTS part_name VARCHAR(200),                 -- 품명
ADD COLUMN IF NOT EXISTS occurrence_type VARCHAR(50),            -- 발생구분 (신규/재발)
ADD COLUMN IF NOT EXISTS production_site VARCHAR(200),           -- 생산처
ADD COLUMN IF NOT EXISTS production_manager VARCHAR(100),        -- 담당자(생산처)
ADD COLUMN IF NOT EXISTS contact VARCHAR(50),                    -- 연락처
ADD COLUMN IF NOT EXISTS production_shot INTEGER,                -- 생산수량(SHOT)
ADD COLUMN IF NOT EXISTS maker VARCHAR(200),                     -- 제작처
ADD COLUMN IF NOT EXISTS operation_type VARCHAR(50),             -- 운영구분 (양산/개발 등)
ADD COLUMN IF NOT EXISTS problem_type VARCHAR(100),              -- 문제유형 (내구성/외관/치수 등)

-- 수리 정보
ADD COLUMN IF NOT EXISTS repair_cost DECIMAL(12,0),              -- 금형수정비
ADD COLUMN IF NOT EXISTS completion_date DATE,                   -- 완료일자
ADD COLUMN IF NOT EXISTS temporary_action TEXT,                  -- 임시대책/조치사항
ADD COLUMN IF NOT EXISTS root_cause_action TEXT,                 -- 근본대책
ADD COLUMN IF NOT EXISTS mold_arrival_date DATE,                 -- 금형입고일
ADD COLUMN IF NOT EXISTS stock_schedule_date DATE,               -- 재고확보일정
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER,                 -- 재고확보수량
ADD COLUMN IF NOT EXISTS stock_unit VARCHAR(20) DEFAULT 'EA',    -- 재고확보단위
ADD COLUMN IF NOT EXISTS repair_company VARCHAR(200),            -- 금형수정처
ADD COLUMN IF NOT EXISTS repair_duration INTEGER,                -- 금형수정기간 (일)
ADD COLUMN IF NOT EXISTS management_type VARCHAR(50),            -- 관리구분 (전산공유 L1 등)
ADD COLUMN IF NOT EXISTS sign_off_status VARCHAR(100),           -- 사인 오프 상태
ADD COLUMN IF NOT EXISTS representative_part_number VARCHAR(100),-- 대표품번
ADD COLUMN IF NOT EXISTS order_company VARCHAR(200),             -- 발주처
ADD COLUMN IF NOT EXISTS related_files JSONB DEFAULT '[]'::jsonb;-- 관련 파일

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_repair_requests_occurred_date ON repair_requests(occurred_date);
CREATE INDEX IF NOT EXISTS idx_repair_requests_car_model ON repair_requests(car_model);
CREATE INDEX IF NOT EXISTS idx_repair_requests_part_number ON repair_requests(part_number);
CREATE INDEX IF NOT EXISTS idx_repair_requests_occurrence_type ON repair_requests(occurrence_type);
CREATE INDEX IF NOT EXISTS idx_repair_requests_problem_type ON repair_requests(problem_type);

-- 코멘트 추가
COMMENT ON COLUMN repair_requests.problem IS '문제 내용';
COMMENT ON COLUMN repair_requests.cause_and_reason IS '원인 및 발생사유';
COMMENT ON COLUMN repair_requests.occurrence_type IS '발생구분: 신규, 재발';
COMMENT ON COLUMN repair_requests.operation_type IS '운영구분: 양산, 개발, 시작 등';
COMMENT ON COLUMN repair_requests.problem_type IS '문제유형: 내구성, 외관, 치수 등';
COMMENT ON COLUMN repair_requests.management_type IS '관리구분: 전산공유(L1), 일반 등';

SELECT '금형수리요청 테이블 확장 완료' as result;
