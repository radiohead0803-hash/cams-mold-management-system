-- molds 테이블에 car_model_id 컬럼 추가
ALTER TABLE molds
ADD COLUMN IF NOT EXISTS car_model_id INTEGER;

-- 외래키 제약조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_molds_car_model'
  ) THEN
    ALTER TABLE molds
    ADD CONSTRAINT fk_molds_car_model
    FOREIGN KEY (car_model_id)
    REFERENCES car_models(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_molds_car_model_id ON molds(car_model_id);

COMMENT ON COLUMN molds.car_model_id IS '차종 ID (car_models 테이블 참조)';
