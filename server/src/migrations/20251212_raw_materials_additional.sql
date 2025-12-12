-- 원재료 기초정보 추가 데이터
-- 생성일: 2025-12-12
-- 1. 누락된 TPO 수축률 업데이트
-- 2. 자동차 제작용 플라스틱 MS SPEC 추가

-- ===== 1. TPO 계열 수축률 업데이트 (누락 항목) =====
UPDATE raw_materials 
SET shrinkage_rate = '12/1000', mold_shrinkage = '12/1000'
WHERE ms_spec = 'MS220-19' AND shrinkage_rate IS NULL;

-- ===== 2. 자동차 제작용 플라스틱 MS SPEC 추가 =====

-- ABS 계열 (Acrylonitrile Butadiene Styrene) - 내장재, 콘솔, 도어트림
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS225-01', 'ABS-01 TYPE A', 'HF380', '몰딩케미칼', '5/1000', 1.05, '5/1000', 100),
('MS225-01', 'ABS-01 TYPE A', 'AF312', 'LG화학', '5/1000', 1.05, '5/1000', 101),
('MS225-01', 'ABS-01 TYPE A', 'GP-22', '금호석유화학', '5/1000', 1.05, '5/1000', 102),
('MS225-05', 'ABS-05 HIGH IMPACT', 'HI-121', '몰딩케미칼', '5/1000', 1.04, '5/1000', 103),
('MS225-05', 'ABS-05 HIGH IMPACT', 'AF365H', 'LG화학', '5/1000', 1.04, '5/1000', 104),
('MS225-10', 'ABS-10 HEAT RESISTANT', 'HR-181', '몰딩케미칼', '4/1000', 1.06, '4/1000', 105),
('MS225-10', 'ABS-10 HEAT RESISTANT', 'AF380H', 'LG화학', '4/1000', 1.06, '4/1000', 106);

-- PC/ABS 계열 (Polycarbonate/ABS Blend) - 계기판, 에어백 커버, 필러
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS947-10', 'PC/ABS-010 TYPE A', 'NH-1000', '몰딩케미칼', '5/1000', 1.15, '5/1000', 110),
('MS947-10', 'PC/ABS-010 TYPE A', 'LUPOY PC/ABS', 'LG화학', '5/1000', 1.15, '5/1000', 111),
('MS947-10', 'PC/ABS-010 TYPE A', 'STAREX', '삼성SDI', '5/1000', 1.15, '5/1000', 112),
('MS947-15', 'PC/ABS-015 FLAME RETARDANT', 'NH-1500FR', '몰딩케미칼', '5/1000', 1.20, '5/1000', 113),
('MS947-15', 'PC/ABS-015 FLAME RETARDANT', 'LUPOY FR', 'LG화학', '5/1000', 1.20, '5/1000', 114);

-- PA (Polyamide/Nylon) 계열 - 엔진룸 부품, 연료 시스템
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS310-06', 'PA6-006 TYPE A', 'KOPLA PA6', '코오롱플라스틱', '8/1000', 1.13, '8/1000', 120),
('MS310-06', 'PA6-006 TYPE A', 'KOPA 6N', '코오롱인더스트리', '8/1000', 1.13, '8/1000', 121),
('MS310-06', 'PA6-006 TYPE A', 'ULTRAMID B3S', 'BASF', '8/1000', 1.13, '8/1000', 122),
('MS310-66', 'PA66-066 TYPE B', 'KOPLA PA66', '코오롱플라스틱', '15/1000', 1.14, '15/1000', 123),
('MS310-66', 'PA66-066 TYPE B', 'ULTRAMID A3K', 'BASF', '15/1000', 1.14, '15/1000', 124),
('MS310-66', 'PA66-066 TYPE B', 'ZYTEL 101', 'DuPont', '15/1000', 1.14, '15/1000', 125);

-- PA-GF (Glass Fiber Reinforced PA) - 엔진 커버, 인테이크 매니폴드
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS310-30', 'PA6-GF30', 'KOPLA PA6-GF30', '코오롱플라스틱', '3/1000', 1.36, '3/1000', 130),
('MS310-30', 'PA6-GF30', 'ULTRAMID B3WG6', 'BASF', '3/1000', 1.36, '3/1000', 131),
('MS310-33', 'PA66-GF33', 'KOPLA PA66-GF33', '코오롱플라스틱', '3/1000', 1.38, '3/1000', 132),
('MS310-33', 'PA66-GF33', 'ZYTEL 70G33', 'DuPont', '3/1000', 1.38, '3/1000', 133);

-- POM (Polyoxymethylene/Acetal) - 기어, 클립, 패스너
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS420-01', 'POM-01 HOMO', 'KEPITAL F10', '코오롱플라스틱', '20/1000', 1.41, '20/1000', 140),
('MS420-01', 'POM-01 HOMO', 'DELRIN 500P', 'DuPont', '20/1000', 1.42, '20/1000', 141),
('MS420-02', 'POM-02 COPO', 'KEPITAL F20', '코오롱플라스틱', '18/1000', 1.41, '18/1000', 142),
('MS420-02', 'POM-02 COPO', 'ULTRAFORM N2320', 'BASF', '18/1000', 1.41, '18/1000', 143);

-- PBT (Polybutylene Terephthalate) - 커넥터, 스위치, 센서 하우징
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS430-01', 'PBT-01 TYPE A', 'KOPBT 1100', '코오롱플라스틱', '15/1000', 1.31, '15/1000', 150),
('MS430-01', 'PBT-01 TYPE A', 'ULTRADUR B4500', 'BASF', '15/1000', 1.31, '15/1000', 151),
('MS430-01', 'PBT-01 TYPE A', 'CRASTIN S600', 'DuPont', '15/1000', 1.31, '15/1000', 152),
('MS430-30', 'PBT-GF30', 'KOPBT 3300', '코오롱플라스틱', '4/1000', 1.52, '4/1000', 153),
('MS430-30', 'PBT-GF30', 'ULTRADUR B4300G6', 'BASF', '4/1000', 1.52, '4/1000', 154);

-- PMMA (Polymethyl Methacrylate/Acrylic) - 램프 렌즈, 계기판 커버
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS510-01', 'PMMA-01 OPTICAL', 'ACRYL HI855', 'LG화학', '4/1000', 1.19, '4/1000', 160),
('MS510-01', 'PMMA-01 OPTICAL', 'PLEXIGLAS 8N', '롬앤하스', '4/1000', 1.19, '4/1000', 161),
('MS510-05', 'PMMA-05 HEAT RESISTANT', 'ACRYL HI835H', 'LG화학', '4/1000', 1.19, '4/1000', 162);

-- PP-EPDM (PP with EPDM Rubber) - 범퍼 페시아, 사이드 몰딩
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS213-80', 'PP-EPDM-080 TYPE A', 'HJ730', '몰딩케미칼', '10/1000', 0.91, '10/1000', 170),
('MS213-80', 'PP-EPDM-080 TYPE A', 'SEETEC PP-E', 'LG화학', '10/1000', 0.91, '10/1000', 171),
('MS213-80', 'PP-EPDM-080 TYPE A', 'J-700', '금호석유화학', '10/1000', 0.91, '10/1000', 172),
('MS213-85', 'PP-EPDM-085 HIGH FLOW', 'HJ750HF', '몰딩케미칼', '10/1000', 0.92, '10/1000', 173),
('MS213-85', 'PP-EPDM-085 HIGH FLOW', 'SEETEC PP-EH', 'LG화학', '10/1000', 0.92, '10/1000', 174);

-- PP-LGF (Long Glass Fiber PP) - 프론트엔드 모듈, 도어 모듈
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS213-90', 'PP-LGF30', 'CELSTRAN PP-GF30', '셀라니즈', '3/1000', 1.12, '3/1000', 180),
('MS213-90', 'PP-LGF30', 'STAMAX 30YM240', 'SABIC', '3/1000', 1.12, '3/1000', 181),
('MS213-95', 'PP-LGF40', 'CELSTRAN PP-GF40', '셀라니즈', '2/1000', 1.22, '2/1000', 182),
('MS213-95', 'PP-LGF40', 'STAMAX 40YM240', 'SABIC', '2/1000', 1.22, '2/1000', 183);

-- PE-LD (Low Density Polyethylene) - 와이어 하네스 커버
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS231-05', 'PE-LD-005 TYPE A', 'LUTENE LB5000', 'LG화학', '20/1000', 0.92, '20/1000', 190),
('MS231-05', 'PE-LD-005 TYPE A', 'HANWHA LDPE', '한화솔루션', '20/1000', 0.92, '20/1000', 191);

-- SAN (Styrene Acrylonitrile) - 계기판 렌즈
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS225-30', 'SAN-030 OPTICAL', 'LURAN 358N', 'BASF', '4/1000', 1.08, '4/1000', 200),
('MS225-30', 'SAN-030 OPTICAL', 'TYRIL 880', '다우케미칼', '4/1000', 1.08, '4/1000', 201);

-- PPS (Polyphenylene Sulfide) - 고온 엔진 부품
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS610-40', 'PPS-GF40', 'FORTRON 1140L4', '셀라니즈', '3/1000', 1.65, '3/1000', 210),
('MS610-40', 'PPS-GF40', 'RYTON R-4', '소르베이', '3/1000', 1.65, '3/1000', 211);

-- PCT (Polycyclohexylene Dimethylene Terephthalate) - 고온 커넥터
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS440-30', 'PCT-GF30', 'THERMX CG933', '듀폰', '3/1000', 1.45, '3/1000', 220),
('MS440-30', 'PCT-GF30', 'EKTAR GN071', '이스트만', '3/1000', 1.45, '3/1000', 221);

-- PP Homo (Homopolymer PP) - 배터리 케이스, 팬 슈라우드
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS213-10', 'PP-HOMO-010', 'HJ500', '몰딩케미칼', '15/1000', 0.90, '15/1000', 230),
('MS213-10', 'PP-HOMO-010', 'SEETEC H7500', 'LG화학', '15/1000', 0.90, '15/1000', 231),
('MS213-10', 'PP-HOMO-010', 'J-150', '금호석유화학', '15/1000', 0.90, '15/1000', 232),
('MS213-15', 'PP-HOMO-015 HIGH FLOW', 'HJ550HF', '몰딩케미칼', '15/1000', 0.90, '15/1000', 233),
('MS213-15', 'PP-HOMO-015 HIGH FLOW', 'SEETEC H7700', 'LG화학', '15/1000', 0.90, '15/1000', 234);

-- PP Random Copolymer - 투명 부품
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS213-20', 'PP-RANDOM-020', 'HR100', '몰딩케미칼', '14/1000', 0.90, '14/1000', 240),
('MS213-20', 'PP-RANDOM-020', 'SEETEC R7300', 'LG화학', '14/1000', 0.90, '14/1000', 241);

-- HDPE (High Density Polyethylene) - 연료탱크, 와셔 탱크
INSERT INTO raw_materials (ms_spec, material_type, grade, supplier, shrinkage_rate, specific_gravity, mold_shrinkage, sort_order) VALUES
('MS231-15', 'PE-HD-015 BLOW', 'ME9180', 'LG화학', '25/1000', 0.95, '25/1000', 250),
('MS231-15', 'PE-HD-015 BLOW', 'MARLEX HHM5502BN', '쉐브론필립스', '25/1000', 0.95, '25/1000', 251),
('MS231-20', 'PE-HD-020 INJECTION', 'ME6000', 'LG화학', '20/1000', 0.96, '20/1000', 252),
('MS231-20', 'PE-HD-020 INJECTION', 'HDPE 5502', '한화솔루션', '20/1000', 0.96, '20/1000', 253);

COMMENT ON TABLE raw_materials IS '원재료 기초정보 테이블 - MS SPEC 기준 원재료 정보 관리 (자동차 제작용 플라스틱 포함)';
