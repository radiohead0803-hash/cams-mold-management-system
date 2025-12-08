-- 금형 이미지 테이블 생성
-- 부품사진, 금형사진 등을 저장

-- 1. mold_images 테이블 생성
CREATE TABLE IF NOT EXISTS mold_images (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER REFERENCES molds(id) ON DELETE CASCADE,
  mold_spec_id INTEGER REFERENCES mold_specifications(id) ON DELETE CASCADE,
  image_type VARCHAR(50) NOT NULL, -- 'part' (부품사진), 'mold' (금형사진), 'drawing' (도면), 'defect' (불량사진)
  image_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE, -- 대표 이미지 여부
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mold_images_mold_id ON mold_images(mold_id);
CREATE INDEX IF NOT EXISTS idx_mold_images_mold_spec_id ON mold_images(mold_spec_id);
CREATE INDEX IF NOT EXISTS idx_mold_images_image_type ON mold_images(image_type);

-- 2. mold_specifications 테이블에 이미지 관련 컬럼 추가 (이미 part_images가 있으면 스킵)
DO $$
BEGIN
  -- mold_images 컬럼 추가 (금형 사진 URL 배열)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_specifications' AND column_name = 'mold_images') THEN
    ALTER TABLE mold_specifications ADD COLUMN mold_images JSONB DEFAULT '[]';
  END IF;
  
  -- representative_part_number 컬럼 추가 (대표품번)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_specifications' AND column_name = 'representative_part_number') THEN
    ALTER TABLE mold_specifications ADD COLUMN representative_part_number VARCHAR(100);
  END IF;
  
  -- mold_spec_type 컬럼 추가 (개발사양: 시작금형/양산금형)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_specifications' AND column_name = 'mold_spec_type') THEN
    ALTER TABLE mold_specifications ADD COLUMN mold_spec_type VARCHAR(50) DEFAULT '시작금형';
  END IF;
END $$;

-- 3. molds 테이블에 이미지 관련 컬럼 추가
DO $$
BEGIN
  -- part_image_url 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'molds' AND column_name = 'part_image_url') THEN
    ALTER TABLE molds ADD COLUMN part_image_url TEXT;
  END IF;
  
  -- mold_image_url 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'molds' AND column_name = 'mold_image_url') THEN
    ALTER TABLE molds ADD COLUMN mold_image_url TEXT;
  END IF;
END $$;

-- 코멘트 추가
COMMENT ON TABLE mold_images IS '금형 이미지 저장 테이블';
COMMENT ON COLUMN mold_images.image_type IS '이미지 유형: part(부품), mold(금형), drawing(도면), defect(불량)';
COMMENT ON COLUMN mold_images.is_primary IS '대표 이미지 여부';
