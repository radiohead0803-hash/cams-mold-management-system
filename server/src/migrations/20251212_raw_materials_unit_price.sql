-- 원재료 기초정보 테이블에 예상단가(kg) 컬럼 추가
-- 생성일: 2025-12-12

-- 1. unit_price 컬럼 추가 (원/kg)
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS unit_price INTEGER;

-- 2. 기존 데이터에 예상단가 정보 업데이트 (2024년 기준 시장가격 참고)

-- PP 계열 (범용 PP: 1,500~2,000원/kg)
UPDATE raw_materials SET unit_price = 1800 WHERE ms_spec IN ('MS213-10', 'MS213-15');
UPDATE raw_materials SET unit_price = 1900 WHERE ms_spec = 'MS213-20';
UPDATE raw_materials SET unit_price = 2000 WHERE ms_spec = 'MS213-24';

-- PP-GF 계열 (유리섬유 보강: 2,500~3,500원/kg)
UPDATE raw_materials SET unit_price = 3000 WHERE ms_spec = 'MS213-67';
UPDATE raw_materials SET unit_price = 3200 WHERE ms_spec = 'MS213-53';

-- PP-TD 계열 (탈크 충전: 2,000~2,500원/kg)
UPDATE raw_materials SET unit_price = 2300 WHERE ms_spec = 'MS213-57';
UPDATE raw_materials SET unit_price = 2400 WHERE ms_spec = 'MS213-70';

-- PP-EPDM 계열 (고무 블렌드: 2,500~3,000원/kg)
UPDATE raw_materials SET unit_price = 2800 WHERE ms_spec IN ('MS213-80', 'MS213-85');

-- PP-LGF 계열 (장섬유: 4,000~5,000원/kg)
UPDATE raw_materials SET unit_price = 4500 WHERE ms_spec = 'MS213-90';
UPDATE raw_materials SET unit_price = 5000 WHERE ms_spec = 'MS213-95';

-- TPO 계열 (열가소성 올레핀: 2,800~3,500원/kg)
UPDATE raw_materials SET unit_price = 3200 WHERE ms_spec = 'MS220-19';

-- ABS 계열 (범용: 2,500~3,000원/kg)
UPDATE raw_materials SET unit_price = 2800 WHERE ms_spec = 'MS225-01';
UPDATE raw_materials SET unit_price = 3000 WHERE ms_spec = 'MS225-05';
UPDATE raw_materials SET unit_price = 3500 WHERE ms_spec = 'MS225-10';

-- ASA 계열 (내후성: 4,000~5,000원/kg)
UPDATE raw_materials SET unit_price = 4500 WHERE ms_spec LIKE 'MS225-22%';

-- SAN 계열 (투명: 3,000~3,500원/kg)
UPDATE raw_materials SET unit_price = 3200 WHERE ms_spec = 'MS225-30';

-- PE 계열 (범용: 1,500~2,000원/kg)
UPDATE raw_materials SET unit_price = 1600 WHERE ms_spec = 'MS231-05';
UPDATE raw_materials SET unit_price = 1800 WHERE ms_spec = 'MS231-10';
UPDATE raw_materials SET unit_price = 1700 WHERE ms_spec IN ('MS231-15', 'MS231-20');

-- PC 계열 (폴리카보네이트: 4,000~5,000원/kg)
UPDATE raw_materials SET unit_price = 4500 WHERE ms_spec = 'MS947-05';

-- PC/ABS 계열 (블렌드: 4,500~5,500원/kg)
UPDATE raw_materials SET unit_price = 5000 WHERE ms_spec = 'MS947-10';
UPDATE raw_materials SET unit_price = 5500 WHERE ms_spec = 'MS947-15';

-- PA6 계열 (나일론6: 3,500~4,500원/kg)
UPDATE raw_materials SET unit_price = 4000 WHERE ms_spec = 'MS310-06';

-- PA66 계열 (나일론66: 4,500~5,500원/kg)
UPDATE raw_materials SET unit_price = 5000 WHERE ms_spec = 'MS310-66';

-- PA-GF 계열 (유리섬유 보강: 5,000~7,000원/kg)
UPDATE raw_materials SET unit_price = 6000 WHERE ms_spec = 'MS310-30';
UPDATE raw_materials SET unit_price = 6500 WHERE ms_spec = 'MS310-33';

-- POM 계열 (아세탈: 3,500~4,500원/kg)
UPDATE raw_materials SET unit_price = 4000 WHERE ms_spec IN ('MS420-01', 'MS420-02');

-- PBT 계열 (범용: 4,000~5,000원/kg, GF: 5,500~6,500원/kg)
UPDATE raw_materials SET unit_price = 4500 WHERE ms_spec = 'MS430-01';
UPDATE raw_materials SET unit_price = 6000 WHERE ms_spec = 'MS430-30';

-- PMMA 계열 (아크릴: 4,000~5,000원/kg)
UPDATE raw_materials SET unit_price = 4500 WHERE ms_spec IN ('MS510-01', 'MS510-05');

-- PPS 계열 (슈퍼엔프라: 15,000~20,000원/kg)
UPDATE raw_materials SET unit_price = 18000 WHERE ms_spec = 'MS610-40';

-- PCT 계열 (고온용: 12,000~15,000원/kg)
UPDATE raw_materials SET unit_price = 13000 WHERE ms_spec = 'MS440-30';

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_raw_materials_unit_price ON raw_materials(unit_price);

COMMENT ON COLUMN raw_materials.unit_price IS '예상단가 (원/kg) - 시장 참고가격';
