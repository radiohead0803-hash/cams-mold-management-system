-- =============================================
-- 1. maintenance_types (유지보전 유형 마스터)
-- =============================================
CREATE TABLE IF NOT EXISTS maintenance_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO maintenance_types (code, name, description, icon, sort_order) VALUES
  ('periodic', '정기점검', '정기적으로 수행하는 금형 점검', 'Calendar', 1),
  ('cleaning', '세척', '금형 세척 작업', 'Droplets', 2),
  ('lubrication', '윤활', '금형 윤활 작업', 'Droplets', 3),
  ('fitting', '습합', '금형 습합 점검 및 조정', 'Settings', 4),
  ('repair', '수리', '금형 수리 작업', 'Wrench', 5),
  ('replacement', '부품교체', '금형 부품 교체', 'Cog', 6),
  ('calibration', '교정', '금형 교정 작업', 'Settings', 7),
  ('preventive', '예방정비', '예방적 유지보전 작업', 'CheckCircle', 8),
  ('other', '기타', '기타 유지보전 작업', 'Wrench', 9)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 2. maintenance_records (유지보전 기록)
-- =============================================
CREATE TABLE IF NOT EXISTS maintenance_records (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER NOT NULL REFERENCES molds(id),
  maintenance_type VARCHAR(50) NOT NULL,
  maintenance_category VARCHAR(100),
  description TEXT,
  work_details TEXT,
  cost INTEGER,
  performed_at TIMESTAMP WITH TIME ZONE,
  performed_by INTEGER REFERENCES users(id),
  next_maintenance_date DATE,
  next_maintenance_shots INTEGER,
  parts_replaced JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_maintenance_records_mold_id ON maintenance_records(mold_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_type ON maintenance_records(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_performed_at ON maintenance_records(performed_at DESC);

-- =============================================
-- 3. mold_history (통합 변경이력 테이블)
-- =============================================
CREATE TABLE IF NOT EXISTS mold_history (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER NOT NULL REFERENCES molds(id),
  history_type VARCHAR(50) NOT NULL,  -- created, status_change, transfer, repair, inspection, maintenance, specification, scrapping
  title VARCHAR(200) NOT NULL,
  description TEXT,
  changes JSONB DEFAULT '[]'::jsonb,  -- [{field, old_value, new_value}]
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id INTEGER REFERENCES users(id),
  user_name VARCHAR(100),
  source_table VARCHAR(100),   -- 원본 테이블명
  source_id INTEGER,           -- 원본 레코드 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mold_history_mold_id ON mold_history(mold_id);
CREATE INDEX IF NOT EXISTS idx_mold_history_type ON mold_history(history_type);
CREATE INDEX IF NOT EXISTS idx_mold_history_created_at ON mold_history(created_at DESC);
