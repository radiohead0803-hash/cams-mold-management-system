-- 원재료 테이블 확장 - 그레이드 코드 추가 및 공급업체명 수정
-- 생성일: 2025-12-12

-- 1. 그레이드 코드 컬럼 추가
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS grade_code VARCHAR(50);

-- 2. 공급업체명 수정
-- 몰딩케미칼 → 롯데케미칼
UPDATE raw_materials SET supplier = '롯데케미칼' WHERE supplier = '몰딩케미칼';

-- GSS플라스틱 → GS케미칼
UPDATE raw_materials SET supplier = 'GS케미칼' WHERE supplier = 'GSS플라스틱';

-- 3. 그레이드 코드 데이터 업데이트 (공급업체별 실제 그레이드 코드)
-- 롯데케미칼 PP 제품군
UPDATE raw_materials SET grade_code = 'SEP-550' WHERE supplier = '롯데케미칼' AND ms_spec = 'MS213-67' AND material_type LIKE 'PP-GF%';
UPDATE raw_materials SET grade_code = 'SEB-130' WHERE supplier = '롯데케미칼' AND ms_spec = 'MS213-53';
UPDATE raw_materials SET grade_code = 'SEB-140' WHERE supplier = '롯데케미칼' AND ms_spec = 'MS231-10';
UPDATE raw_materials SET grade_code = 'SET-350' WHERE supplier = '롯데케미칼' AND ms_spec = 'MS213-24';
UPDATE raw_materials SET grade_code = 'SET-520' WHERE supplier = '롯데케미칼' AND ms_spec = 'MS213-57' AND material_type LIKE 'PP-TD%';
UPDATE raw_materials SET grade_code = 'SET-570' WHERE supplier = '롯데케미칼' AND ms_spec = 'MS213-70';
UPDATE raw_materials SET grade_code = 'SEO-850' WHERE supplier = '롯데케미칼' AND ms_spec = 'MS220-19';

-- GS케미칼 PP 제품군
UPDATE raw_materials SET grade_code = 'GC-PP-GF20' WHERE supplier = 'GS케미칼' AND material_type LIKE 'PP-GF%';
UPDATE raw_materials SET grade_code = 'GC-PE-HD10' WHERE supplier = 'GS케미칼' AND material_type LIKE 'PE-HD%';
UPDATE raw_materials SET grade_code = 'GC-PP-24A' WHERE supplier = 'GS케미칼' AND ms_spec = 'MS213-24';
UPDATE raw_materials SET grade_code = 'GC-PP-TD5' WHERE supplier = 'GS케미칼' AND material_type LIKE 'PP-(TD+GX)%';

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_raw_materials_grade_code ON raw_materials(grade_code);

COMMENT ON COLUMN raw_materials.grade_code IS '공급업체 그레이드 코드';
