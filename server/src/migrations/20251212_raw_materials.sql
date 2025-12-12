-- 원재료 기초정보 테이블
-- 생성일: 2025-12-12
-- 구조: MS SPEC, 타입, 그레이드, 공급업체, 원재료 수축률, 비중, 금형수축률

CREATE TABLE IF NOT EXISTS raw_materials (
  id SERIAL PRIMARY KEY,
  
  -- 기본 정보 (핵심 컬럼)
  ms_spec VARCHAR(50) NOT NULL,              -- MS SPEC 코드 (예: MS213-67)
  material_type VARCHAR(200) NOT NULL,        -- 타입 (예: PP-GF20-067 TYPE B-1)
  grade VARCHAR(100),                         -- 그레이드 (예: H2202)
  supplier VARCHAR(200),                      -- 공급업체 (예: 몰딩케미칼)
  
  -- 수축률 및 물성 정보
  shrinkage_rate VARCHAR(50),                 -- 원재료 수축률 (예: 1/1000)
  specific_gravity DECIMAL(5, 3),             -- 비중 (예: 1.04)
  mold_shrinkage VARCHAR(50),                 -- 금형수축률 (예: 1/1000)
  
  -- 기타
  notes TEXT,                                 -- 비고
  sort_order INTEGER DEFAULT 0,               -- 정렬 순서
  is_active BOOLEAN DEFAULT TRUE,             -- 활성 여부
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_raw_materials_ms_spec ON raw_materials(ms_spec);
CREATE INDEX IF NOT EXISTS idx_raw_materials_type ON raw_materials(material_type);
CREATE INDEX IF NOT EXISTS idx_raw_materials_supplier ON raw_materials(supplier);
CREATE INDEX IF NOT EXISTS idx_raw_materials_active ON raw_materials(is_active);

-- ms_spec_materials 데이터 기반 초기 데이터 삽입
-- 몰딩케미칼 (molding_machine)
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS213-67', 'PP-GF20-067 TYPE B-1', 'H2202', '몰딩케미칼', '6/1000', 1.04, '6/1000', 1),
('MS213-53', 'PP-GF30-053', 'HE151', '몰딩케미칼', '4/1000', 1.14, '4/1000', 2),
('MS231-10', 'PE-HD-010 TYPE D', 'EM725', '몰딩케미칼', '15/1000', 0.95, '15/1000', 3),
('MS213-24', 'PP-(MS213-24 TYPE A)', 'M-1250', '몰딩케미칼', '12/1000', 0.90, '12/1000', 4),
('MS213-57', 'PP-(TD+GX)5-057', 'MW160', '몰딩케미칼', '8/1000', 1.00, '8/1000', 5),
('MS213-67', 'PP-GF20-067 TYPE B-2', 'HG140', '몰딩케미칼', '6/1000', 1.04, '6/1000', 6),
('MS213-57', 'PP-TD20 TYPE B-1', 'HT345', '몰딩케미칼', '8/1000', 1.00, '8/1000', 7),
('MS213-57', 'PP-TD20-057 TYPE D-2', 'HO148', '몰딩케미칼', '8/1000', 1.00, '8/1000', 8),
('MS213-70', 'PP-TD20-070 TYPE B', 'HT4501', '몰딩케미칼', '7/1000', 1.00, '7/1000', 9),
('MS220-19', 'TPO-019 TYPE B-1', 'HR850', '몰딩케미칼', NULL, 0.90, NULL, 10),
('MS220-19', 'TPO-019 TYPE B-2', 'HR860', '몰딩케미칼', NULL, 0.90, NULL, 11);

-- GSS플라스틱 (gss_plastics)
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS213-67', 'PP-GF20-067 TYPE B-1', 'G-152', 'GSS플라스틱', '6/1000', 1.04, '6/1000', 12),
('MS231-10', 'PE-HD-010 TYPE D', 'RA-415', 'GSS플라스틱', '15/1000', 0.95, '15/1000', 13),
('MS213-24', 'PP-(MS213-24 TYPE A)', 'P-320', 'GSS플라스틱', '12/1000', 0.90, '12/1000', 14),
('MS213-57', 'PP-(TD+GX)5-057', 'JHC-375KH', 'GSS플라스틱', '8/1000', 1.00, '8/1000', 15),
('MS213-67', 'PP-GF20-067 TYPE B-2', 'H2272', 'GSS플라스틱', '6/1000', 1.04, '6/1000', 16),
('MS213-57', 'PP-TD20 TYPE B-1', 'ST920', 'GSS플라스틱', '8/1000', 1.00, '8/1000', 17),
('MS213-57', 'PP-TD20-057 TYPE D-2', 'SW9205', 'GSS플라스틱', '8/1000', 1.00, '8/1000', 18),
('MS213-70', 'PP-TD20-070 TYPE B', 'M1772U', 'GSS플라스틱', '7/1000', 1.00, '7/1000', 19),
('MS220-19', 'TPO-019 TYPE B-2', 'M7392', 'GSS플라스틱', NULL, 0.90, NULL, 20);

-- 금호석유화학 (kumho_petrochemical)
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS213-53', 'PP-GF30-053', 'WR9130I', '금호석유화학', '4/1000', 1.14, '4/1000', 21),
('MS225-22', 'ASA-02 TYPE B', 'HS-350DB', '금호석유화학', '5/1000', 1.07, '5/1000', 22),
('MS213-57', 'PP-(TD+GX)5-057', 'JHC-375KH', '금호석유화학', '8/1000', 1.00, '8/1000', 23),
('MS213-57', 'PP-TD20 TYPE B-1', 'JHC-372', '금호석유화학', '8/1000', 1.00, '8/1000', 24),
('MS213-57', 'PP-TD20-057 TYPE D-2', 'JHC-374GW', '금호석유화학', '8/1000', 1.00, '8/1000', 25),
('MS220-19', 'TPO-019 TYPE B-1', 'SRX-373', '금호석유화학', NULL, 0.90, NULL, 26),
('MS220-19', 'TPO-019 TYPE B-2', 'SRX-373M', '금호석유화학', NULL, 0.90, NULL, 27);

-- LG화학 (lg_chem)
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS213-67', 'PP-GF20-067 TYPE B-1', 'GH24B', 'LG화학', '6/1000', 1.04, '6/1000', 28),
('MS213-53', 'PP-GF30-053', 'XC2GJ', 'LG화학', '4/1000', 1.14, '4/1000', 29),
('MS231-10', 'PE-HD-010 TYPE D', 'MS20', 'LG화학', '15/1000', 0.95, '15/1000', 30),
('MS213-57', 'PP-(TD+GX)5-057', 'GW71', 'LG화학', '8/1000', 1.00, '8/1000', 31),
('MS213-67', 'PP-GF20-067 TYPE B-2', 'HG42D', 'LG화학', '6/1000', 1.04, '6/1000', 32),
('MS213-57', 'PP-TD20 TYPE B-1', 'MT62HS', 'LG화학', '8/1000', 1.00, '8/1000', 33),
('MS213-57', 'PP-TD20-057 TYPE D-2', 'MW42HS', 'LG화학', '8/1000', 1.00, '8/1000', 34),
('MS220-19', 'TPO-019 TYPE B-1', 'MR71', 'LG화학', NULL, 0.90, NULL, 35),
('MS220-19', 'TPO-019 TYPE B-2', 'MR715', 'LG화학', NULL, 0.90, NULL, 36),
('MS947-05', 'PC-005 TYPE B', 'AE5CHW600FT', 'LG화학', '5/1000', 1.20, '5/1000', 37);

-- 롯데케미칼 (lotte_chemical)
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS213-67', 'PP-GF20-067 TYPE B-1', 'GP-2200', '롯데케미칼', '6/1000', 1.04, '6/1000', 38),
('MS213-53', 'PP-GF30-053', 'L1951', '롯데케미칼', '4/1000', 1.14, '4/1000', 39),
('MS213-57', 'PP-TD20 TYPE B-1', 'TI72H', '롯데케미칼', '8/1000', 1.00, '8/1000', 40),
('MS213-57', 'PP-TD20-057 TYPE D-2', 'GW62', '롯데케미칼', '8/1000', 1.00, '8/1000', 41),
('MS220-19', 'TPO-019 TYPE B-1', 'BR84HP', '롯데케미칼', NULL, 0.90, NULL, 42),
('MS220-19', 'TPO-019 TYPE B-2', 'BR84HN', '롯데케미칼', NULL, 0.90, NULL, 43),
('MS947-05', 'PC-005 TYPE B', 'PC0NF-1130RI', '롯데케미칼', '5/1000', 1.20, '5/1000', 44);

-- SABIC
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS213-67', 'PP-GF20-067 TYPE B-1', 'G-1538', 'SABIC', '6/1000', 1.04, '6/1000', 45);

-- 등록업체 (registered_company)
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS213-67', 'PP-GF20-067 TYPE B-1', 'EP130G5', '등록업체', '6/1000', 1.04, '6/1000', 46),
('MS225-22', 'ASA-02 TYPE B', '123-50W175', '등록업체', '5/1000', 1.07, '5/1000', 47);

-- 신규업체확인필요
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS213-67', 'PP-GF20-067 TYPE B-1', 'S-2202', '신규업체확인필요', '6/1000', 1.04, '6/1000', 48),
('MS213-67', 'PP-GF20-067 TYPE B-1I', 'KPG1020', '신규업체확인필요', '6/1000', 1.04, '6/1000', 49),
('MS225-22', 'ASA-02 TYPE B', '7/81', '신규업체확인필요', '5/1000', 1.07, '5/1000', 50),
('MS213-57', 'PP-TD20 TYPE B-1', 'TC-03NS', '신규업체확인필요', '8/1000', 1.00, '8/1000', 51),
('MS947-05', 'PC-005 TYPE B', 'ASA(7576)', '신규업체확인필요', '5/1000', 1.20, '5/1000', 52);

COMMENT ON TABLE raw_materials IS '원재료 기초정보 테이블 - MS SPEC 기준 원재료 정보 관리';
