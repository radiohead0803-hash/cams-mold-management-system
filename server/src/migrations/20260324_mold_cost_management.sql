-- 금형 원가/감가상각 관리 테이블
CREATE TABLE IF NOT EXISTS mold_costs (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER NOT NULL REFERENCES molds(id) ON DELETE CASCADE,
  acquisition_cost NUMERIC(15,2) DEFAULT 0,
  accumulated_repair_cost NUMERIC(15,2) DEFAULT 0,
  depreciation_method VARCHAR(20) DEFAULT 'straight_line',
  useful_life_years INTEGER DEFAULT 3,
  useful_life_shots INTEGER,
  salvage_value NUMERIC(15,2) DEFAULT 0,
  current_book_value NUMERIC(15,2) DEFAULT 0,
  total_production_qty INTEGER DEFAULT 0,
  cost_per_unit NUMERIC(10,4) DEFAULT 0,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mold_costs_mold_id ON mold_costs(mold_id);

-- 수리비 이력 테이블 (원가 자동 집계용)
CREATE TABLE IF NOT EXISTS mold_cost_history (
  id SERIAL PRIMARY KEY,
  mold_cost_id INTEGER REFERENCES mold_costs(id) ON DELETE CASCADE,
  mold_id INTEGER NOT NULL REFERENCES molds(id) ON DELETE CASCADE,
  cost_type VARCHAR(30) NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  description TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mold_cost_history_mold_id ON mold_cost_history(mold_id);
