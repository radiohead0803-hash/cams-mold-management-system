-- 사출조건 관리 테이블
-- 제작처/생산처에서 등록, 개발담당자 승인 프로세스

-- 1. 사출조건 마스터 테이블
CREATE TABLE IF NOT EXISTS injection_conditions (
  id SERIAL PRIMARY KEY,
  mold_spec_id INTEGER REFERENCES mold_specifications(id) ON DELETE CASCADE,
  mold_id INTEGER,
  
  -- 기본 금형 정보 (자동 연결)
  mold_code VARCHAR(100),
  mold_name VARCHAR(200),
  part_name VARCHAR(200),
  material VARCHAR(100),
  
  -- 온도 설정
  nozzle_temp DECIMAL(6,1),           -- 노즐 온도 (°C)
  cylinder_temp_1 DECIMAL(6,1),       -- 실린더 온도 1존
  cylinder_temp_2 DECIMAL(6,1),       -- 실린더 온도 2존
  cylinder_temp_3 DECIMAL(6,1),       -- 실린더 온도 3존
  cylinder_temp_4 DECIMAL(6,1),       -- 실린더 온도 4존
  mold_temp_fixed DECIMAL(6,1),       -- 금형 온도 (고정측)
  mold_temp_moving DECIMAL(6,1),      -- 금형 온도 (가동측)
  
  -- 압력 설정
  injection_pressure_1 DECIMAL(6,1),  -- 사출 압력 1단 (MPa)
  injection_pressure_2 DECIMAL(6,1),  -- 사출 압력 2단
  injection_pressure_3 DECIMAL(6,1),  -- 사출 압력 3단
  holding_pressure_1 DECIMAL(6,1),    -- 보압 1단
  holding_pressure_2 DECIMAL(6,1),    -- 보압 2단
  holding_pressure_3 DECIMAL(6,1),    -- 보압 3단
  back_pressure DECIMAL(6,1),         -- 배압
  
  -- 속도 설정
  injection_speed_1 DECIMAL(6,1),     -- 사출 속도 1단 (%)
  injection_speed_2 DECIMAL(6,1),     -- 사출 속도 2단
  injection_speed_3 DECIMAL(6,1),     -- 사출 속도 3단
  screw_rpm DECIMAL(6,1),             -- 스크류 회전수 (rpm)
  
  -- 시간 설정
  injection_time DECIMAL(6,2),        -- 사출 시간 (sec)
  holding_time DECIMAL(6,2),          -- 보압 시간
  cooling_time DECIMAL(6,2),          -- 냉각 시간
  cycle_time DECIMAL(6,2),            -- 사이클 타임
  
  -- 계량 설정
  metering_stroke DECIMAL(6,1),       -- 계량값 (mm)
  suck_back DECIMAL(6,1),             -- 석백 (mm)
  cushion DECIMAL(6,1),               -- 쿠션 (mm)
  
  -- 기타 설정
  clamping_force DECIMAL(8,1),        -- 형체력 (ton)
  ejector_stroke DECIMAL(6,1),        -- 이젝터 스트로크 (mm)
  ejector_speed DECIMAL(6,1),         -- 이젝터 속도 (%)
  
  -- 승인 관련
  status VARCHAR(20) DEFAULT 'draft', -- draft, pending, approved, rejected
  registered_by INTEGER REFERENCES users(id),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- 버전 관리
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 사출조건 변경 이력 테이블
CREATE TABLE IF NOT EXISTS injection_condition_history (
  id SERIAL PRIMARY KEY,
  injection_condition_id INTEGER REFERENCES injection_conditions(id) ON DELETE CASCADE,
  mold_spec_id INTEGER,
  
  -- 변경 정보
  change_type VARCHAR(50) NOT NULL,   -- temperature, pressure, speed, time, metering, other
  field_name VARCHAR(100) NOT NULL,   -- 변경된 필드명
  field_label VARCHAR(100),           -- 필드 라벨 (한글)
  old_value VARCHAR(200),
  new_value VARCHAR(200),
  change_reason TEXT,
  
  -- 승인 관련
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  changed_by INTEGER REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_injection_conditions_mold_spec ON injection_conditions(mold_spec_id);
CREATE INDEX IF NOT EXISTS idx_injection_conditions_status ON injection_conditions(status);
CREATE INDEX IF NOT EXISTS idx_injection_conditions_current ON injection_conditions(is_current);
CREATE INDEX IF NOT EXISTS idx_injection_history_condition ON injection_condition_history(injection_condition_id);
CREATE INDEX IF NOT EXISTS idx_injection_history_mold_spec ON injection_condition_history(mold_spec_id);
CREATE INDEX IF NOT EXISTS idx_injection_history_status ON injection_condition_history(status);

-- 코멘트
COMMENT ON TABLE injection_conditions IS '사출조건 마스터 테이블';
COMMENT ON TABLE injection_condition_history IS '사출조건 변경 이력 테이블';
COMMENT ON COLUMN injection_conditions.status IS '상태: draft(임시저장), pending(승인대기), approved(승인), rejected(반려)';

SELECT '사출조건 테이블 생성 완료' as result;
