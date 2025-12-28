-- 톤수 마스터 테이블
CREATE TABLE IF NOT EXISTS machine_tonnages (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(50)  NOT NULL UNIQUE,   -- 예: 'T350', 'T500'
  name            VARCHAR(100) NOT NULL,          -- 예: '350톤', '500톤'
  tonnage_value   INTEGER      NOT NULL,          -- 실제 톤수 값
  description     TEXT,

  sort_order      INTEGER      DEFAULT 0,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,

  created_by      INTEGER,
  updated_by      INTEGER,

  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 금형재질 마스터 테이블
CREATE TABLE IF NOT EXISTS mold_materials (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(50)  NOT NULL UNIQUE,   -- 예: 'NAK80', 'P20'
  name            VARCHAR(100) NOT NULL,          -- 예: 'NAK80', 'P20'
  material_type   VARCHAR(50),                   -- 예: 'STEEL', 'ALUMINUM'
  hardness        VARCHAR(50),                   -- 예: 'HRC40-42'
  description     TEXT,

  sort_order      INTEGER      DEFAULT 0,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,

  created_by      INTEGER,
  updated_by      INTEGER,

  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 원재료(수지) 마스터 테이블
CREATE TABLE IF NOT EXISTS plastic_materials (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(50)  NOT NULL UNIQUE,   -- 예: 'PP', 'ABS', 'PC'
  name            VARCHAR(100) NOT NULL,          -- 예: 'Polypropylene', 'ABS'
  material_type   VARCHAR(50),                   -- 예: 'THERMOPLASTIC', 'THERMOSET'
  grade           VARCHAR(50),                   -- 예: 'GENERAL', 'ENGINEERING'
  supplier        VARCHAR(100),                  -- 공급업체
  description     TEXT,

  sort_order      INTEGER      DEFAULT 0,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,

  created_by      INTEGER,
  updated_by      INTEGER,

  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 불량코드 마스터 테이블
CREATE TABLE IF NOT EXISTS defect_codes (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(50)  NOT NULL UNIQUE,   -- 예: 'D001', 'D002'
  name            VARCHAR(100) NOT NULL,          -- 예: '플래시', '싱크마크'
  category        VARCHAR(50),                   -- 예: 'APPEARANCE', 'DIMENSION', 'FUNCTION'
  severity        VARCHAR(20),                   -- 예: 'CRITICAL', 'MAJOR', 'MINOR'
  description     TEXT,

  sort_order      INTEGER      DEFAULT 0,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,

  created_by      INTEGER,
  updated_by      INTEGER,

  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_machine_tonnages_code ON machine_tonnages(code);
CREATE INDEX IF NOT EXISTS idx_machine_tonnages_is_active ON machine_tonnages(is_active);

CREATE INDEX IF NOT EXISTS idx_mold_materials_code ON mold_materials(code);
CREATE INDEX IF NOT EXISTS idx_mold_materials_is_active ON mold_materials(is_active);

CREATE INDEX IF NOT EXISTS idx_plastic_materials_code ON plastic_materials(code);
CREATE INDEX IF NOT EXISTS idx_plastic_materials_is_active ON plastic_materials(is_active);

CREATE INDEX IF NOT EXISTS idx_defect_codes_code ON defect_codes(code);
CREATE INDEX IF NOT EXISTS idx_defect_codes_is_active ON defect_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_defect_codes_category ON defect_codes(category);

-- 트리거 생성
DROP TRIGGER IF EXISTS trg_machine_tonnages_updated_at ON machine_tonnages;
CREATE TRIGGER trg_machine_tonnages_updated_at
BEFORE UPDATE ON machine_tonnages
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_mold_materials_updated_at ON mold_materials;
CREATE TRIGGER trg_mold_materials_updated_at
BEFORE UPDATE ON mold_materials
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_plastic_materials_updated_at ON plastic_materials;
CREATE TRIGGER trg_plastic_materials_updated_at
BEFORE UPDATE ON plastic_materials
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_defect_codes_updated_at ON defect_codes;
CREATE TRIGGER trg_defect_codes_updated_at
BEFORE UPDATE ON defect_codes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 초기 데이터 삽입

-- 톤수
INSERT INTO machine_tonnages (code, name, tonnage_value, sort_order) VALUES
  ('T150', '150톤', 150, 1),
  ('T250', '250톤', 250, 2),
  ('T350', '350톤', 350, 3),
  ('T500', '500톤', 500, 4),
  ('T650', '650톤', 650, 5),
  ('T850', '850톤', 850, 6),
  ('T1000', '1000톤', 1000, 7),
  ('T1300', '1300톤', 1300, 8),
  ('T1600', '1600톤', 1600, 9),
  ('T2000', '2000톤', 2000, 10)
ON CONFLICT (code) DO NOTHING;

-- 금형재질
INSERT INTO mold_materials (code, name, material_type, hardness, sort_order) VALUES
  ('NAK80', 'NAK80', 'STEEL', 'HRC40-42', 1),
  ('P20', 'P20', 'STEEL', 'HRC28-32', 2),
  ('H13', 'H13', 'STEEL', 'HRC48-52', 3),
  ('S50C', 'S50C', 'STEEL', 'HRC20-25', 4),
  ('SKD61', 'SKD61', 'STEEL', 'HRC48-52', 5),
  ('AL7075', 'AL7075', 'ALUMINUM', 'HB150', 6),
  ('AL6061', 'AL6061', 'ALUMINUM', 'HB95', 7),
  ('STAVAX', 'STAVAX', 'STEEL', 'HRC48-52', 8)
ON CONFLICT (code) DO NOTHING;

-- 원재료(수지)
INSERT INTO plastic_materials (code, name, material_type, grade, sort_order) VALUES
  ('PP', 'Polypropylene', 'THERMOPLASTIC', 'GENERAL', 1),
  ('ABS', 'ABS', 'THERMOPLASTIC', 'ENGINEERING', 2),
  ('PC', 'Polycarbonate', 'THERMOPLASTIC', 'ENGINEERING', 3),
  ('PA6', 'Nylon 6', 'THERMOPLASTIC', 'ENGINEERING', 4),
  ('PA66', 'Nylon 66', 'THERMOPLASTIC', 'ENGINEERING', 5),
  ('POM', 'Polyacetal', 'THERMOPLASTIC', 'ENGINEERING', 6),
  ('PE', 'Polyethylene', 'THERMOPLASTIC', 'GENERAL', 7),
  ('PS', 'Polystyrene', 'THERMOPLASTIC', 'GENERAL', 8),
  ('PBT', 'PBT', 'THERMOPLASTIC', 'ENGINEERING', 9),
  ('PET', 'PET', 'THERMOPLASTIC', 'ENGINEERING', 10),
  ('TPU', 'TPU', 'THERMOPLASTIC', 'ELASTOMER', 11),
  ('TPE', 'TPE', 'THERMOPLASTIC', 'ELASTOMER', 12)
ON CONFLICT (code) DO NOTHING;

-- 불량코드
INSERT INTO defect_codes (code, name, category, severity, sort_order) VALUES
  ('D001', '플래시', 'APPEARANCE', 'MAJOR', 1),
  ('D002', '싱크마크', 'APPEARANCE', 'MAJOR', 2),
  ('D003', '웰드라인', 'APPEARANCE', 'MINOR', 3),
  ('D004', '플로우마크', 'APPEARANCE', 'MINOR', 4),
  ('D005', '버블', 'APPEARANCE', 'MAJOR', 5),
  ('D006', '변색', 'APPEARANCE', 'MINOR', 6),
  ('D007', '치수불량', 'DIMENSION', 'CRITICAL', 7),
  ('D008', '휨', 'DIMENSION', 'MAJOR', 8),
  ('D009', '크랙', 'FUNCTION', 'CRITICAL', 9),
  ('D010', '미성형', 'FUNCTION', 'CRITICAL', 10),
  ('D011', '이물질', 'APPEARANCE', 'MAJOR', 11),
  ('D012', '스크래치', 'APPEARANCE', 'MINOR', 12)
ON CONFLICT (code) DO NOTHING;

-- 테이블 코멘트
COMMENT ON TABLE machine_tonnages IS '사출기 톤수 마스터 테이블';
COMMENT ON TABLE mold_materials IS '금형재질 마스터 테이블';
COMMENT ON TABLE plastic_materials IS '원재료(수지) 마스터 테이블';
COMMENT ON TABLE defect_codes IS '불량코드 마스터 테이블';
