-- Mold 테이블에 GPS 컬럼 추가
ALTER TABLE molds 
ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS last_gps_update TIMESTAMP;

-- GPS Locations 테이블에 유니크 제약조건 추가
ALTER TABLE gps_locations 
DROP CONSTRAINT IF EXISTS gps_locations_mold_id_key;

-- 최신 GPS 위치만 유지하도록 유니크 제약조건 추가
CREATE UNIQUE INDEX IF NOT EXISTS idx_gps_locations_mold_latest 
ON gps_locations (mold_id, recorded_at DESC);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_molds_gps ON molds (current_latitude, current_longitude);
CREATE INDEX IF NOT EXISTS idx_gps_locations_coords ON gps_locations (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_gps_locations_mold ON gps_locations (mold_id);
