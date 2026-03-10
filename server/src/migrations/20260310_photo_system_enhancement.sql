-- =============================================================
-- 사진 업로드 시스템 통합 마이그레이션
-- 날짜: 2026-03-10
-- 목적: inspection_photos 스키마 보강 + 관련 테이블 정비
-- =============================================================

-- ① inspection_photos 누락 컬럼 추가 (IF NOT EXISTS로 안전)
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS inspection_type VARCHAR(50);
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS inspection_id INTEGER;
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS item_status_id INTEGER;
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS image_data BYTEA;
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS checklist_type VARCHAR(100);
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS item_id INTEGER;
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS file_name VARCHAR(500);
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS original_name VARCHAR(500);
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- ② 소스(출처) 컬럼 추가: 어느 모바일 페이지에서 업로드했는지 추적
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS source_page VARCHAR(100);
-- capture 방식 기록 (camera / gallery / file)
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS capture_method VARCHAR(20);
-- GPS 좌표 (모바일 촬영 위치)
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS gps_latitude DOUBLE PRECISION;
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS gps_longitude DOUBLE PRECISION;
-- 수리요청 ID (repair 타입일 때)
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS repair_request_id INTEGER;
-- 연관 엔티티 범용 참조
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS entity_id INTEGER;

-- ③ 인덱스 보강
CREATE INDEX IF NOT EXISTS idx_inspection_photos_inspection_type ON inspection_photos(inspection_type);
CREATE INDEX IF NOT EXISTS idx_inspection_photos_item_id ON inspection_photos(item_id);
CREATE INDEX IF NOT EXISTS idx_inspection_photos_is_active ON inspection_photos(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_inspection_photos_source_page ON inspection_photos(source_page);
CREATE INDEX IF NOT EXISTS idx_inspection_photos_entity ON inspection_photos(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_inspection_photos_repair_request ON inspection_photos(repair_request_id);
CREATE INDEX IF NOT EXISTS idx_inspection_photos_uploaded_by ON inspection_photos(uploaded_by);

-- ④ repair_attachments 테이블 보강 (이미 존재하면 컬럼 추가만)
ALTER TABLE repair_attachments ADD COLUMN IF NOT EXISTS checklist_item_id INTEGER;
ALTER TABLE repair_attachments ADD COLUMN IF NOT EXISTS photo_type VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_repair_attachments_request ON repair_attachments(repair_request_id);

-- ⑤ tryout_issue_attachments 보강
ALTER TABLE tryout_issue_attachments ADD COLUMN IF NOT EXISTS photo_type VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_tryout_attachments_type ON tryout_issue_attachments(attachment_type);

-- ⑥ checklist_attachments 보강
ALTER TABLE checklist_attachments ADD COLUMN IF NOT EXISTS inspection_type VARCHAR(50);
ALTER TABLE checklist_attachments ADD COLUMN IF NOT EXISTS mold_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_checklist_attachments_mold ON checklist_attachments(mold_id);
CREATE INDEX IF NOT EXISTS idx_checklist_attachments_inspection ON checklist_attachments(inspection_type);

-- ⑦ COMMENT 정리
COMMENT ON TABLE inspection_photos IS '모바일 점검 사진 통합 테이블 - 일상점검/정기점검/수리/이관/출하 등';
COMMENT ON COLUMN inspection_photos.inspection_type IS '점검 유형 (daily/periodic/repair/transfer/repair_shipment/nurturing/tryout)';
COMMENT ON COLUMN inspection_photos.source_page IS '업로드 출처 페이지 (MobileDailyChecklist 등)';
COMMENT ON COLUMN inspection_photos.capture_method IS '촬영 방식 (camera/gallery/file)';
COMMENT ON COLUMN inspection_photos.gps_latitude IS 'GPS 위도';
COMMENT ON COLUMN inspection_photos.gps_longitude IS 'GPS 경도';
COMMENT ON COLUMN inspection_photos.entity_type IS '범용 연관 엔티티 타입 (repair_request/checklist/tryout 등)';
COMMENT ON COLUMN inspection_photos.entity_id IS '범용 연관 엔티티 ID';
COMMENT ON COLUMN inspection_photos.image_data IS 'Cloudinary 미사용 시 BYTEA 이미지 데이터';
