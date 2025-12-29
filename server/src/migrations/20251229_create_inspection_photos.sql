-- inspection_photos 테이블 생성
-- 점검 사진 저장용 테이블

CREATE TABLE IF NOT EXISTS inspection_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mold_id INTEGER REFERENCES molds(id) ON DELETE SET NULL,
    checklist_id INTEGER,
    item_status_id INTEGER,
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    file_type VARCHAR(50),
    file_size INTEGER,
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    shot_count INTEGER,
    metadata JSONB,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_inspection_photos_mold_id ON inspection_photos(mold_id);
CREATE INDEX IF NOT EXISTS idx_inspection_photos_checklist_id ON inspection_photos(checklist_id);
CREATE INDEX IF NOT EXISTS idx_inspection_photos_item_status_id ON inspection_photos(item_status_id);
CREATE INDEX IF NOT EXISTS idx_inspection_photos_uploaded_at ON inspection_photos(uploaded_at);

COMMENT ON TABLE inspection_photos IS '점검 사진 저장 테이블';
COMMENT ON COLUMN inspection_photos.mold_id IS '금형 ID';
COMMENT ON COLUMN inspection_photos.checklist_id IS '체크리스트 ID';
COMMENT ON COLUMN inspection_photos.item_status_id IS '점검 항목 상태 ID';
COMMENT ON COLUMN inspection_photos.file_url IS '파일 URL';
COMMENT ON COLUMN inspection_photos.thumbnail_url IS '썸네일 URL';
COMMENT ON COLUMN inspection_photos.file_type IS '파일 타입 (image/jpeg, image/png 등)';
COMMENT ON COLUMN inspection_photos.file_size IS '파일 크기 (bytes)';
COMMENT ON COLUMN inspection_photos.uploaded_by IS '업로드한 사용자 ID';
COMMENT ON COLUMN inspection_photos.shot_count IS '업로드 시점 숏수';
COMMENT ON COLUMN inspection_photos.metadata IS '추가 메타데이터 (JSON)';
COMMENT ON COLUMN inspection_photos.uploaded_at IS '업로드 일시';
