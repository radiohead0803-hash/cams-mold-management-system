-- 사출조건 테이블에 중량관리 필드 추가
-- design_weight: 설계중량 (금형사양서 기본정보 연동)
-- management_weight: 관리중량 (사출조건 등록 시 입력)

ALTER TABLE injection_conditions 
ADD COLUMN IF NOT EXISTS design_weight DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS management_weight DECIMAL(10,2);

-- 코멘트 추가
COMMENT ON COLUMN injection_conditions.design_weight IS '설계중량 (g) - 금형사양서 기본정보 연동';
COMMENT ON COLUMN injection_conditions.management_weight IS '관리중량 (g) - 사출조건 등록 시 입력';
