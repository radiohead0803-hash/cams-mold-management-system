-- 차종 테이블에 년식, 사양 컬럼 추가
ALTER TABLE car_models ADD COLUMN IF NOT EXISTS model_year VARCHAR(20);
ALTER TABLE car_models ADD COLUMN IF NOT EXISTS specification VARCHAR(100);

COMMENT ON COLUMN car_models.model_year IS '년식 (예: 2024, 2023~2024)';
COMMENT ON COLUMN car_models.specification IS '사양 (예: 기본, 프리미엄, 스포츠)';
