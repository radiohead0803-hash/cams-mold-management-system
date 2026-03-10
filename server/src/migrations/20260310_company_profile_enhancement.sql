-- ============================================================
-- 협력사 프로필 시스템 대규모 개선
-- 2026-03-10
-- ============================================================

-- 1) companies 테이블에 GPS 좌표 + 프로필 승인 관련 컬럼 추가
ALTER TABLE companies ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS profile_status VARCHAR(20) DEFAULT 'approved';
  -- draft, pending_approval, approved, rejected
ALTER TABLE companies ADD COLUMN IF NOT EXISTS profile_draft JSONB DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS profile_submitted_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS profile_approved_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS profile_approved_by INTEGER REFERENCES users(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS profile_reject_reason TEXT;

-- 2) 담당자 정보 테이블 (공장/차종별 여러 명)
CREATE TABLE IF NOT EXISTS company_contacts (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_name VARCHAR(100) NOT NULL,
  contact_role VARCHAR(100),
  department VARCHAR(100),
  plant_name VARCHAR(100),
  car_model VARCHAR(100),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  email VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cc_company ON company_contacts (company_id);

-- 3) 인증현황 테이블 (인증서 사진/파일 + 주관처)
CREATE TABLE IF NOT EXISTS company_certifications (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cert_name VARCHAR(150) NOT NULL,
  cert_number VARCHAR(100),
  issuing_authority VARCHAR(150),
  issue_date DATE,
  expiry_date DATE,
  cert_file_url TEXT,
  cert_file_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'valid',
    -- valid, expired, pending_renewal
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ccert_company ON company_certifications (company_id);

-- 4) 사출기 요구사항/시방서 테이블
ALTER TABLE company_equipment ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE company_equipment ADD COLUMN IF NOT EXISTS spec_file_url TEXT;
ALTER TABLE company_equipment ADD COLUMN IF NOT EXISTS spec_file_name VARCHAR(255);
ALTER TABLE company_equipment ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved';
  -- pending, approved, rejected (수동입력 시 pending)
ALTER TABLE company_equipment ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);
ALTER TABLE company_equipment ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 5) 일반장비에도 승인 관련 컬럼 추가
ALTER TABLE company_general_equipment ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved';
ALTER TABLE company_general_equipment ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);
ALTER TABLE company_general_equipment ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
