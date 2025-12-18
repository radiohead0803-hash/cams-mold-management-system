-- 재고소진 예상일 필드 추가
-- repair_requests 테이블에 stock_depletion_days 컬럼 추가

ALTER TABLE repair_requests
ADD COLUMN IF NOT EXISTS stock_depletion_days DECIMAL(5,1);

-- 코멘트 추가
COMMENT ON COLUMN repair_requests.stock_depletion_days IS '재고소진 예상일 (예: 2.5일)';
COMMENT ON COLUMN repair_requests.stock_quantity IS '현재 재고 수량';

SELECT '재고소진 예상일 필드 추가 완료' as result;
