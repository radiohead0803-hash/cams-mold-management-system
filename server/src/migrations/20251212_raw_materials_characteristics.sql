-- 원재료 기초정보 테이블에 장점, 단점, 특징 컬럼 추가
-- 생성일: 2025-12-12

-- 1. 컬럼 추가
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS advantages TEXT;
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS disadvantages TEXT;
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS characteristics TEXT;

-- 2. 기존 데이터에 장점/단점/특징 정보 업데이트

-- PP-GF (Glass Fiber Reinforced PP) 계열
UPDATE raw_materials SET 
  advantages = '강성↑, 치수안정성↑, 내열성↑, 가격경쟁력',
  disadvantages = '충격강도↓, 표면품질↓, 유리섬유 노출 가능',
  characteristics = '유리섬유 20~30% 보강, 수축률 4~6/1000'
WHERE ms_spec LIKE 'MS213-67%' OR ms_spec = 'MS213-53';

-- PP-TD (Talc Filled PP) 계열
UPDATE raw_materials SET 
  advantages = '강성↑, 치수안정성↑, 저비용, 표면품질 양호',
  disadvantages = '충격강도↓, 비중↑',
  characteristics = '탈크 15~20% 충전, 수축률 7~8/1000'
WHERE ms_spec = 'MS213-57' OR ms_spec = 'MS213-70';

-- PP-EPDM 계열
UPDATE raw_materials SET 
  advantages = '저온(-30℃) 충격강도↑, 유연성↑, 도장성 양호',
  disadvantages = '강성↓, 내열성↓',
  characteristics = 'EPDM 고무 블렌드, 범퍼 전용'
WHERE ms_spec IN ('MS213-80', 'MS213-85');

-- PP-LGF (Long Glass Fiber PP) 계열
UPDATE raw_materials SET 
  advantages = '고강성, 고강도, 내충격성↑, 경량화',
  disadvantages = '고가, 사출 조건 까다로움',
  characteristics = '장섬유 유리 30~40%, 금속 대체용'
WHERE ms_spec IN ('MS213-90', 'MS213-95');

-- PP Homo 계열
UPDATE raw_materials SET 
  advantages = '저비용, 가공성↑, 내화학성↑',
  disadvantages = '저온 충격↓, 투명성↓',
  characteristics = '범용 PP, 수축률 15/1000'
WHERE ms_spec IN ('MS213-10', 'MS213-15');

-- PP Random 계열
UPDATE raw_materials SET 
  advantages = '투명성↑, 저온 충격↑, 광택↑',
  disadvantages = '강성↓, 내열성↓',
  characteristics = '랜덤 공중합체, 투명 부품용'
WHERE ms_spec = 'MS213-20';

-- TPO 계열
UPDATE raw_materials SET 
  advantages = '저온(-40℃) 충격↑, 유연성↑, 도장성↑, 재활용 용이',
  disadvantages = '강성↓, 고온 변형↑',
  characteristics = 'PP+EPDM+PE 블렌드, 범퍼/외장 전용, 수축률 12/1000'
WHERE ms_spec = 'MS220-19';

-- ASA 계열
UPDATE raw_materials SET 
  advantages = 'UV 내후성↑↑, 색상 안정성↑, 광택 유지',
  disadvantages = '고가, 충격강도 보통',
  characteristics = 'ABS 대비 내후성 5배↑, 외장 트림 전용'
WHERE ms_spec LIKE 'MS225-22%';

-- ABS 계열
UPDATE raw_materials SET 
  advantages = '충격강도↑, 표면품질↑, 도금/도장성↑',
  disadvantages = 'UV 내후성↓, 내화학성↓',
  characteristics = '범용 엔지니어링 수지, 수축률 5/1000'
WHERE ms_spec = 'MS225-01';

UPDATE raw_materials SET 
  advantages = '고충격, 저온 충격↑, 가공성↑',
  disadvantages = 'UV 내후성↓',
  characteristics = '고충격 ABS, 대시보드용'
WHERE ms_spec = 'MS225-05';

UPDATE raw_materials SET 
  advantages = '내열성↑(100℃), 치수안정성↑',
  disadvantages = '충격강도↓, 고가',
  characteristics = '내열 ABS, 에어컨 부품용'
WHERE ms_spec = 'MS225-10';

-- SAN 계열
UPDATE raw_materials SET 
  advantages = '투명성↑↑, 강성↑, 내화학성↑',
  disadvantages = '충격강도↓↓, 취성↑',
  characteristics = '광학용 투명수지, 계기판 렌즈'
WHERE ms_spec = 'MS225-30';

-- PE-HD 계열
UPDATE raw_materials SET 
  advantages = '내화학성↑↑, 저비용, 가공성↑',
  disadvantages = '강성↓, 접착/도장↓',
  characteristics = '고밀도 PE, 연료탱크/와셔탱크용'
WHERE ms_spec LIKE 'MS231-%';

-- PC 계열
UPDATE raw_materials SET 
  advantages = '투명성↑↑, 내충격↑↑, 내열성↑(130℃)',
  disadvantages = '내화학성↓, 스크래치↓, 고가',
  characteristics = '광학용 투명수지, 헤드램프 렌즈'
WHERE ms_spec = 'MS947-05';

-- PC/ABS 계열
UPDATE raw_materials SET 
  advantages = '충격강도↑, 내열성↑, 치수안정성↑, 도금성↑',
  disadvantages = '내화학성↓, UV 내후성↓',
  characteristics = 'PC+ABS 블렌드, 계기판/에어백 커버'
WHERE ms_spec IN ('MS947-10', 'MS947-15');

-- PA6 계열
UPDATE raw_materials SET 
  advantages = '내마모성↑↑, 내화학성↑, 자기윤활성',
  disadvantages = '흡습성↑↑, 치수변화↑',
  characteristics = '나일론6, 엔진룸 부품용'
WHERE ms_spec = 'MS310-06';

-- PA66 계열
UPDATE raw_materials SET 
  advantages = '내열성↑(PA6 대비), 강성↑, 내마모성↑↑',
  disadvantages = '흡습성↑, 고가',
  characteristics = '나일론66, 고온 엔진부품용'
WHERE ms_spec = 'MS310-66';

-- PA-GF 계열
UPDATE raw_materials SET 
  advantages = '고강성, 고강도, 내열성↑↑, 치수안정성↑',
  disadvantages = '흡습성↑, 표면품질↓',
  characteristics = '유리섬유 30~33% 보강, 엔진커버/매니폴드'
WHERE ms_spec IN ('MS310-30', 'MS310-33');

-- POM 계열
UPDATE raw_materials SET 
  advantages = '내마모성↑↑↑, 자기윤활성↑↑, 치수안정성↑, 내피로성↑',
  disadvantages = '내산성↓, 접착/도장↓',
  characteristics = '아세탈 수지, 기어/클립/패스너용'
WHERE ms_spec IN ('MS420-01', 'MS420-02');

-- PBT 계열
UPDATE raw_materials SET 
  advantages = '내열성↑, 전기절연성↑↑, 치수안정성↑, 내화학성↑',
  disadvantages = '흡습 시 물성↓, 노치 충격↓',
  characteristics = '커넥터/스위치/센서 하우징용'
WHERE ms_spec IN ('MS430-01', 'MS430-30');

-- PMMA 계열
UPDATE raw_materials SET 
  advantages = '투명성↑↑↑(광투과율 92%), 내후성↑, 표면경도↑',
  disadvantages = '충격강도↓↓, 내화학성↓',
  characteristics = '아크릴 수지, 램프렌즈/계기판 커버'
WHERE ms_spec IN ('MS510-01', 'MS510-05');

-- PPS 계열
UPDATE raw_materials SET 
  advantages = '내열성↑↑↑(200℃), 내화학성↑↑↑, 치수안정성↑↑',
  disadvantages = '고가↑↑, 충격강도↓',
  characteristics = '슈퍼엔프라, 고온 엔진부품/워터펌프'
WHERE ms_spec = 'MS610-40';

-- PCT 계열
UPDATE raw_materials SET 
  advantages = '내열성↑↑(150℃), 전기절연성↑↑, 내화학성↑',
  disadvantages = '고가, 가공성↓',
  characteristics = '고온 커넥터, 전장부품용'
WHERE ms_spec = 'MS440-30';

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_raw_materials_characteristics ON raw_materials(characteristics);

COMMENT ON COLUMN raw_materials.advantages IS '장점 - 소재의 강점';
COMMENT ON COLUMN raw_materials.disadvantages IS '단점 - 소재의 약점';
COMMENT ON COLUMN raw_materials.characteristics IS '특징 - 주요 물성 및 특성';
