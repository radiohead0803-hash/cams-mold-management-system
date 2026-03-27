-- =============================================================
-- GPS 좌표 기록 확장 마이그레이션
-- 날짜: 2026-03-27
-- 목적: QR 스캔 및 모든 관련 작업에 GPS 좌표 기록 추가
-- =============================================================

-- ① QR 세션에 GPS 추가 (기존 gps_latitude/gps_longitude와 별도로 location_name, accuracy 추가)
ALTER TABLE qr_sessions ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7);
ALTER TABLE qr_sessions ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7);
ALTER TABLE qr_sessions ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE qr_sessions ADD COLUMN IF NOT EXISTS gps_accuracy DECIMAL(10,2);

-- ② 점검 기록에 GPS 추가
ALTER TABLE daily_checks ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7);
ALTER TABLE daily_checks ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7);
ALTER TABLE daily_checks ADD COLUMN IF NOT EXISTS gps_accuracy DECIMAL(10,2);

ALTER TABLE periodic_inspections ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7);
ALTER TABLE periodic_inspections ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7);
ALTER TABLE periodic_inspections ADD COLUMN IF NOT EXISTS gps_accuracy DECIMAL(10,2);

-- ③ 수리요청에 GPS 추가
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7);
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7);
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS gps_accuracy DECIMAL(10,2);

-- ④ 이관에 GPS 추가 (출발지/도착지)
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS from_latitude DECIMAL(10,7);
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS from_longitude DECIMAL(10,7);
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS to_latitude DECIMAL(10,7);
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS to_longitude DECIMAL(10,7);

-- ⑤ 폐기에 GPS 추가
ALTER TABLE scrapping_requests ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7);
ALTER TABLE scrapping_requests ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7);
ALTER TABLE scrapping_requests ADD COLUMN IF NOT EXISTS gps_accuracy DECIMAL(10,2);

-- ⑥ 금형 현재 위치 추가 (mold_specifications 테이블)
ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10,7);
ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(10,7);
ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP;
ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS last_scan_location TEXT;

-- ⑦ GPS 이력 테이블 (통합 로그)
CREATE TABLE IF NOT EXISTS gps_location_logs (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER,
  user_id INTEGER,
  event_type VARCHAR(30) NOT NULL,  -- qr_scan, daily_check, periodic_check, repair_request, transfer, scrapping
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  location_name TEXT,
  accuracy DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gps_logs_mold ON gps_location_logs(mold_id);
CREATE INDEX IF NOT EXISTS idx_gps_logs_event ON gps_location_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_gps_logs_created ON gps_location_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_gps_logs_mold_event ON gps_location_logs(mold_id, event_type);

-- ⑧ COMMENT
COMMENT ON TABLE gps_location_logs IS 'GPS 위치 통합 이력 로그 (QR스캔, 점검, 수리, 이관, 폐기 등)';
COMMENT ON COLUMN gps_location_logs.event_type IS '이벤트 유형: qr_scan, daily_check, periodic_check, repair_request, transfer, scrapping';
COMMENT ON COLUMN gps_location_logs.accuracy IS 'GPS 정확도 (미터)';
COMMENT ON COLUMN gps_location_logs.location_name IS '역지오코딩 주소 또는 장소명';
COMMENT ON COLUMN mold_specifications.current_latitude IS '금형 현재 위도 (마지막 스캔 위치)';
COMMENT ON COLUMN mold_specifications.current_longitude IS '금형 현재 경도 (마지막 스캔 위치)';
COMMENT ON COLUMN mold_specifications.last_location_update IS '마지막 위치 업데이트 시각';
COMMENT ON COLUMN mold_specifications.last_scan_location IS '마지막 스캔 위치 이름';
