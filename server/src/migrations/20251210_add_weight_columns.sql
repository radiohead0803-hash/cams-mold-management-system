-- 금형 기본정보에 설계중량/실중량 컬럼 추가
-- 설계중량: 개발담당자만 입력 가능
-- 실중량: 제작처/생산처에서 입력 가능
-- 이력관리: weight_history 테이블에서 관리

-- mold_specifications 테이블에 중량 컬럼 추가 (최신값 저장)
ALTER TABLE mold_specifications 
ADD COLUMN IF NOT EXISTS design_weight DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS design_weight_unit VARCHAR(10) DEFAULT 'g',
ADD COLUMN IF NOT EXISTS actual_weight DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS actual_weight_unit VARCHAR(10) DEFAULT 'g',
ADD COLUMN IF NOT EXISTS design_weight_registered_by INTEGER,
ADD COLUMN IF NOT EXISTS design_weight_registered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_weight_registered_by INTEGER,
ADD COLUMN IF NOT EXISTS actual_weight_registered_at TIMESTAMP WITH TIME ZONE;

-- 중량 이력 테이블 생성
CREATE TABLE IF NOT EXISTS weight_history (
  id SERIAL PRIMARY KEY,
  mold_spec_id INTEGER NOT NULL,
  mold_id INTEGER,
  
  -- 중량 타입: design(설계중량), actual(실중량)
  weight_type VARCHAR(20) NOT NULL,
  
  -- 중량 값
  weight_value DECIMAL(10,2) NOT NULL,
  weight_unit VARCHAR(10) DEFAULT 'g',
  
  -- 변경 사유
  change_reason TEXT,
  
  -- 등록 정보
  registered_by INTEGER,
  registered_by_name VARCHAR(100),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- 이전 값 (변경 추적용)
  previous_value DECIMAL(10,2),
  previous_unit VARCHAR(10),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_weight_history_mold_spec ON weight_history(mold_spec_id);
CREATE INDEX IF NOT EXISTS idx_weight_history_type ON weight_history(weight_type);
CREATE INDEX IF NOT EXISTS idx_weight_history_registered_at ON weight_history(registered_at DESC);

-- 코멘트 추가
COMMENT ON TABLE weight_history IS '설계중량/실중량 이력 테이블';
COMMENT ON COLUMN weight_history.weight_type IS '중량 타입: design(설계중량), actual(실중량)';
COMMENT ON COLUMN mold_specifications.design_weight IS '설계중량 최신값 (개발담당자 입력)';
COMMENT ON COLUMN mold_specifications.actual_weight IS '실중량 최신값 (제작처/생산처 입력)';

-- ========== 원재료 정보 컬럼 추가 ==========
-- 개발담당자만 입력 가능, 이력관리 필요

ALTER TABLE mold_specifications 
ADD COLUMN IF NOT EXISTS material_spec VARCHAR(100),           -- MS SPEC (원재료 규격)
ADD COLUMN IF NOT EXISTS material_grade VARCHAR(100),          -- 그레이드
ADD COLUMN IF NOT EXISTS material_supplier VARCHAR(200),       -- 원재료 업체
ADD COLUMN IF NOT EXISTS material_shrinkage DECIMAL(5,3),      -- 원재료 수축율 (%)
ADD COLUMN IF NOT EXISTS mold_shrinkage DECIMAL(5,3),          -- 금형 수축율 (%)
ADD COLUMN IF NOT EXISTS material_registered_by INTEGER,
ADD COLUMN IF NOT EXISTS material_registered_at TIMESTAMP WITH TIME ZONE;

-- 원재료 이력 테이블 생성
CREATE TABLE IF NOT EXISTS material_history (
  id SERIAL PRIMARY KEY,
  mold_spec_id INTEGER NOT NULL,
  mold_id INTEGER,
  
  -- 원재료 정보
  material_spec VARCHAR(100),
  material_grade VARCHAR(100),
  material_supplier VARCHAR(200),
  material_shrinkage DECIMAL(5,3),
  mold_shrinkage DECIMAL(5,3),
  
  -- 변경 사유
  change_reason TEXT,
  
  -- 등록 정보
  registered_by INTEGER,
  registered_by_name VARCHAR(100),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- 이전 값 (JSON으로 저장)
  previous_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_material_history_mold_spec ON material_history(mold_spec_id);
CREATE INDEX IF NOT EXISTS idx_material_history_registered_at ON material_history(registered_at DESC);

-- 코멘트 추가
COMMENT ON TABLE material_history IS '원재료 정보 이력 테이블';
COMMENT ON COLUMN mold_specifications.material_spec IS 'MS SPEC (원재료 규격) - 개발담당자 입력';
COMMENT ON COLUMN mold_specifications.material_grade IS '원재료 그레이드 - 개발담당자 입력';
COMMENT ON COLUMN mold_specifications.material_supplier IS '원재료 업체 - 개발담당자 입력';
COMMENT ON COLUMN mold_specifications.material_shrinkage IS '원재료 수축율 (%) - 개발담당자 입력';
COMMENT ON COLUMN mold_specifications.mold_shrinkage IS '금형 수축율 (%) - 개발담당자 입력';

SELECT '중량 컬럼 및 이력 테이블 추가 완료' as result;
