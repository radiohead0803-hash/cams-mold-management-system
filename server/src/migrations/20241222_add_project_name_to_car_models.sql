-- car_models 테이블에 project_name(프로젝트명) 필드 추가
-- 프로젝트명: OS, 5X, 3K, TH 등

-- 1. project_name 컬럼 추가
ALTER TABLE car_models ADD COLUMN IF NOT EXISTS project_name VARCHAR(50);

-- 2. 기존 데이터에 프로젝트명 업데이트 (예시)
-- 실제 프로젝트명은 기초정보 관리 페이지에서 입력

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_car_models_project_name ON car_models(project_name);

-- 4. 코멘트 추가
COMMENT ON COLUMN car_models.project_name IS '프로젝트명 (OS, 5X, 3K, TH 등)';
