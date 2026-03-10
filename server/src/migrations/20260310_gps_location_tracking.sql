-- =============================================================
-- GPS 위치 추적 시스템 마이그레이션
-- 날짜: 2026-03-10
-- 목적: 사진 촬영 시 GPS 자동 수집 + 금형 위치 실시간 매칭
-- =============================================================

-- ① mold_location_logs 보강 (사진 촬영 출처 추적)
ALTER TABLE mold_location_logs ADD COLUMN IF NOT EXISTS photo_id UUID;
ALTER TABLE mold_location_logs ADD COLUMN IF NOT EXISTS accuracy DOUBLE PRECISION;
ALTER TABLE mold_location_logs ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE mold_location_logs ADD COLUMN IF NOT EXISTS source_page VARCHAR(100);
ALTER TABLE mold_location_logs ADD COLUMN IF NOT EXISTS inspection_type VARCHAR(50);

-- ② molds 테이블 GPS 정확도 컬럼
ALTER TABLE molds ADD COLUMN IF NOT EXISTS last_gps_accuracy DOUBLE PRECISION;
ALTER TABLE molds ADD COLUMN IF NOT EXISTS last_gps_address TEXT;
ALTER TABLE molds ADD COLUMN IF NOT EXISTS last_gps_source VARCHAR(50);
ALTER TABLE molds ADD COLUMN IF NOT EXISTS drift_threshold_m INTEGER DEFAULT 500;

-- ③ gps_locations 보강
ALTER TABLE gps_locations ADD COLUMN IF NOT EXISTS photo_id UUID;
ALTER TABLE gps_locations ADD COLUMN IF NOT EXISTS source_page VARCHAR(100);
ALTER TABLE gps_locations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE gps_locations ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- ④ inspection_photos GPS 정확도
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS gps_accuracy DOUBLE PRECISION;
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS gps_address TEXT;
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS gps_required BOOLEAN DEFAULT TRUE;

-- ⑤ 인덱스
CREATE INDEX IF NOT EXISTS idx_mold_location_logs_photo ON mold_location_logs(photo_id);
CREATE INDEX IF NOT EXISTS idx_mold_location_logs_source ON mold_location_logs(source);
CREATE INDEX IF NOT EXISTS idx_gps_locations_photo ON gps_locations(photo_id);
CREATE INDEX IF NOT EXISTS idx_gps_locations_user ON gps_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_molds_location_status ON molds(location_status);
CREATE INDEX IF NOT EXISTS idx_molds_last_gps ON molds(last_gps_time DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_inspection_photos_gps ON inspection_photos(gps_latitude, gps_longitude) WHERE gps_latitude IS NOT NULL;

-- ⑥ COMMENT
COMMENT ON COLUMN mold_location_logs.photo_id IS '위치 기록의 근거가 된 사진 ID';
COMMENT ON COLUMN mold_location_logs.accuracy IS 'GPS 정확도 (미터)';
COMMENT ON COLUMN mold_location_logs.address IS '역지오코딩 주소';
COMMENT ON COLUMN mold_location_logs.source_page IS '위치 기록 출처 페이지';
COMMENT ON COLUMN molds.drift_threshold_m IS '위치 이탈 판단 기준 거리 (미터, 기본 500m)';
COMMENT ON COLUMN molds.last_gps_accuracy IS '마지막 GPS 정확도 (미터)';
COMMENT ON COLUMN molds.last_gps_source IS '마지막 GPS 출처 (photo/qr_scan/manual)';
COMMENT ON COLUMN inspection_photos.gps_accuracy IS 'GPS 정확도 (미터)';
COMMENT ON COLUMN inspection_photos.gps_required IS 'GPS 필수 여부';
