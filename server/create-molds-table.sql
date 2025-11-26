-- Create molds table
CREATE TABLE IF NOT EXISTS molds (
  id SERIAL PRIMARY KEY,
  mold_code VARCHAR(50) UNIQUE NOT NULL,
  mold_name VARCHAR(200) NOT NULL,
  car_model VARCHAR(100),
  part_name VARCHAR(200),
  cavity INTEGER,
  plant_id INTEGER,
  maker_id INTEGER,
  maker_company_id INTEGER REFERENCES companies(id),
  plant_company_id INTEGER REFERENCES companies(id),
  specification_id INTEGER REFERENCES mold_specifications(id),
  qr_token VARCHAR(255) UNIQUE,
  sop_date DATE,
  eop_date DATE,
  target_shots INTEGER,
  current_shots INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  location VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_molds_plant ON molds(plant_id);
CREATE INDEX IF NOT EXISTS idx_molds_maker ON molds(maker_id);
CREATE INDEX IF NOT EXISTS idx_molds_specification ON molds(specification_id);
CREATE INDEX IF NOT EXISTS idx_molds_qr_token ON molds(qr_token);
CREATE INDEX IF NOT EXISTS idx_molds_status ON molds(status);

-- Add foreign key constraint
ALTER TABLE mold_specifications
DROP CONSTRAINT IF EXISTS fk_mold_specifications_mold_id;

ALTER TABLE mold_specifications
ADD CONSTRAINT fk_mold_specifications_mold_id
FOREIGN KEY (mold_id) 
REFERENCES molds(id)
ON UPDATE CASCADE
ON DELETE SET NULL;

-- Verify
SELECT 'molds table created successfully' as status;
SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('molds', 'mold_specifications') ORDER BY tablename;
