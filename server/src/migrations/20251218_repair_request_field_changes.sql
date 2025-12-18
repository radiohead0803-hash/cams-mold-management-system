-- 수리요청 테이블 필드 변경 (2024-12-18)
-- 1. stock_depletion_days (재고소진 예상일) → shortage_expected_date (과부족 예상일) - 날짜 타입으로 변경
-- 2. mold_arrival_request_datetime (금형입고요청일시) 추가 - 날짜+시간 타입

-- 기존 stock_depletion_days 컬럼이 있으면 삭제 (DECIMAL 타입이었음)
ALTER TABLE repair_requests DROP COLUMN IF EXISTS stock_depletion_days;

-- 과부족 예상일 (날짜 타입) 추가
ALTER TABLE repair_requests 
ADD COLUMN IF NOT EXISTS shortage_expected_date DATE;

-- 금형입고요청일시 (날짜+시간 타입) 추가
ALTER TABLE repair_requests 
ADD COLUMN IF NOT EXISTS mold_arrival_request_datetime TIMESTAMP;

-- 코멘트 추가
COMMENT ON COLUMN repair_requests.shortage_expected_date IS '과부족 예상일 (날짜 선택)';
COMMENT ON COLUMN repair_requests.mold_arrival_request_datetime IS '금형입고요청일시 (날짜+시간)';

SELECT '수리요청 필드 변경 완료 - 과부족예상일, 금형입고요청일시 추가' as result;
