-- MS SPEC 원소재 기초정보 테이블
-- 생성일: 2025-12-12

CREATE TABLE IF NOT EXISTS ms_spec_materials (
  id SERIAL PRIMARY KEY,
  
  -- MS SPEC 기본 정보
  ms_spec VARCHAR(100) NOT NULL,           -- MS SPEC 코드 (예: PP-GF20-067 TYPE B-1)
  spec_code VARCHAR(50),                    -- 현대/KP 코드 (예: MS213-67)
  
  -- 대체 정보
  alternative_code VARCHAR(50),             -- 대체 코드 (예: MS213-67 TB)
  
  -- 제작업체 대상 업체
  molding_machine VARCHAR(100),             -- 몰딩케미칼
  gss_plastics VARCHAR(100),                -- GSS플라스틱
  kumho_petrochemical VARCHAR(100),         -- 금호석유화학
  lg_chem VARCHAR(100),                     -- LG화학
  lotte_chemical VARCHAR(100),              -- 롯데케미칼
  sabic VARCHAR(100),                       -- SABIC
  
  -- 등록업체
  registered_company VARCHAR(100),          -- 등록업체
  
  -- 신규업체 확인 필요
  new_company_check VARCHAR(100),           -- 신규업체확인필요
  
  -- 메타 정보
  notes TEXT,                               -- 비고
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ms_spec_materials_spec ON ms_spec_materials(ms_spec);
CREATE INDEX IF NOT EXISTS idx_ms_spec_materials_spec_code ON ms_spec_materials(spec_code);

-- 초기 데이터 삽입
INSERT INTO ms_spec_materials (ms_spec, spec_code, alternative_code, molding_machine, gss_plastics, kumho_petrochemical, lg_chem, lotte_chemical, sabic, registered_company, new_company_check) VALUES
-- PP-GF 계열
('PP-GF20-067 TYPE B-1 (MS213-67)', 'MS213-67 TB', 'HG940-8001', 'H2202', 'G-152', NULL, 'GH24B', 'GP-2200', 'G-1538', 'EP130G5', 'S-2202'),
('PP-GF20-067 TPYE B-1I(MS 213-67)', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'KPG1020'),
('PP-GF30-053 (MS213-53)', 'MS213-53', NULL, 'HE151', NULL, 'WR9130I', 'XC2GJ', 'L1951', NULL, NULL, NULL),
('ASA-02 TYPE B (MS225-22)', 'MS225-22 TB', NULL, NULL, NULL, 'HS-350DB', NULL, NULL, NULL, '123-50W175', '7/81'),

-- 내열 및 고탄성율 유리섬유 TPE
('MS220-05 TPE', 'MS220-05 TR', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('PE-HD-010 TYPE D (MS 231-10)', 'MS231-10 TD', NULL, 'EM725', 'RA-415', NULL, 'MS20', NULL, NULL, NULL, NULL),
('PP-(MS213-24 TYPE A)', 'MS213-24 TA', NULL, 'M-1250', 'P-320', NULL, NULL, NULL, NULL, NULL, NULL),
('PP-(TD+GX)5-057 (MS213-57 E-2)', NULL, 'HC908', 'MW160', 'JHC-375KH', 'MW515S', 'GW71', NULL, NULL, NULL, NULL),
('PP-(TD+GX)5-057 TYPE E-2', 'MS213-57 E2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('PP-(TD+GX)5-057 TYPE E-2 (MS213-57)', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('PP-GF20-067 TYPE B-2 (MS213-67)', 'MS213-67 TB-2', NULL, 'HG140', 'H2272', NULL, 'HG42D', NULL, NULL, NULL, NULL),
('PP-TD15-026 TYPE A-2', NULL, 'HA130', NULL, 'AE-315', NULL, NULL, NULL, NULL, NULL, NULL),
('PP-TD20 TYPE B-1 (MS213-57)', 'MS213-57 TB-1', NULL, 'HT345', 'ST920', 'JHC-372', 'MT62HS', 'TI72H', NULL, NULL, 'TC-03NS'),
('PP-TD20-057 TPYE D-2 (MS213-57 D-2)', 'MS213-57 D2', NULL, 'HO148', 'SW9205', 'JHC-374GW', 'MW42HS', 'GW62', NULL, NULL, NULL),
('PP-TD20-070 TYPE B (MS213-70)', 'MS213-70 TB', NULL, 'HT4501', 'M1772U', NULL, NULL, NULL, NULL, NULL, NULL),
('TPO-019 TYPE B-1 (MS220-19)', 'MS220-19 TB', NULL, 'HR850', NULL, 'SRX-373', 'MR71', 'BR84HP', NULL, NULL, NULL),
('TPO-019 TYPE B-2 (MS220-19)', 'MS220-19 TB-2', NULL, 'HR860', 'M7392', 'SRX-373M', 'MR715', 'BR84HN', NULL, NULL, NULL),
('PC-005 TYPE B (MS947-05), SABIC H1130R', 'MS947-05 TB', NULL, NULL, NULL, NULL, 'AE5CHW600FT', 'PC0NF-1130RI', NULL, NULL, 'ASA(7576)');

COMMENT ON TABLE ms_spec_materials IS 'MS SPEC 원소재 기초정보 - 제작업체별 대응 소재 코드 관리';
