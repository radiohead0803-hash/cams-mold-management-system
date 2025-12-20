-- 금형육성 단계 마스터 테이블 업데이트
-- 1. 초도 T/O (금형제작처) - 고정 단계
-- 2. T/O 1차 ~ n차 (제작처/협력사) - 편집/추가 가능

-- 기존 데이터 삭제 후 새로운 구조로 재삽입
DELETE FROM mold_nurturing_stages;

-- 육성 단계 마스터 테이블 컬럼 추가
ALTER TABLE mold_nurturing_stages ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN DEFAULT FALSE;
ALTER TABLE mold_nurturing_stages ADD COLUMN IF NOT EXISTS responsible_type VARCHAR(50);
ALTER TABLE mold_nurturing_stages ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;
ALTER TABLE mold_nurturing_stages ADD COLUMN IF NOT EXISTS mold_id BIGINT;

COMMENT ON COLUMN mold_nurturing_stages.is_fixed IS '고정 단계 여부 (true: 편집/삭제 불가)';
COMMENT ON COLUMN mold_nurturing_stages.responsible_type IS '담당 유형 (maker: 제작처, plant: 생산처/협력사)';
COMMENT ON COLUMN mold_nurturing_stages.is_custom IS '사용자 정의 단계 여부';
COMMENT ON COLUMN mold_nurturing_stages.mold_id IS '금형별 사용자 정의 단계인 경우 금형 ID';

-- 기본 육성 단계 데이터 삽입 (새 구조)
INSERT INTO mold_nurturing_stages (stage_code, stage_name, stage_order, description, is_active, is_fixed, responsible_type, is_custom) VALUES
  ('INITIAL_TO', '초도 T/O', 1, '금형제작처에서 진행하는 초도 트라이아웃', TRUE, TRUE, 'maker', FALSE),
  ('TO_1', 'T/O 1차', 2, '제작처/협력사 1차 트라이아웃', TRUE, FALSE, 'maker', FALSE),
  ('TO_2', 'T/O 2차', 3, '제작처/협력사 2차 트라이아웃', TRUE, FALSE, 'maker', FALSE),
  ('TO_3', 'T/O 3차', 4, '제작처/협력사 3차 트라이아웃', TRUE, FALSE, 'maker', FALSE),
  ('INITIAL_PRODUCTION', '초기 양산', 5, 'SOP 후 3개월 이내 초기 양산 단계', TRUE, FALSE, 'plant', FALSE),
  ('STABILIZATION', '양산 안정화', 6, '양산 안정화 단계', TRUE, FALSE, 'plant', FALSE)
ON CONFLICT (stage_code) DO UPDATE SET
  stage_name = EXCLUDED.stage_name,
  stage_order = EXCLUDED.stage_order,
  description = EXCLUDED.description,
  is_fixed = EXCLUDED.is_fixed,
  responsible_type = EXCLUDED.responsible_type;

-- 문제점 테이블에 공통 조건필드 추가
ALTER TABLE mold_nurturing_problems ADD COLUMN IF NOT EXISTS try_location VARCHAR(100);
ALTER TABLE mold_nurturing_problems ADD COLUMN IF NOT EXISTS try_date DATE;
ALTER TABLE mold_nurturing_problems ADD COLUMN IF NOT EXISTS try_machine VARCHAR(100);
ALTER TABLE mold_nurturing_problems ADD COLUMN IF NOT EXISTS try_material VARCHAR(100);
ALTER TABLE mold_nurturing_problems ADD COLUMN IF NOT EXISTS try_conditions JSONB;
ALTER TABLE mold_nurturing_problems ADD COLUMN IF NOT EXISTS shot_count INTEGER;
ALTER TABLE mold_nurturing_problems ADD COLUMN IF NOT EXISTS cycle_time DECIMAL(10,2);
ALTER TABLE mold_nurturing_problems ADD COLUMN IF NOT EXISTS responsible_company_id BIGINT;
ALTER TABLE mold_nurturing_problems ADD COLUMN IF NOT EXISTS responsible_company_name VARCHAR(200);

COMMENT ON COLUMN mold_nurturing_problems.try_location IS 'T/O 장소';
COMMENT ON COLUMN mold_nurturing_problems.try_date IS 'T/O 일자';
COMMENT ON COLUMN mold_nurturing_problems.try_machine IS 'T/O 설비/사출기';
COMMENT ON COLUMN mold_nurturing_problems.try_material IS 'T/O 원재료';
COMMENT ON COLUMN mold_nurturing_problems.try_conditions IS 'T/O 조건 (사출조건 등 JSON)';
COMMENT ON COLUMN mold_nurturing_problems.shot_count IS '숏수';
COMMENT ON COLUMN mold_nurturing_problems.cycle_time IS '사이클타임 (초)';
COMMENT ON COLUMN mold_nurturing_problems.responsible_company_id IS '담당 업체 ID';
COMMENT ON COLUMN mold_nurturing_problems.responsible_company_name IS '담당 업체명';

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_mold_nurturing_stages_mold ON mold_nurturing_stages(mold_id);
CREATE INDEX IF NOT EXISTS idx_mold_nurturing_stages_fixed ON mold_nurturing_stages(is_fixed);
CREATE INDEX IF NOT EXISTS idx_mold_nurturing_stages_custom ON mold_nurturing_stages(is_custom);
