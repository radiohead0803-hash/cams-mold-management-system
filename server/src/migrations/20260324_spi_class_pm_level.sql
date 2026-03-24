-- SPI 금형 등급 및 PM 레벨 컬럼 추가
ALTER TABLE molds ADD COLUMN IF NOT EXISTS spi_class VARCHAR(10);
ALTER TABLE molds ADD COLUMN IF NOT EXISTS pm_level INTEGER DEFAULT 1;

COMMENT ON COLUMN molds.spi_class IS 'SPI 등급: 101(100만+), 102(50~100만), 103(30~50만), 104(10~30만), 105(시작품)';
COMMENT ON COLUMN molds.pm_level IS 'PM 레벨: 1(일상), 2(정기), 3(주요), 4(대수리)';

-- maintenance_records에 pm_level 컬럼 추가
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS pm_level INTEGER DEFAULT 1;

COMMENT ON COLUMN maintenance_records.pm_level IS '1=일상(매 생산후), 2=정기(N만shot), 3=주요(N십만shot), 4=대수리(수명말기)';
