-- 금형육성 문제점 관리 테이블
-- 금형 제작 완료 후 육성 단계(TRY1~TRYn, 초기양산, 안정화)에서 발생하는 문제점 추적 관리

-- 1. 금형육성 문제점 메인 테이블
CREATE TABLE IF NOT EXISTS mold_nurturing_problems (
  id SERIAL PRIMARY KEY,
  
  -- 문제점 번호 (MNP-YYYYMMDD-XXX)
  problem_number VARCHAR(50) UNIQUE,
  
  -- 금형 연결
  mold_id BIGINT NOT NULL,
  mold_spec_id BIGINT,
  
  -- 육성 단계 (enum)
  nurturing_stage VARCHAR(30) NOT NULL,
  -- TRY_1, TRY_2, TRY_3, INITIAL_PRODUCTION, STABILIZATION
  
  -- 문제점 기본 정보
  occurrence_date DATE NOT NULL,
  discovered_by VARCHAR(30) NOT NULL, -- mold_developer, maker, plant
  problem_types JSONB, -- ['외관', '치수', '기능', '구조', '내구', '취출', '냉각', '기타']
  problem_summary VARCHAR(500) NOT NULL,
  problem_detail TEXT,
  occurrence_location VARCHAR(500),
  location_image_url VARCHAR(500),
  severity VARCHAR(20) NOT NULL DEFAULT 'minor', -- minor, major, critical
  
  -- 원인 분석
  cause_types JSONB, -- ['설계', '가공', '조립', '재질', '사출조건', '관리미흡']
  cause_detail TEXT,
  recurrence_risk VARCHAR(20), -- low, medium, high
  
  -- 개선 조치 계획
  improvement_required BOOLEAN DEFAULT TRUE,
  improvement_action TEXT,
  action_responsible VARCHAR(30), -- mold_developer, maker, plant
  improvement_methods JSONB, -- ['금형수정', '조건변경', '작업표준변경', '관리강화']
  planned_completion_date DATE,
  
  -- 개선 결과 및 검증
  action_status VARCHAR(30) DEFAULT 'not_started', -- not_started, completed, insufficient
  verification_stage VARCHAR(30), -- same_try, next_try, initial_production
  result_description TEXT,
  is_recurred BOOLEAN DEFAULT FALSE,
  final_judgment VARCHAR(30), -- ok, conditional_ok, re_action_required
  
  -- 상태 워크플로우
  status VARCHAR(30) NOT NULL DEFAULT 'registered',
  -- registered, analyzing, improving, verifying, closed, reopened
  
  -- 증빙 자료
  occurrence_photos JSONB, -- 발생 사진 URL 배열
  before_after_photos JSONB, -- 개선 전/후 비교 사진
  related_documents JSONB, -- 관련 문서 URL 배열
  
  -- 작성자 정보
  created_by BIGINT,
  created_by_name VARCHAR(100),
  updated_by BIGINT,
  updated_by_name VARCHAR(100),
  
  -- 메타데이터
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_mold_nurturing_problems_mold ON mold_nurturing_problems(mold_id);
CREATE INDEX IF NOT EXISTS idx_mold_nurturing_problems_stage ON mold_nurturing_problems(nurturing_stage);
CREATE INDEX IF NOT EXISTS idx_mold_nurturing_problems_status ON mold_nurturing_problems(status);
CREATE INDEX IF NOT EXISTS idx_mold_nurturing_problems_severity ON mold_nurturing_problems(severity);
CREATE INDEX IF NOT EXISTS idx_mold_nurturing_problems_recurred ON mold_nurturing_problems(is_recurred);
CREATE INDEX IF NOT EXISTS idx_mold_nurturing_problems_created ON mold_nurturing_problems(created_at);

-- 코멘트
COMMENT ON TABLE mold_nurturing_problems IS '금형육성 문제점 관리 - TRY1~TRYn, 초기양산, 안정화 단계 문제 추적';
COMMENT ON COLUMN mold_nurturing_problems.nurturing_stage IS 'TRY_1, TRY_2, TRY_3, INITIAL_PRODUCTION, STABILIZATION';
COMMENT ON COLUMN mold_nurturing_problems.discovered_by IS 'mold_developer: 금형개발, maker: 제작처, plant: 생산처';
COMMENT ON COLUMN mold_nurturing_problems.severity IS 'minor: 경미, major: 중대, critical: 심각';
COMMENT ON COLUMN mold_nurturing_problems.status IS 'registered: 등록됨, analyzing: 원인분석중, improving: 개선조치진행, verifying: 재확인중, closed: 종결, reopened: 재발';

-- 2. 문제점 이력 테이블 (수정 이력 자동 기록)
CREATE TABLE IF NOT EXISTS mold_nurturing_problem_histories (
  id SERIAL PRIMARY KEY,
  
  problem_id BIGINT NOT NULL REFERENCES mold_nurturing_problems(id) ON DELETE CASCADE,
  
  -- 변경 정보
  action_type VARCHAR(30) NOT NULL, -- created, updated, status_changed, reopened
  previous_status VARCHAR(30),
  new_status VARCHAR(30),
  changed_fields JSONB, -- 변경된 필드 목록
  change_description TEXT,
  
  -- 변경자 정보
  changed_by BIGINT,
  changed_by_name VARCHAR(100),
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mold_nurturing_problem_histories_problem ON mold_nurturing_problem_histories(problem_id);
CREATE INDEX IF NOT EXISTS idx_mold_nurturing_problem_histories_action ON mold_nurturing_problem_histories(action_type);

COMMENT ON TABLE mold_nurturing_problem_histories IS '금형육성 문제점 수정 이력';

-- 3. 문제점 코멘트 테이블 (협업용)
CREATE TABLE IF NOT EXISTS mold_nurturing_problem_comments (
  id SERIAL PRIMARY KEY,
  
  problem_id BIGINT NOT NULL REFERENCES mold_nurturing_problems(id) ON DELETE CASCADE,
  
  comment_text TEXT NOT NULL,
  attachments JSONB, -- 첨부파일 URL 배열
  
  created_by BIGINT,
  created_by_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mold_nurturing_problem_comments_problem ON mold_nurturing_problem_comments(problem_id);

COMMENT ON TABLE mold_nurturing_problem_comments IS '금형육성 문제점 코멘트';

-- 4. 육성 단계 마스터 테이블
CREATE TABLE IF NOT EXISTS mold_nurturing_stages (
  id SERIAL PRIMARY KEY,
  
  stage_code VARCHAR(30) NOT NULL UNIQUE,
  stage_name VARCHAR(100) NOT NULL,
  stage_order INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 기본 육성 단계 데이터 삽입
INSERT INTO mold_nurturing_stages (stage_code, stage_name, stage_order, description) VALUES
  ('TRY_1', 'TRY 1차', 1, '1차 트라이아웃'),
  ('TRY_2', 'TRY 2차', 2, '2차 트라이아웃'),
  ('TRY_3', 'TRY 3차', 3, '3차 트라이아웃'),
  ('INITIAL_PRODUCTION', '초기 양산 (SOP-3개월)', 4, 'SOP 후 3개월 이내 초기 양산 단계'),
  ('STABILIZATION', '양산 안정화', 5, '양산 안정화 단계')
ON CONFLICT (stage_code) DO NOTHING;

COMMENT ON TABLE mold_nurturing_stages IS '금형육성 단계 마스터';

-- 5. 문제 유형 마스터 테이블
CREATE TABLE IF NOT EXISTS mold_problem_types (
  id SERIAL PRIMARY KEY,
  
  type_code VARCHAR(30) NOT NULL UNIQUE,
  type_name VARCHAR(100) NOT NULL,
  type_order INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 기본 문제 유형 데이터 삽입
INSERT INTO mold_problem_types (type_code, type_name, type_order, description) VALUES
  ('APPEARANCE', '외관', 1, '외관 불량 (스크래치, 웰드라인, 플로우마크 등)'),
  ('DIMENSION', '치수', 2, '치수 불량 (공차 초과, 변형 등)'),
  ('FUNCTION', '기능', 3, '기능 불량 (조립 불가, 작동 불량 등)'),
  ('STRUCTURE', '구조', 4, '구조 불량 (강도 부족, 파손 등)'),
  ('DURABILITY', '내구', 5, '내구 불량 (수명 단축, 마모 등)'),
  ('EJECTION', '취출', 6, '취출 불량 (이형 불량, 변형 등)'),
  ('COOLING', '냉각', 7, '냉각 불량 (사이클 타임, 변형 등)'),
  ('OTHER', '기타', 8, '기타 문제')
ON CONFLICT (type_code) DO NOTHING;

COMMENT ON TABLE mold_problem_types IS '금형 문제 유형 마스터';

-- 6. 원인 유형 마스터 테이블
CREATE TABLE IF NOT EXISTS mold_cause_types (
  id SERIAL PRIMARY KEY,
  
  type_code VARCHAR(30) NOT NULL UNIQUE,
  type_name VARCHAR(100) NOT NULL,
  type_order INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 기본 원인 유형 데이터 삽입
INSERT INTO mold_cause_types (type_code, type_name, type_order, description) VALUES
  ('DESIGN', '설계', 1, '설계 오류 또는 미흡'),
  ('MACHINING', '가공', 2, '가공 오류 또는 정밀도 부족'),
  ('ASSEMBLY', '조립', 3, '조립 오류 또는 미흡'),
  ('MATERIAL', '재질', 4, '재질 선정 오류 또는 불량'),
  ('INJECTION', '사출조건', 5, '사출 조건 부적합'),
  ('MANAGEMENT', '관리 미흡', 6, '관리 미흡 또는 표준 미준수')
ON CONFLICT (type_code) DO NOTHING;

COMMENT ON TABLE mold_cause_types IS '금형 문제 원인 유형 마스터';
