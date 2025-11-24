-- companies 테이블 생성 (제작처/생산처 통합)
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  company_code VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  company_type VARCHAR(20) NOT NULL CHECK (company_type IN ('maker', 'plant')),
  
  -- 기본 정보
  business_number VARCHAR(50),
  representative VARCHAR(100),
  
  -- 연락처
  phone VARCHAR(20),
  fax VARCHAR(20),
  email VARCHAR(100),
  
  -- 주소
  address VARCHAR(500),
  address_detail VARCHAR(200),
  postal_code VARCHAR(20),
  
  -- GPS 위치
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- 담당자
  manager_name VARCHAR(100),
  manager_phone VARCHAR(20),
  manager_email VARCHAR(100),
  
  -- 계약 정보
  contract_start_date DATE,
  contract_end_date DATE,
  contract_status VARCHAR(20) DEFAULT 'active' CHECK (contract_status IN ('active', 'expired', 'suspended')),
  
  -- 평가 정보
  rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
  quality_score DECIMAL(5, 2) CHECK (quality_score >= 0 AND quality_score <= 100),
  delivery_score DECIMAL(5, 2) CHECK (delivery_score >= 0 AND delivery_score <= 100),
  
  -- 능력 정보 (제작처 전용)
  production_capacity INTEGER,
  equipment_list JSONB,
  certifications JSONB,
  specialties JSONB,
  
  -- 생산 정보 (생산처 전용)
  production_lines INTEGER,
  injection_machines JSONB,
  daily_capacity INTEGER,
  
  -- 통계
  total_molds INTEGER DEFAULT 0,
  active_molds INTEGER DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  
  -- 기타
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  registered_by INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_companies_company_code ON companies(company_code);
CREATE INDEX IF NOT EXISTS idx_companies_company_type ON companies(company_type);
CREATE INDEX IF NOT EXISTS idx_companies_company_name ON companies(company_name);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_contract_status ON companies(contract_status);

-- users 테이블에 company_id 컬럼 추가 (이미 있으면 무시)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE users ADD COLUMN company_id INTEGER REFERENCES companies(id);
    CREATE INDEX idx_users_company_id ON users(company_id);
  END IF;
END $$;

-- molds 테이블에 company_id 컬럼 추가 (이미 있으면 무시)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'molds' AND column_name = 'maker_company_id'
  ) THEN
    ALTER TABLE molds ADD COLUMN maker_company_id INTEGER REFERENCES companies(id);
    CREATE INDEX idx_molds_maker_company_id ON molds(maker_company_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'molds' AND column_name = 'plant_company_id'
  ) THEN
    ALTER TABLE molds ADD COLUMN plant_company_id INTEGER REFERENCES companies(id);
    CREATE INDEX idx_molds_plant_company_id ON molds(plant_company_id);
  END IF;
END $$;

-- mold_specifications 테이블에 company_id 컬럼 추가 (이미 있으면 무시)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mold_specifications' AND column_name = 'maker_company_id'
  ) THEN
    ALTER TABLE mold_specifications ADD COLUMN maker_company_id INTEGER REFERENCES companies(id);
    CREATE INDEX idx_mold_specifications_maker_company_id ON mold_specifications(maker_company_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mold_specifications' AND column_name = 'plant_company_id'
  ) THEN
    ALTER TABLE mold_specifications ADD COLUMN plant_company_id INTEGER REFERENCES companies(id);
    CREATE INDEX idx_mold_specifications_plant_company_id ON mold_specifications(plant_company_id);
  END IF;
END $$;

-- 마이그레이션 기록 추가
INSERT INTO "SequelizeMeta" (name) 
VALUES ('20251124000000-create-companies-table.js')
ON CONFLICT (name) DO NOTHING;

SELECT 'Companies table created successfully!' AS result;
