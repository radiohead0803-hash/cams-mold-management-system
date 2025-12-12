-- 금형재질 테이블 확장 - 금형제작 시 필요한 상세 정보 추가
-- 생성일: 2025-12-12

-- 1. 금형재질 상세 정보 컬럼 추가
ALTER TABLE materials ADD COLUMN IF NOT EXISTS usage_type VARCHAR(100);         -- 용도 (코어/캐비티/슬라이드/이젝터핀 등)
ALTER TABLE materials ADD COLUMN IF NOT EXISTS heat_treatment VARCHAR(100);     -- 열처리 (담금질/뜨임/질화/침탄 등)
ALTER TABLE materials ADD COLUMN IF NOT EXISTS machinability VARCHAR(50);       -- 가공성 (우수/양호/보통/어려움)
ALTER TABLE materials ADD COLUMN IF NOT EXISTS weldability VARCHAR(50);         -- 용접성 (우수/양호/보통/어려움)
ALTER TABLE materials ADD COLUMN IF NOT EXISTS polishability VARCHAR(50);       -- 경면가공성 (우수/양호/보통/어려움)
ALTER TABLE materials ADD COLUMN IF NOT EXISTS corrosion_resistance VARCHAR(50); -- 내식성 (우수/양호/보통/낮음)
ALTER TABLE materials ADD COLUMN IF NOT EXISTS wear_resistance VARCHAR(50);     -- 내마모성 (우수/양호/보통/낮음)

-- 2. 기존 데이터 업데이트
UPDATE materials SET 
  usage_type = '코어, 캐비티, 슬라이드',
  heat_treatment = '불필요 (프리하든)',
  machinability = '우수',
  weldability = '양호',
  polishability = '우수',
  corrosion_resistance = '양호',
  wear_resistance = '양호'
WHERE material_name = 'NAK80';

UPDATE materials SET 
  usage_type = '코어, 캐비티, 몰드베이스',
  heat_treatment = '불필요 (프리하든)',
  machinability = '우수',
  weldability = '양호',
  polishability = '양호',
  corrosion_resistance = '보통',
  wear_resistance = '보통'
WHERE material_name = 'P20';

UPDATE materials SET 
  usage_type = '몰드베이스, 서포트플레이트',
  heat_treatment = '담금질+뜨임',
  machinability = '우수',
  weldability = '우수',
  polishability = '보통',
  corrosion_resistance = '낮음',
  wear_resistance = '보통'
WHERE material_name = 'S50C';

UPDATE materials SET 
  usage_type = '코어, 캐비티 (고경면)',
  heat_treatment = '불필요 (프리하든)',
  machinability = '우수',
  weldability = '양호',
  polishability = '우수',
  corrosion_resistance = '양호',
  wear_resistance = '양호'
WHERE material_name = 'HPM38';

UPDATE materials SET 
  usage_type = '다이캐스팅 금형, 핫런너',
  heat_treatment = '담금질+뜨임+질화',
  machinability = '보통',
  weldability = '어려움',
  polishability = '양호',
  corrosion_resistance = '우수',
  wear_resistance = '우수'
WHERE material_name = 'SKD61';

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_materials_usage_type ON materials(usage_type);

COMMENT ON COLUMN materials.usage_type IS '용도 (코어/캐비티/슬라이드 등)';
COMMENT ON COLUMN materials.heat_treatment IS '열처리 방법';
COMMENT ON COLUMN materials.machinability IS '가공성';
COMMENT ON COLUMN materials.weldability IS '용접성';
COMMENT ON COLUMN materials.polishability IS '경면가공성';
COMMENT ON COLUMN materials.corrosion_resistance IS '내식성';
COMMENT ON COLUMN materials.wear_resistance IS '내마모성';
