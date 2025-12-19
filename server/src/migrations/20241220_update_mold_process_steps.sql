-- 금형개발계획 추진계획 항목 동적 관리 지원
-- 1. 기존 12단계에 "초도T/O 이후 금형육성", "양산이관" 추가
-- 2. 사용자 정의 단계 추가/삭제 지원
-- 3. is_custom 필드로 기본/사용자정의 구분

-- 1. mold_process_steps 테이블에 새 컬럼 추가
ALTER TABLE mold_process_steps ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;
ALTER TABLE mold_process_steps ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE mold_process_steps ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'development';
ALTER TABLE mold_process_steps ADD COLUMN IF NOT EXISTS sort_order INTEGER;
ALTER TABLE mold_process_steps ADD COLUMN IF NOT EXISTS default_days INTEGER DEFAULT 5;

-- 컬럼 코멘트
COMMENT ON COLUMN mold_process_steps.is_custom IS '사용자 정의 단계 여부 (true: 사용자 추가, false: 기본 단계)';
COMMENT ON COLUMN mold_process_steps.is_deleted IS '삭제 여부 (soft delete)';
COMMENT ON COLUMN mold_process_steps.category IS '카테고리 (development: 개발, nurturing: 금형육성, transfer: 양산이관)';
COMMENT ON COLUMN mold_process_steps.sort_order IS '정렬 순서';
COMMENT ON COLUMN mold_process_steps.default_days IS '기본 소요일';

-- 2. 기본 단계 마스터 테이블 생성 (템플릿용)
CREATE TABLE IF NOT EXISTS mold_process_step_masters (
  id SERIAL PRIMARY KEY,
  step_number INTEGER NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT 'development',
  default_days INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE mold_process_step_masters IS '금형개발계획 공정 단계 마스터 (기본 템플릿)';
COMMENT ON COLUMN mold_process_step_masters.category IS 'development: 개발단계, nurturing: 금형육성, transfer: 양산이관';

-- 3. 기본 14단계 데이터 삽입 (기존 12단계 + 금형육성 + 양산이관)
INSERT INTO mold_process_step_masters (step_number, step_name, category, default_days, sort_order, description) VALUES
  -- 개발 단계 (12단계)
  (1, '도면접수', 'development', 3, 1, '고객 도면 접수 및 검토'),
  (2, '몰드베이스 발주', 'development', 5, 2, '몰드베이스 발주 및 입고'),
  (3, '금형설계', 'development', 10, 3, '금형 설계 및 도면 작성'),
  (4, '도면검토회', 'development', 2, 4, '설계 도면 검토 회의'),
  (5, '상형가공', 'development', 15, 5, '상형(캐비티) 가공'),
  (6, '하형가공', 'development', 15, 6, '하형(코어) 가공'),
  (7, '코어가공', 'development', 10, 7, '코어 부품 가공'),
  (8, '방전', 'development', 7, 8, '방전 가공'),
  (9, '격면사상', 'development', 5, 9, '격면 사상 작업'),
  (10, '금형조립', 'development', 5, 10, '금형 조립'),
  (11, '습합', 'development', 3, 11, '습합 및 조정'),
  (12, '초도 T/O', 'development', 3, 12, '초도 트라이아웃'),
  -- 금형육성 단계
  (13, '초도T/O 이후 금형육성', 'nurturing', 30, 13, '초도 T/O 이후 금형 육성 및 품질 안정화'),
  -- 양산이관 단계
  (14, '양산이관', 'transfer', 5, 14, '양산처로 금형 이관')
ON CONFLICT DO NOTHING;

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_mold_process_steps_category ON mold_process_steps(category);
CREATE INDEX IF NOT EXISTS idx_mold_process_steps_is_custom ON mold_process_steps(is_custom);
CREATE INDEX IF NOT EXISTS idx_mold_process_steps_is_deleted ON mold_process_steps(is_deleted);
CREATE INDEX IF NOT EXISTS idx_mold_process_step_masters_category ON mold_process_step_masters(category);
CREATE INDEX IF NOT EXISTS idx_mold_process_step_masters_is_active ON mold_process_step_masters(is_active);

-- 5. 기존 데이터 업데이트 (sort_order 설정)
UPDATE mold_process_steps SET sort_order = step_number WHERE sort_order IS NULL;
UPDATE mold_process_steps SET category = 'development' WHERE category IS NULL;
