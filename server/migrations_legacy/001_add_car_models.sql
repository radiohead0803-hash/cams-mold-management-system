-- 차종 마스터 테이블 생성
CREATE TABLE IF NOT EXISTS car_models (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(50)  NOT NULL UNIQUE,   -- 예: 'SP2', 'EV6'
  name            VARCHAR(100) NOT NULL,          -- 예: 'SP2(쏘울)', 'EV6'
  oem             VARCHAR(50),                   -- 예: 'HYUNDAI', 'KIA'
  segment         VARCHAR(50),                   -- 예: 'C-SUV', 'B-HATCH'
  description     TEXT,

  sort_order      INTEGER      DEFAULT 0,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,

  created_by      INTEGER,                       -- users.id FK (선택)
  updated_by      INTEGER,

  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_car_models_code ON car_models(code);
CREATE INDEX IF NOT EXISTS idx_car_models_is_active ON car_models(is_active);
CREATE INDEX IF NOT EXISTS idx_car_models_oem ON car_models(oem);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_car_models_updated_at ON car_models;
CREATE TRIGGER trg_car_models_updated_at
BEFORE UPDATE ON car_models
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 초기 데이터 삽입
INSERT INTO car_models (code, name, oem, segment, sort_order) VALUES
  ('SP2', 'SP2(쏘울)', 'KIA', 'B-SUV', 1),
  ('EV6', 'EV6', 'KIA', 'C-SUV', 2),
  ('IONIQ5', 'IONIQ 5', 'HYUNDAI', 'C-SUV', 3),
  ('IONIQ6', 'IONIQ 6', 'HYUNDAI', 'D-SEDAN', 4),
  ('GV70', 'GV70', 'GENESIS', 'C-SUV', 5),
  ('G80', 'G80', 'GENESIS', 'E-SEDAN', 6),
  ('TUCSON', '투싼', 'HYUNDAI', 'C-SUV', 7),
  ('SANTAFE', '싼타페', 'HYUNDAI', 'D-SUV', 8),
  ('SPORTAGE', '스포티지', 'KIA', 'C-SUV', 9),
  ('SORENTO', '쏘렌토', 'KIA', 'D-SUV', 10)
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE car_models IS '차종 마스터 테이블';
COMMENT ON COLUMN car_models.code IS '차종 코드 (고유)';
COMMENT ON COLUMN car_models.name IS '차종 명칭';
COMMENT ON COLUMN car_models.oem IS '제조사 (HYUNDAI, KIA, GENESIS 등)';
COMMENT ON COLUMN car_models.segment IS '차급 (B-SUV, C-SUV, D-SEDAN 등)';
COMMENT ON COLUMN car_models.sort_order IS '정렬 순서';
COMMENT ON COLUMN car_models.is_active IS '활성화 여부';
