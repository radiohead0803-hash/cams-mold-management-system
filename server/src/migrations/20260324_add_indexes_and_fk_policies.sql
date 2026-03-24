-- ============================================================
-- 마이그레이션: 인덱스 추가 및 FK ON DELETE 정책 보완
-- 날짜: 2026-03-24
-- 목적: 쿼리 성능 개선 및 참조 무결성 강화
-- ============================================================

-- ========================
-- 1. 누락된 인덱스 추가
-- ========================

-- scrapping_requests 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_scrapping_requests_status ON scrapping_requests(status);
CREATE INDEX IF NOT EXISTS idx_scrapping_requests_mold_id ON scrapping_requests(mold_id);
CREATE INDEX IF NOT EXISTS idx_scrapping_requests_requested_at ON scrapping_requests(requested_at DESC);

-- production_transfer_requests 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_production_transfer_requests_status ON production_transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_production_transfer_requests_mold_id ON production_transfer_requests(mold_id);

-- daily_checks 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_checks_mold_date ON daily_checks(mold_id, check_date DESC);

-- repair_requests 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_repair_requests_mold_status ON repair_requests(mold_id, status);
CREATE INDEX IF NOT EXISTS idx_repair_requests_request_date ON repair_requests(request_date DESC);

-- transfers 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_transfers_mold_status ON transfers(mold_id, status);

-- inspections 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_inspections_mold_type_date ON inspections(mold_id, inspection_type, inspection_date DESC);

-- checklist_instances 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_checklist_instances_mold_category ON checklist_instances(mold_id, category, status);

-- alerts 인덱스 (읽지 않은 알림 조회용)
CREATE INDEX IF NOT EXISTS idx_alerts_user_read ON alerts(user_id, is_read, created_at DESC);

-- mold_specifications.mold_id 인덱스
CREATE INDEX IF NOT EXISTS idx_mold_specifications_mold_id ON mold_specifications(mold_id);

-- ========================
-- 2. FK ON DELETE 정책은 sequelize.sync로 처리
-- (DO $$ 블록이 세미콜론 분리에서 깨지므로 제거)
-- ========================
