-- 20K/50K 점검에 세척 관련 항목 추가
-- 80K와 동일한 세척 항목을 20K/50K에도 적용
-- 2025-12-18

-- =====================================================
-- 1. 20K 점검에 세척 항목 추가
-- =====================================================

-- 20K용 세척 항목 추가 (sort_order 25-29 사이에 삽입)
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('세척점검', '금형 외곽 세척(20K)', '금형 외곽 세척 상태 확인', '육안 검사', true, 25),
('세척점검', '코어/캐비티 이물(20K)', '코어/캐비티 내 이물 제거 상태', '육안 검사', true, 26),
('세척점검', '벤트·게이트 세척(20K)', '벤트·게이트 세척 상태', '육안 검사', false, 27),
('세척점검', '세척제 사용(20K)', '사용 세척제 및 희석 비율 기록', '기록 확인', false, 28),
('세척점검', '세척 완료 확인(20K)', '세척 완료 시간/담당자 기록', '기록 확인', false, 29)
ON CONFLICT DO NOTHING;

-- 20K 항목-주기 매핑 추가
INSERT INTO checklist_item_cycle_maps (checklist_version_id, item_id, cycle_code_id, is_enabled)
SELECT 
  (SELECT id FROM checklist_master_versions WHERE name = '금형점검 체크리스트 v1.0' LIMIT 1),
  id,
  (SELECT id FROM checklist_cycle_codes WHERE label = '20000' LIMIT 1),
  true
FROM checklist_items_master
WHERE item_name LIKE '%세척%(20K)%'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. 50K 점검에 세척 항목 추가
-- =====================================================

-- 50K용 세척 항목 추가 (sort_order 44-48 사이에 삽입)
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('세척점검', '금형 외곽 세척(50K)', '금형 외곽 세척 상태 확인', '육안 검사', true, 44),
('세척점검', '코어/캐비티 이물(50K)', '코어/캐비티 내 이물 제거 상태', '육안 검사', true, 45),
('세척점검', '런너/가이드 클리닝(50K)', '런너/가이드 클리닝 상태', '육안 검사', false, 46),
('세척점검', '벤트·게이트 세척(50K)', '벤트·게이트 세척 상태', '육안 검사', false, 47),
('세척점검', '세척제 사용(50K)', '사용 세척제 및 희석 비율 기록', '기록 확인', false, 48),
('세척점검', '세척 완료 확인(50K)', '세척 완료 시간/담당자 기록', '기록 확인', false, 49)
ON CONFLICT DO NOTHING;

-- 50K 항목-주기 매핑 추가
INSERT INTO checklist_item_cycle_maps (checklist_version_id, item_id, cycle_code_id, is_enabled)
SELECT 
  (SELECT id FROM checklist_master_versions WHERE name = '금형점검 체크리스트 v1.0' LIMIT 1),
  id,
  (SELECT id FROM checklist_cycle_codes WHERE label = '50000' LIMIT 1),
  true
FROM checklist_items_master
WHERE item_name LIKE '%세척%(50K)%' OR item_name LIKE '%클리닝%(50K)%'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. inspection_photos 테이블에 inspection_type 컬럼 추가 (없는 경우)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inspection_photos' AND column_name = 'inspection_type'
  ) THEN
    ALTER TABLE inspection_photos ADD COLUMN inspection_type VARCHAR(50);
    COMMENT ON COLUMN inspection_photos.inspection_type IS '점검 유형: daily, 20000, 50000, 80000, 100000';
  END IF;
END $$;

-- =====================================================
-- 4. inspection_photos 테이블에 inspection_id 컬럼 추가 (없는 경우)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inspection_photos' AND column_name = 'inspection_id'
  ) THEN
    ALTER TABLE inspection_photos ADD COLUMN inspection_id INTEGER;
    COMMENT ON COLUMN inspection_photos.inspection_id IS '정기점검 ID (inspections 테이블 참조)';
    CREATE INDEX IF NOT EXISTS idx_inspection_photos_inspection_id ON inspection_photos(inspection_id);
  END IF;
END $$;

-- =====================================================
-- 5. inspection_photos 테이블에 category 컬럼 추가 (없는 경우)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inspection_photos' AND column_name = 'category'
  ) THEN
    ALTER TABLE inspection_photos ADD COLUMN category VARCHAR(100);
    COMMENT ON COLUMN inspection_photos.category IS '점검 카테고리: 세척점검, 습합점검, 파팅면/성형면 등';
  END IF;
END $$;

-- =====================================================
-- 6. inspection_photos 테이블에 description 컬럼 추가 (없는 경우)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inspection_photos' AND column_name = 'description'
  ) THEN
    ALTER TABLE inspection_photos ADD COLUMN description TEXT;
    COMMENT ON COLUMN inspection_photos.description IS '사진 설명';
  END IF;
END $$;

COMMENT ON TABLE checklist_items_master IS '점검항목 마스터 - 일상/정기/습합/세척 통합 (20K/50K 세척항목 추가)';
