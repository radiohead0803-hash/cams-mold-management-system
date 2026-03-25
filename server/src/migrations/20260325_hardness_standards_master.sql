-- =============================================
-- 경도측정 기준 마스터 데이터
-- HardnessMeasurement.jsx HARDNESS_STANDARDS 하드코딩 → DB 마스터화
-- standard_document_templates에 template_type = 'hardness_standards'
-- 10개 재질별 경도 기준
-- =============================================

INSERT INTO standard_document_templates (
  template_code, template_name, template_type, version, status, 
  description, development_stage, deployed_to,
  item_count, category_count, items, is_active,
  created_at, updated_at
) VALUES (
  'HDS-STD-001',
  '금형 재질별 경도 기준 표준',
  'hardness_standards',
  '1.0',
  'deployed',
  '금형 재질별 경도(HRC) 기준값 - 경도측정 시 합격/불합격 판정 기준',
  'all',
  '["제작처", "생산처"]'::jsonb,
  10,
  1,
  '[
    {"id": 1, "grade": "S45C", "hardness": "HRC 10 ~ 18", "min": 10, "max": 18, "characteristics": "-"},
    {"id": 2, "grade": "HP1A (HP1)", "hardness": "HRC 10 ~ 18", "min": 10, "max": 18, "characteristics": "-"},
    {"id": 3, "grade": "HP4A (HP4)", "hardness": "HRC 28 ~ 32", "min": 28, "max": 32, "characteristics": "-"},
    {"id": 4, "grade": "HS-PA", "hardness": "HRC 28 ~ 32", "min": 28, "max": 32, "characteristics": "-"},
    {"id": 5, "grade": "HP4MA (HP4M)", "hardness": "HRC 31 ~ 34", "min": 31, "max": 34, "characteristics": "-"},
    {"id": 6, "grade": "CENA G", "hardness": "HRC 35 ~ 41", "min": 35, "max": 41, "characteristics": "핫스탬핑 부품에 적용"},
    {"id": 7, "grade": "NAK-80", "hardness": "HRC 37 ~ 41", "min": 37, "max": 41, "characteristics": "투명 제품 등 고광택을 중시하는 제품에 적용"},
    {"id": 8, "grade": "SKD61", "hardness": "HRC 48 ~ 52", "min": 48, "max": 52, "characteristics": "-"},
    {"id": 9, "grade": "P20", "hardness": "HRC 28 ~ 32", "min": 28, "max": 32, "characteristics": "-"},
    {"id": 10, "grade": "H13", "hardness": "HRC 48 ~ 52", "min": 48, "max": 52, "characteristics": "-"}
  ]'::jsonb,
  TRUE,
  NOW(),
  NOW()
) ON CONFLICT (template_code) DO UPDATE SET
  items = EXCLUDED.items,
  item_count = EXCLUDED.item_count,
  updated_at = NOW();
