-- MoldDetailNew 페이지에 필요한 테이블 생성
-- 실행일: 2025-12-08

-- 1. plant_info (사출조건 관리 - 생산정보)
CREATE TABLE IF NOT EXISTS plant_info (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER NOT NULL REFERENCES molds(id),
  production_line VARCHAR(100),
  injection_machine VARCHAR(100),
  cycle_time INTEGER,
  injection_temp INTEGER,
  injection_pressure INTEGER,
  injection_speed INTEGER,
  temperature_settings JSONB,
  pressure_settings JSONB,
  speed_settings JSONB,
  material_type VARCHAR(100),
  color_code VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plant_info_mold ON plant_info(mold_id);

-- 2. injection_conditions (사출조건 수정관리)
CREATE TABLE IF NOT EXISTS injection_conditions (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER NOT NULL REFERENCES molds(id),
  plant_info_id INTEGER REFERENCES plant_info(id),
  modified_by INTEGER REFERENCES users(id),
  modification_date TIMESTAMP DEFAULT NOW(),
  previous_conditions JSONB,
  new_conditions JSONB,
  reason TEXT,
  approval_status VARCHAR(20) DEFAULT 'pending',
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_injection_conditions_mold ON injection_conditions(mold_id);

-- 3. maker_info (금형사양 요약)
CREATE TABLE IF NOT EXISTS maker_info (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER NOT NULL REFERENCES molds(id),
  material VARCHAR(100),
  weight DECIMAL(10, 2),
  dimensions VARCHAR(100),
  cavity_count INTEGER,
  core_material VARCHAR(100),
  cavity_material VARCHAR(100),
  hardness VARCHAR(50),
  cooling_type VARCHAR(50),
  ejection_type VARCHAR(50),
  hot_runner BOOLEAN,
  slide_count INTEGER,
  lifter_count INTEGER,
  cycle_time INTEGER,
  max_shots INTEGER,
  specifications JSONB,
  summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maker_info_mold ON maker_info(mold_id);

-- 4. repair_progress (금형수리 진행현황)
CREATE TABLE IF NOT EXISTS repair_progress (
  id SERIAL PRIMARY KEY,
  repair_id INTEGER NOT NULL REFERENCES repairs(id),
  progress_date TIMESTAMP DEFAULT NOW(),
  progress_percentage INTEGER,
  current_stage VARCHAR(50),
  work_details TEXT,
  issues_encountered TEXT,
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repair_progress_repair ON repair_progress(repair_id);

-- 5. mold_specifications 테이블에 추가 컬럼 (사출조건 관련)
ALTER TABLE mold_specifications 
ADD COLUMN IF NOT EXISTS injection_temp INTEGER,
ADD COLUMN IF NOT EXISTS injection_pressure INTEGER,
ADD COLUMN IF NOT EXISTS injection_speed INTEGER,
ADD COLUMN IF NOT EXISTS cycle_time INTEGER,
ADD COLUMN IF NOT EXISTS weight DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS dimensions VARCHAR(100),
ADD COLUMN IF NOT EXISTS current_location VARCHAR(200),
ADD COLUMN IF NOT EXISTS manager_name VARCHAR(100);

-- 6. 샘플 데이터 삽입 (ID 60에 대한 데이터)
-- plant_info 샘플 데이터
INSERT INTO plant_info (mold_id, production_line, injection_machine, cycle_time, injection_temp, injection_pressure, injection_speed, material_type)
SELECT 5, 'LINE-A01', 'INJ-350T', 35, 220, 80, 50, 'ABS'
WHERE NOT EXISTS (SELECT 1 FROM plant_info WHERE mold_id = 5);

-- maker_info 샘플 데이터
INSERT INTO maker_info (mold_id, material, weight, dimensions, cavity_count, core_material, cavity_material, hardness, cooling_type, ejection_type, hot_runner, slide_count, lifter_count, cycle_time, max_shots)
SELECT 5, 'NAK80', 2500, '500x400x350', 1, 'NAK80', 'NAK80', 'HRC 40-42', '직접냉각', '이젝터핀', false, 2, 4, 35, 500000
WHERE NOT EXISTS (SELECT 1 FROM maker_info WHERE mold_id = 5);

-- mold_specifications ID 60 업데이트
UPDATE mold_specifications 
SET 
  injection_temp = 220,
  injection_pressure = 80,
  injection_speed = 50,
  cycle_time = 35,
  weight = 2500,
  dimensions = '500x400x350',
  current_location = 'A구역-01',
  manager_name = '김철수'
WHERE id = 60;

-- 완료 메시지
SELECT 'Migration completed successfully' as status;
