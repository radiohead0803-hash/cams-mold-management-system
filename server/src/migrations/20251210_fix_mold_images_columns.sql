-- 금형 이미지 테이블 컬럼 수정/추가
-- 기존 테이블이 있는 경우 컬럼명 변경 및 누락된 컬럼 추가

-- 1. 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS mold_images (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER,
  mold_spec_id INTEGER,
  image_type VARCHAR(50) NOT NULL DEFAULT 'mold',
  image_url TEXT NOT NULL,
  original_filename VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  uploaded_by INTEGER,
  reference_type VARCHAR(50),
  reference_id INTEGER,
  checklist_id INTEGER,
  checklist_item_id INTEGER,
  repair_id INTEGER,
  transfer_id INTEGER,
  maker_spec_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 기존 테이블에 누락된 컬럼 추가
DO $$
BEGIN
  -- original_filename 컬럼 (file_name에서 변경)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_images' AND column_name = 'original_filename') THEN
    -- file_name이 있으면 이름 변경, 없으면 새로 추가
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'mold_images' AND column_name = 'file_name') THEN
      ALTER TABLE mold_images RENAME COLUMN file_name TO original_filename;
    ELSE
      ALTER TABLE mold_images ADD COLUMN original_filename VARCHAR(255);
    END IF;
  END IF;

  -- display_order 컬럼 (sort_order에서 변경)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_images' AND column_name = 'display_order') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'mold_images' AND column_name = 'sort_order') THEN
      ALTER TABLE mold_images RENAME COLUMN sort_order TO display_order;
    ELSE
      ALTER TABLE mold_images ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
  END IF;

  -- reference_type 컬럼
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_images' AND column_name = 'reference_type') THEN
    ALTER TABLE mold_images ADD COLUMN reference_type VARCHAR(50);
  END IF;

  -- reference_id 컬럼
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_images' AND column_name = 'reference_id') THEN
    ALTER TABLE mold_images ADD COLUMN reference_id INTEGER;
  END IF;

  -- checklist_id 컬럼
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_images' AND column_name = 'checklist_id') THEN
    ALTER TABLE mold_images ADD COLUMN checklist_id INTEGER;
  END IF;

  -- checklist_item_id 컬럼
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_images' AND column_name = 'checklist_item_id') THEN
    ALTER TABLE mold_images ADD COLUMN checklist_item_id INTEGER;
  END IF;

  -- repair_id 컬럼
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_images' AND column_name = 'repair_id') THEN
    ALTER TABLE mold_images ADD COLUMN repair_id INTEGER;
  END IF;

  -- transfer_id 컬럼
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_images' AND column_name = 'transfer_id') THEN
    ALTER TABLE mold_images ADD COLUMN transfer_id INTEGER;
  END IF;

  -- maker_spec_id 컬럼
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_images' AND column_name = 'maker_spec_id') THEN
    ALTER TABLE mold_images ADD COLUMN maker_spec_id INTEGER;
  END IF;

  -- file_size 컬럼
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_images' AND column_name = 'file_size') THEN
    ALTER TABLE mold_images ADD COLUMN file_size INTEGER;
  END IF;

  -- mime_type 컬럼
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_images' AND column_name = 'mime_type') THEN
    ALTER TABLE mold_images ADD COLUMN mime_type VARCHAR(100);
  END IF;

  -- description 컬럼
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_images' AND column_name = 'description') THEN
    ALTER TABLE mold_images ADD COLUMN description TEXT;
  END IF;

  -- is_primary 컬럼
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_images' AND column_name = 'is_primary') THEN
    ALTER TABLE mold_images ADD COLUMN is_primary BOOLEAN DEFAULT FALSE;
  END IF;

  -- uploaded_by 컬럼
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_images' AND column_name = 'uploaded_by') THEN
    ALTER TABLE mold_images ADD COLUMN uploaded_by INTEGER;
  END IF;
END $$;

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mold_images_mold_id ON mold_images(mold_id);
CREATE INDEX IF NOT EXISTS idx_mold_images_mold_spec_id ON mold_images(mold_spec_id);
CREATE INDEX IF NOT EXISTS idx_mold_images_image_type ON mold_images(image_type);
CREATE INDEX IF NOT EXISTS idx_mold_images_reference ON mold_images(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_mold_images_checklist ON mold_images(checklist_id);
CREATE INDEX IF NOT EXISTS idx_mold_images_repair ON mold_images(repair_id);

-- 4. mold_specifications 테이블에 이미지 URL 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_specifications' AND column_name = 'mold_image_url') THEN
    ALTER TABLE mold_specifications ADD COLUMN mold_image_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'mold_specifications' AND column_name = 'product_image_url') THEN
    ALTER TABLE mold_specifications ADD COLUMN product_image_url TEXT;
  END IF;
END $$;

-- 완료 메시지
SELECT 'mold_images 테이블 마이그레이션 완료' as result;
