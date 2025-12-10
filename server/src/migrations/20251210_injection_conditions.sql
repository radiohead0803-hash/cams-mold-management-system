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
  
  -- ========== 속도 설정 ==========
  speed_1 DECIMAL(6,1),               -- 속도 1차
  speed_2 DECIMAL(6,1),               -- 속도 2차
  speed_3 DECIMAL(6,1),               -- 속도 3차
  speed_4 DECIMAL(6,1),               -- 속도 4차
  speed_cooling DECIMAL(6,1),         -- 속도 냉각
  
  -- ========== 위치 설정 ==========
  position_pv DECIMAL(6,1),           -- 위치 PV
  position_1 DECIMAL(6,1),            -- 위치 #
  position_2 DECIMAL(6,1),            -- 위치 43
  position_3 DECIMAL(6,1),            -- 위치 21
  
  -- ========== 압력 설정 ==========
  pressure_1 DECIMAL(6,1),            -- 압력 1차
  pressure_2 DECIMAL(6,1),            -- 압력 2차
  pressure_3 DECIMAL(6,1),            -- 압력 3차
  pressure_4 DECIMAL(6,1),            -- 압력 4차
  
  -- ========== 시간 설정 ==========
  time_injection DECIMAL(6,2),        -- 시간 사출
  time_holding DECIMAL(6,2),          -- 시간 보압
  time_holding_3 DECIMAL(6,2),        -- 시간 보3
  time_holding_4 DECIMAL(6,2),        -- 시간 보4
  time_cooling DECIMAL(6,2),          -- 시간 냉각
  
  -- ========== 계량 속도 ==========
  metering_speed_vp DECIMAL(6,1),     -- 속도 VP
  metering_speed_1 DECIMAL(6,1),      -- 속도 계1
  metering_speed_2 DECIMAL(6,1),      -- 속도 계2
  metering_speed_3 DECIMAL(6,1),      -- 속도 계3
  
  -- ========== 계량 위치 ==========
  metering_position_1 DECIMAL(6,1),   -- 위치 1
  metering_position_2 DECIMAL(6,1),   -- 위치 2
  
  -- ========== 계량 압력 ==========
  metering_pressure_2 DECIMAL(6,1),   -- 압력 계2
  metering_pressure_3 DECIMAL(6,1),   -- 압력 3
  metering_pressure_4 DECIMAL(6,1),   -- 압력 4
  
  -- ========== 보압 설정 ==========
  holding_pressure_1 DECIMAL(6,1),    -- 보압 1차
  holding_pressure_2 DECIMAL(6,1),    -- 보압 2차
  holding_pressure_3 DECIMAL(6,1),    -- 보압 3차
  holding_pressure_4 DECIMAL(6,1),    -- 보압 4차
  holding_pressure_1h DECIMAL(6,1),   -- 보압 1H
  holding_pressure_2h DECIMAL(6,1),   -- 보압 2H
  holding_pressure_3h DECIMAL(6,1),   -- 보압 3H
  
  -- ========== BARREL 온도 ==========
  barrel_temp_1 DECIMAL(6,1),         -- BARREL 1
  barrel_temp_2 DECIMAL(6,1),         -- BARREL 2
  barrel_temp_3 DECIMAL(6,1),         -- BARREL 3
  barrel_temp_4 DECIMAL(6,1),         -- BARREL 4
  barrel_temp_5 DECIMAL(6,1),         -- BARREL 5
  barrel_temp_6 DECIMAL(6,1),         -- BARREL 6
  barrel_temp_7 DECIMAL(6,1),         -- BARREL 7
  barrel_temp_8 DECIMAL(6,1),         -- BARREL 8
  barrel_temp_9 DECIMAL(6,1),         -- BARREL 9
  
  -- ========== 핫런너 설정 ==========
  hot_runner_installed BOOLEAN DEFAULT false,  -- 핫런너 설치 유무
  hot_runner_type VARCHAR(50),                 -- 핫런너 타입 (open, valve_gate)
  
  -- H/R 온도 (핫런너 설치 시)
  hr_temp_1 DECIMAL(6,1),             -- H/R 1
  hr_temp_2 DECIMAL(6,1),             -- H/R 2
  hr_temp_3 DECIMAL(6,1),             -- H/R 3
  hr_temp_4 DECIMAL(6,1),             -- H/R 4
  hr_temp_5 DECIMAL(6,1),             -- H/R 5
  hr_temp_6 DECIMAL(6,1),             -- H/R 6
  hr_temp_7 DECIMAL(6,1),             -- H/R 7
  hr_temp_8 DECIMAL(6,1),             -- H/R 8
  
  -- ========== 밸브게이트 ==========
  valve_gate_count INTEGER DEFAULT 0,          -- 밸브게이트 수량
  valve_gate_data JSONB DEFAULT '[]'::jsonb,   -- 밸브게이트 데이터 [{seq, moving, fixed}]
  
  -- ========== 칠러온도 ==========
  chiller_temp_main DECIMAL(6,1),     -- 칠러온도 메인
  chiller_temp_moving DECIMAL(6,1),   -- 칠러온도 가동
  chiller_temp_fixed DECIMAL(6,1),    -- 칠러온도 고정
  
  -- ========== 기타 설정 ==========
  cycle_time DECIMAL(6,2),            -- 사이클 타임
  
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
