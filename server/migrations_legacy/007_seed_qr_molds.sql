-- QR 로그인 테스트용 금형 데이터
-- QR-MOLD-XXX 형식의 코드로 테스트할 수 있도록 추가

-- 1. QR 테스트용 금형 데이터
INSERT INTO molds (mold_code, mold_name, car_model, part_name, cavity, status, current_shots, target_shots, location, created_at, updated_at)
VALUES 
  ('QR-MOLD-001', '범퍼 금형 A', 'K5', '프론트 범퍼', 2, 'active', 15000, 100000, '생산1공장 A라인', now(), now()),
  ('QR-MOLD-002', '도어트림 금형 B', 'K8', '도어 트림 LH', 4, 'active', 25000, 80000, '생산1공장 B라인', now(), now()),
  ('QR-MOLD-003', '대시보드 금형 C', 'EV6', '대시보드 센터', 1, 'maintenance', 8000, 50000, '수리센터', now(), now())
ON CONFLICT (mold_code) DO UPDATE SET
  mold_name = EXCLUDED.mold_name,
  car_model = EXCLUDED.car_model,
  part_name = EXCLUDED.part_name,
  cavity = EXCLUDED.cavity,
  status = EXCLUDED.status,
  current_shots = EXCLUDED.current_shots,
  target_shots = EXCLUDED.target_shots,
  location = EXCLUDED.location,
  updated_at = now();

-- 2. qr_sessions 테이블 확인 및 생성 (없으면)
CREATE TABLE IF NOT EXISTS qr_sessions (
  id SERIAL PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  mold_id INTEGER NOT NULL REFERENCES molds(id),
  qr_code VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  device_info JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_sessions_token ON qr_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_user ON qr_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_mold ON qr_sessions(mold_id);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_qr_code ON qr_sessions(qr_code);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_expires ON qr_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_active ON qr_sessions(is_active);

-- 확인 쿼리
SELECT mold_code, mold_name, car_model, status, current_shots, target_shots 
FROM molds 
WHERE mold_code LIKE 'QR-MOLD-%'
ORDER BY mold_code;
