-- 체크리스트 마스터 통합 시스템 마이그레이션
-- 2025-12-17

-- 1. 점검주기 코드 테이블
CREATE TABLE IF NOT EXISTS checklist_cycle_codes (
  id SERIAL PRIMARY KEY,
  label VARCHAR(50) NOT NULL UNIQUE,
  cycle_type VARCHAR(20) NOT NULL CHECK (cycle_type IN ('daily', 'shots')),
  cycle_shots INTEGER,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 기본 주기 코드 삽입
INSERT INTO checklist_cycle_codes (label, cycle_type, cycle_shots, description, sort_order) VALUES
  ('DAILY', 'daily', NULL, '매일/생산전 점검', 1),
  ('20000', 'shots', 20000, '20,000 SHOT 정기점검', 2),
  ('50000', 'shots', 50000, '50,000 SHOT 정기점검', 3),
  ('80000', 'shots', 80000, '80,000 SHOT 정기점검', 4),
  ('100000', 'shots', 100000, '100,000 SHOT 정기점검', 5)
ON CONFLICT (label) DO NOTHING;

-- 2. 점검항목 마스터 테이블
CREATE TABLE IF NOT EXISTS checklist_items_master (
  id SERIAL PRIMARY KEY,
  major_category VARCHAR(100) NOT NULL,
  item_name VARCHAR(200) NOT NULL,
  description TEXT,
  check_method TEXT,
  required_photo BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklist_items_category ON checklist_items_master(major_category);
CREATE INDEX IF NOT EXISTS idx_checklist_items_active ON checklist_items_master(is_active);

-- 3. 체크리스트 마스터 버전 테이블
CREATE TABLE IF NOT EXISTS checklist_master_versions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'deployed')),
  version INTEGER DEFAULT 1,
  target_type VARCHAR(50) DEFAULT 'all',
  created_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  deployed_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  deployed_at TIMESTAMP,
  change_reason TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_current_deployed BOOLEAN DEFAULT FALSE,
  snapshot_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklist_versions_status ON checklist_master_versions(status);
CREATE INDEX IF NOT EXISTS idx_checklist_versions_deployed ON checklist_master_versions(is_current_deployed);

-- 4. 버전-항목 매핑 테이블
CREATE TABLE IF NOT EXISTS checklist_version_item_maps (
  id SERIAL PRIMARY KEY,
  checklist_version_id INTEGER NOT NULL REFERENCES checklist_master_versions(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES checklist_items_master(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(checklist_version_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_version_item_maps_version ON checklist_version_item_maps(checklist_version_id);

-- 5. 항목-주기 매핑 테이블 (M:N)
CREATE TABLE IF NOT EXISTS checklist_item_cycle_maps (
  id SERIAL PRIMARY KEY,
  checklist_version_id INTEGER NOT NULL REFERENCES checklist_master_versions(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES checklist_items_master(id) ON DELETE CASCADE,
  cycle_code_id INTEGER NOT NULL REFERENCES checklist_cycle_codes(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(checklist_version_id, item_id, cycle_code_id)
);

CREATE INDEX IF NOT EXISTS idx_item_cycle_maps_version ON checklist_item_cycle_maps(checklist_version_id);
CREATE INDEX IF NOT EXISTS idx_item_cycle_maps_cycle ON checklist_item_cycle_maps(cycle_code_id);

-- 6. 점검 스케줄 테이블 (루프 기반)
CREATE TABLE IF NOT EXISTS inspection_schedules (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER NOT NULL REFERENCES molds(id) ON DELETE CASCADE,
  checklist_version_id INTEGER REFERENCES checklist_master_versions(id),
  item_id INTEGER REFERENCES checklist_items_master(id),
  cycle_code_id INTEGER NOT NULL REFERENCES checklist_cycle_codes(id),
  last_done_shots INTEGER,
  next_due_shots INTEGER,
  last_done_at TIMESTAMP,
  next_due_date DATE,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'due', 'overdue', 'completed')),
  overdue_percentage DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspection_schedules_mold ON inspection_schedules(mold_id);
CREATE INDEX IF NOT EXISTS idx_inspection_schedules_status ON inspection_schedules(status);
CREATE INDEX IF NOT EXISTS idx_inspection_schedules_due ON inspection_schedules(next_due_shots);
CREATE INDEX IF NOT EXISTS idx_inspection_schedules_mold_cycle ON inspection_schedules(mold_id, cycle_code_id, status);

-- 7. 점검 인스턴스 테이블 (실행 헤더)
CREATE TABLE IF NOT EXISTS inspection_instances (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER NOT NULL REFERENCES molds(id),
  checklist_version_id INTEGER REFERENCES checklist_master_versions(id),
  cycle_code_id INTEGER NOT NULL REFERENCES checklist_cycle_codes(id),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
  current_shots INTEGER,
  inspection_date DATE NOT NULL,
  gps_latitude DECIMAL(10,8),
  gps_longitude DECIMAL(11,8),
  overall_result VARCHAR(20) CHECK (overall_result IN ('good', 'caution', 'bad')),
  notes TEXT,
  submitted_at TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspection_instances_mold ON inspection_instances(mold_id);
CREATE INDEX IF NOT EXISTS idx_inspection_instances_status ON inspection_instances(status);
CREATE INDEX IF NOT EXISTS idx_inspection_instances_date ON inspection_instances(inspection_date);

-- 8. 점검 인스턴스 항목 테이블 (실행 상세)
CREATE TABLE IF NOT EXISTS inspection_instance_items (
  id SERIAL PRIMARY KEY,
  inspection_instance_id INTEGER NOT NULL REFERENCES inspection_instances(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES checklist_items_master(id),
  result VARCHAR(20) CHECK (result IN ('good', 'caution', 'bad', 'na')),
  note TEXT,
  photo_urls JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instance_items_instance ON inspection_instance_items(inspection_instance_id);
CREATE INDEX IF NOT EXISTS idx_instance_items_result ON inspection_instance_items(result);

-- 9. 알림 테이블에 점검 관련 필드 추가 (이미 존재하면 무시)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'schedule_id') THEN
    ALTER TABLE notifications ADD COLUMN schedule_id INTEGER REFERENCES inspection_schedules(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'cooldown_key') THEN
    ALTER TABLE notifications ADD COLUMN cooldown_key VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'severity') THEN
    ALTER TABLE notifications ADD COLUMN severity VARCHAR(20) DEFAULT 'medium';
  END IF;
END $$;

-- 10. 샘플 점검항목 데이터 삽입
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
  ('금형 외관 점검', '금형 외관 상태', '금형 외관의 손상, 변형, 녹 발생 여부를 확인합니다.', '육안 검사 및 촉감 확인', TRUE, 1),
  ('금형 외관 점검', '명판 부착 상태', '금형 명판이 정확하게 부착되어 있는지 확인합니다.', 'QR코드 스캔 및 육안 확인', FALSE, 2),
  ('금형 외관 점검', '볼트/너트 체결 상태', '모든 볼트와 너트가 적정 토크로 체결되어 있는지 확인합니다.', '토크렌치 사용 또는 육안 확인', FALSE, 3),
  ('냉각 시스템', '냉각수 누수 여부', '냉각 라인에서 누수가 발생하는지 확인합니다.', '육안 검사 및 압력 테스트', TRUE, 4),
  ('냉각 시스템', '냉각 호스 연결 상태', '냉각 호스가 올바르게 연결되어 있는지 확인합니다.', '육안 검사', FALSE, 5),
  ('작동부 점검', '이젝터 핀 작동', '이젝터 핀이 원활하게 작동하는지 확인합니다.', '수동 작동 테스트', FALSE, 6),
  ('작동부 점검', '슬라이드 코어 작동', '슬라이드 코어가 원활하게 작동하는지 확인합니다.', '수동 작동 테스트', FALSE, 7),
  ('작동부 점검', '유압 실린더 작동', '유압 실린더가 정상 작동하는지 확인합니다.', '작동 테스트 및 압력 확인', FALSE, 8),
  ('성형면 점검', '성형면 손상 여부', '성형면에 스크래치, 찍힘, 마모가 있는지 확인합니다.', '육안 검사 및 촉감 확인', TRUE, 9),
  ('성형면 점검', '성형면 청결 상태', '성형면에 이물질, 잔류물이 없는지 확인합니다.', '육안 검사', FALSE, 10)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE checklist_cycle_codes IS '점검주기 코드 테이블 - DAILY, SHOT 기반 주기 관리';
COMMENT ON TABLE checklist_items_master IS '점검항목 마스터 - 일상/정기/세척/습합 통합';
COMMENT ON TABLE checklist_master_versions IS '체크리스트 마스터 버전 - Draft/Review/Approved/Deployed 상태 관리';
COMMENT ON TABLE inspection_schedules IS '점검 스케줄 - 루프 기반 자동 갱신';
COMMENT ON TABLE inspection_instances IS '점검 실행 기록 - 특정 금형의 특정 주기 점검';
