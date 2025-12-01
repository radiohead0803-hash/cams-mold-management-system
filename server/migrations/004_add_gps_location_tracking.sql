-- 004_add_gps_location_tracking.sql
-- GPS 기반 위치 추적 및 이탈 판정 시스템

-- 1. mold_location_logs 테이블 생성 (위치 로그)
CREATE TABLE IF NOT EXISTS mold_location_logs (
  id              BIGSERIAL PRIMARY KEY,
  mold_id         BIGINT NOT NULL,
  plant_id        BIGINT,
  scanned_by_id   BIGINT,
  scanned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  gps_lat         DECIMAL(10,7) NOT NULL,
  gps_lng         DECIMAL(10,7) NOT NULL,
  distance_m      INTEGER,
  status          VARCHAR(20) DEFAULT 'normal',
  source          VARCHAR(20) DEFAULT 'qr_scan',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_mold_location_log_mold
    FOREIGN KEY (mold_id) REFERENCES molds(id) ON DELETE CASCADE,
  CONSTRAINT fk_mold_location_log_plant
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL,
  CONSTRAINT fk_mold_location_log_user
    FOREIGN KEY (scanned_by_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_location_status
    CHECK (status IN ('normal', 'moved', 'unknown'))
);

-- 인덱스 생성
CREATE INDEX idx_mold_location_logs_mold_id ON mold_location_logs(mold_id);
CREATE INDEX idx_mold_location_logs_scanned_at ON mold_location_logs(scanned_at DESC);
CREATE INDEX idx_mold_location_logs_status ON mold_location_logs(status);

-- 2. molds 테이블에 GPS 위치 컬럼 추가
ALTER TABLE molds
  ADD COLUMN IF NOT EXISTS last_gps_lat DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS last_gps_lng DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS last_gps_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS location_status VARCHAR(20) DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS base_gps_lat DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS base_gps_lng DECIMAL(10,7);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_molds_location_status ON molds(location_status);
CREATE INDEX IF NOT EXISTS idx_molds_last_gps_time ON molds(last_gps_time DESC);

-- 3. plants 테이블에 GPS 좌표 추가 (없으면)
ALTER TABLE plants
  ADD COLUMN IF NOT EXISTS gps_lat DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS gps_lng DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS address TEXT;

-- 코멘트 추가
COMMENT ON TABLE mold_location_logs IS 'GPS 기반 금형 위치 로그';
COMMENT ON COLUMN mold_location_logs.distance_m IS '기준점과의 거리(미터)';
COMMENT ON COLUMN mold_location_logs.status IS 'normal: 정상, moved: 위치이탈, unknown: 미확인';
COMMENT ON COLUMN mold_location_logs.source IS 'qr_scan: QR스캔, manual: 수동입력, auto: 자동';

COMMENT ON COLUMN molds.last_gps_lat IS '마지막 GPS 위도';
COMMENT ON COLUMN molds.last_gps_lng IS '마지막 GPS 경도';
COMMENT ON COLUMN molds.last_gps_time IS '마지막 GPS 업데이트 시간';
COMMENT ON COLUMN molds.location_status IS '현재 위치 상태 (normal/moved)';
COMMENT ON COLUMN molds.base_gps_lat IS '기준 GPS 위도 (등록된 위치)';
COMMENT ON COLUMN molds.base_gps_lng IS '기준 GPS 경도 (등록된 위치)';
