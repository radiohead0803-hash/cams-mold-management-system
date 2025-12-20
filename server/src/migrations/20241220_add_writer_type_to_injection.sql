-- 사출조건 테이블에 작성처 구분 필드 추가
-- writer_type: maker(제작처), plant(생산처), mold_developer(개발담당)

-- 1. injection_conditions 테이블에 writer_type 컬럼 추가
ALTER TABLE injection_conditions 
ADD COLUMN IF NOT EXISTS writer_type VARCHAR(30) DEFAULT 'plant';

-- 2. injection_condition_history 테이블에도 writer_type 컬럼 추가
ALTER TABLE injection_condition_history 
ADD COLUMN IF NOT EXISTS writer_type VARCHAR(30);

-- 3. 기존 데이터 업데이트 (registered_by의 user_type 기반으로 설정)
UPDATE injection_conditions ic
SET writer_type = COALESCE(
  (SELECT u.user_type FROM users u WHERE u.id = ic.registered_by),
  'plant'
)
WHERE writer_type IS NULL OR writer_type = 'plant';

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_injection_conditions_writer_type ON injection_conditions(writer_type);

-- 5. 코멘트 추가
COMMENT ON COLUMN injection_conditions.writer_type IS '작성처 구분: maker(제작처), plant(생산처), mold_developer(개발담당)';
COMMENT ON COLUMN injection_condition_history.writer_type IS '작성처 구분: maker(제작처), plant(생산처), mold_developer(개발담당)';

SELECT '사출조건 작성처 구분 필드 추가 완료' as result;
