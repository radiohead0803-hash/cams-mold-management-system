-- 금형 기본정보에 설계중량/실중량 컬럼 추가
-- 설계중량: 개발담당자만 입력 가능
-- 실중량: 제작처/생산처에서 입력 가능

-- mold_specifications 테이블에 중량 컬럼 추가
ALTER TABLE mold_specifications 
ADD COLUMN IF NOT EXISTS design_weight DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS design_weight_unit VARCHAR(10) DEFAULT 'g',
ADD COLUMN IF NOT EXISTS actual_weight DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS actual_weight_unit VARCHAR(10) DEFAULT 'g',
ADD COLUMN IF NOT EXISTS design_weight_registered_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS design_weight_registered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_weight_registered_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS actual_weight_registered_at TIMESTAMP WITH TIME ZONE;

-- 코멘트 추가
COMMENT ON COLUMN mold_specifications.design_weight IS '설계중량 (개발담당자 입력)';
COMMENT ON COLUMN mold_specifications.design_weight_unit IS '설계중량 단위 (g, kg)';
COMMENT ON COLUMN mold_specifications.actual_weight IS '실중량 (제작처/생산처 입력)';
COMMENT ON COLUMN mold_specifications.actual_weight_unit IS '실중량 단위 (g, kg)';

SELECT '중량 컬럼 추가 완료' as result;
