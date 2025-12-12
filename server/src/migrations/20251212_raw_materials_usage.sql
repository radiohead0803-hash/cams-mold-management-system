-- 원재료 기초정보 테이블에 용도(usage) 컬럼 추가
-- 생성일: 2025-12-12

-- 1. usage 컬럼 추가
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS usage VARCHAR(500);

-- 2. 기존 데이터에 용도 정보 업데이트

-- PP-GF 계열
UPDATE raw_materials SET usage = '범퍼, 펜더, 도어 패널, 엔진 커버' WHERE ms_spec LIKE 'MS213-67%';
UPDATE raw_materials SET usage = '범퍼 보강재, 구조 부품' WHERE ms_spec = 'MS213-53';
UPDATE raw_materials SET usage = '범퍼, 내장재, 도어 트림' WHERE ms_spec = 'MS213-57';
UPDATE raw_materials SET usage = '범퍼, 사이드 스커트' WHERE ms_spec = 'MS213-70';
UPDATE raw_materials SET usage = '범퍼 페시아, 사이드 몰딩' WHERE ms_spec IN ('MS213-80', 'MS213-85');
UPDATE raw_materials SET usage = '프론트엔드 모듈, 도어 모듈' WHERE ms_spec IN ('MS213-90', 'MS213-95');
UPDATE raw_materials SET usage = '배터리 케이스, 팬 슈라우드' WHERE ms_spec IN ('MS213-10', 'MS213-15');
UPDATE raw_materials SET usage = '투명 부품, 램프 하우징' WHERE ms_spec = 'MS213-20';
UPDATE raw_materials SET usage = '내장재, 시트 백' WHERE ms_spec = 'MS213-24';

-- TPO 계열
UPDATE raw_materials SET usage = '범퍼, 로커 패널, 휠 아치' WHERE ms_spec = 'MS220-19';

-- ASA 계열
UPDATE raw_materials SET usage = '외장 트림, 미러 하우징, 그릴' WHERE ms_spec LIKE 'MS225-22%';

-- ABS 계열
UPDATE raw_materials SET usage = '내장재, 콘솔, 도어 트림' WHERE ms_spec = 'MS225-01';
UPDATE raw_materials SET usage = '내장재, 대시보드' WHERE ms_spec = 'MS225-05';
UPDATE raw_materials SET usage = '고온 내장재, 에어컨 부품' WHERE ms_spec = 'MS225-10';
UPDATE raw_materials SET usage = '계기판 렌즈, 투명 부품' WHERE ms_spec = 'MS225-30';

-- PE 계열
UPDATE raw_materials SET usage = '연료 탱크 라이너, 와셔 탱크' WHERE ms_spec = 'MS231-10';
UPDATE raw_materials SET usage = '와이어 하네스 커버' WHERE ms_spec = 'MS231-05';
UPDATE raw_materials SET usage = '연료탱크, 와셔 탱크' WHERE ms_spec IN ('MS231-15', 'MS231-20');

-- PC 계열
UPDATE raw_materials SET usage = '헤드램프 렌즈, 계기판 커버' WHERE ms_spec = 'MS947-05';
UPDATE raw_materials SET usage = '계기판, 에어백 커버, 필러' WHERE ms_spec IN ('MS947-10', 'MS947-15');

-- PA (Nylon) 계열
UPDATE raw_materials SET usage = '엔진룸 부품, 연료 시스템' WHERE ms_spec IN ('MS310-06', 'MS310-66');
UPDATE raw_materials SET usage = '엔진 커버, 인테이크 매니폴드' WHERE ms_spec IN ('MS310-30', 'MS310-33');

-- POM 계열
UPDATE raw_materials SET usage = '기어, 클립, 패스너, 도어 핸들' WHERE ms_spec IN ('MS420-01', 'MS420-02');

-- PBT 계열
UPDATE raw_materials SET usage = '커넥터, 스위치, 센서 하우징' WHERE ms_spec IN ('MS430-01', 'MS430-30');

-- PMMA 계열
UPDATE raw_materials SET usage = '램프 렌즈, 계기판 커버' WHERE ms_spec IN ('MS510-01', 'MS510-05');

-- PPS 계열
UPDATE raw_materials SET usage = '고온 엔진 부품, 워터펌프' WHERE ms_spec = 'MS610-40';

-- PCT 계열
UPDATE raw_materials SET usage = '고온 커넥터, 전장 부품' WHERE ms_spec = 'MS440-30';

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_raw_materials_usage ON raw_materials(usage);

COMMENT ON COLUMN raw_materials.usage IS '용도 - 자동차 부품 적용 위치';
