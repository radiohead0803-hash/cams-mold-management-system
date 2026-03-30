-- =============================================
-- 금형체크리스트(MobileMoldChecklist) 마스터 항목 시드 데이터
-- MobileMoldChecklist.jsx DEFAULT_CHECKLIST_CATEGORIES -> DB 마스터화
-- inspection_type = 'mold_checklist' 로 구분
-- extra_config JSONB에 type, options, suffix 등 저장
-- =============================================

-- 기존 금형체크리스트 데이터만 삭제 후 재삽입 (멱등성)
DELETE FROM checklist_items_master WHERE inspection_type = 'mold_checklist';

-- 금형체크리스트 마스터 항목 (9개 카테고리, 32개 항목)
INSERT INTO checklist_items_master
  (major_category, category_icon, item_name, description, check_method, check_points, is_required, field_type, required_photo, sort_order, inspection_type, inspection_sub_type, is_active, extra_config)
VALUES
  -- Ⅰ. 원재료 (material) - 3항목
  ('원재료', NULL, '수축률', NULL, NULL,
   '[]', FALSE, 'text', FALSE, 101, 'mold_checklist', 'material', TRUE,
   '{"categoryId":"material","categoryTitle":"Ⅰ. 원재료","itemId":1,"type":"text"}'),

  ('원재료', NULL, '소재 (MS SPEC)', NULL, NULL,
   '[]', FALSE, 'text', FALSE, 102, 'mold_checklist', 'material', TRUE,
   '{"categoryId":"material","categoryTitle":"Ⅰ. 원재료","itemId":2,"type":"text"}'),

  ('원재료', NULL, '공급 업체', NULL, NULL,
   '[]', FALSE, 'text', FALSE, 103, 'mold_checklist', 'material', TRUE,
   '{"categoryId":"material","categoryTitle":"Ⅰ. 원재료","itemId":3,"type":"text"}'),

  -- Ⅱ. 금형 (mold) - 10항목
  ('금형', NULL, '금형 발주 품번·품목 아이템 사양 일치', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 201, 'mold_checklist', 'mold', TRUE,
   '{"categoryId":"mold","categoryTitle":"Ⅱ. 금형","itemId":1,"type":"check","options":["확인","미확인"]}'),

  ('금형', NULL, '양산차 조건 제작 사양 반영', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 202, 'mold_checklist', 'mold', TRUE,
   '{"categoryId":"mold","categoryTitle":"Ⅱ. 금형","itemId":2,"type":"check","options":["유","무"]}'),

  ('금형', NULL, '수축률', NULL, NULL,
   '[]', FALSE, 'text', FALSE, 203, 'mold_checklist', 'mold', TRUE,
   '{"categoryId":"mold","categoryTitle":"Ⅱ. 금형","itemId":3,"type":"text"}'),

  ('금형', NULL, '금형 중량', NULL, NULL,
   '[]', FALSE, 'text', FALSE, 204, 'mold_checklist', 'mold', TRUE,
   '{"categoryId":"mold","categoryTitle":"Ⅱ. 금형","itemId":4,"type":"text","suffix":"ton"}'),

  ('금형', NULL, '범퍼 히트파팅 적용', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 205, 'mold_checklist', 'mold', TRUE,
   '{"categoryId":"mold","categoryTitle":"Ⅱ. 금형","itemId":5,"type":"check","options":["적용","미적용"]}'),

  ('금형', NULL, '캐비티 재질', NULL, NULL,
   '[]', FALSE, 'select', FALSE, 206, 'mold_checklist', 'mold', TRUE,
   '{"categoryId":"mold","categoryTitle":"Ⅱ. 금형","itemId":6,"type":"select","options":["NAK80","S45C","SKD61"]}'),

  ('금형', NULL, '코어 재질', NULL, NULL,
   '[]', FALSE, 'select', FALSE, 207, 'mold_checklist', 'mold', TRUE,
   '{"categoryId":"mold","categoryTitle":"Ⅱ. 금형","itemId":7,"type":"select","options":["NAK80","S45C","SKD61"]}'),

  ('금형', NULL, '캐비티 수', NULL, NULL,
   '[]', FALSE, 'text', FALSE, 208, 'mold_checklist', 'mold', TRUE,
   '{"categoryId":"mold","categoryTitle":"Ⅱ. 금형","itemId":8,"type":"text"}'),

  ('금형', NULL, '게이트 형식', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 209, 'mold_checklist', 'mold', TRUE,
   '{"categoryId":"mold","categoryTitle":"Ⅱ. 금형","itemId":9,"type":"check","options":["오픈","밸브"]}'),

  ('금형', NULL, '게이트 수', NULL, NULL,
   '[]', FALSE, 'text', FALSE, 210, 'mold_checklist', 'mold', TRUE,
   '{"categoryId":"mold","categoryTitle":"Ⅱ. 금형","itemId":10,"type":"text"}'),

  -- Ⅲ. 가스 빼기 (gas_vent) - 3항목
  ('가스 빼기', NULL, '가스 빼기 금형 전반 반영', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 301, 'mold_checklist', 'gas_vent', TRUE,
   '{"categoryId":"gas_vent","categoryTitle":"Ⅲ. 가스 빼기","itemId":1,"type":"check","options":["반영","미반영"]}'),

  ('가스 빼기', NULL, '가스 빼기 2/100 또는 3/100 반영', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 302, 'mold_checklist', 'gas_vent', TRUE,
   '{"categoryId":"gas_vent","categoryTitle":"Ⅲ. 가스 빼기","itemId":2,"type":"check","options":["반영","미반영"]}'),

  ('가스 빼기', NULL, '가스 빼기 피치간 거리 30mm 간격 유지', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 303, 'mold_checklist', 'gas_vent', TRUE,
   '{"categoryId":"gas_vent","categoryTitle":"Ⅲ. 가스 빼기","itemId":3,"type":"check","options":["반영","미반영"]}'),

  -- Ⅳ. 성형 해석 (moldflow) - 3항목
  ('성형 해석', NULL, '중 대물류 및 도금 아이템 성형 해석 실행', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 401, 'mold_checklist', 'moldflow', TRUE,
   '{"categoryId":"moldflow","categoryTitle":"Ⅳ. 성형 해석","itemId":1,"type":"check","options":["실행","미실행"]}'),

  ('성형 해석', NULL, '성형성 확인(미성형 발생부 확인)', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 402, 'mold_checklist', 'moldflow', TRUE,
   '{"categoryId":"moldflow","categoryTitle":"Ⅳ. 성형 해석","itemId":2,"type":"check","options":["확인","미확인"]}'),

  ('성형 해석', NULL, '웰드라인 위치 확인', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 403, 'mold_checklist', 'moldflow', TRUE,
   '{"categoryId":"moldflow","categoryTitle":"Ⅳ. 성형 해석","itemId":3,"type":"check","options":["확인","미확인"]}'),

  -- Ⅴ. 싱크마크 (sink_mark) - 2항목
  ('싱크마크', NULL, '전체 리브 0.6t 반영', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 501, 'mold_checklist', 'sink_mark', TRUE,
   '{"categoryId":"sink_mark","categoryTitle":"Ⅴ. 싱크마크","itemId":1,"type":"check","options":["반영","미반영"]}'),

  ('싱크마크', NULL, '싱크 발생 구조(제품 두께 편차)', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 502, 'mold_checklist', 'sink_mark', TRUE,
   '{"categoryId":"sink_mark","categoryTitle":"Ⅴ. 싱크마크","itemId":2,"type":"check","options":["반영","미반영"]}'),

  -- Ⅵ. 취출 (ejection) - 3항목
  ('취출', NULL, '제품 취출 구조(범퍼 하단 매칭부)', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 601, 'mold_checklist', 'ejection', TRUE,
   '{"categoryId":"ejection","categoryTitle":"Ⅵ. 취출","itemId":1,"type":"check","options":["반영","미반영"]}'),

  ('취출', NULL, '언더컷 구조 확인', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 602, 'mold_checklist', 'ejection', TRUE,
   '{"categoryId":"ejection","categoryTitle":"Ⅵ. 취출","itemId":2,"type":"check","options":["반영","미반영"]}'),

  ('취출', NULL, '빼기 구배 3~5도', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 603, 'mold_checklist', 'ejection', TRUE,
   '{"categoryId":"ejection","categoryTitle":"Ⅵ. 취출","itemId":3,"type":"check","options":["반영","미반영"]}'),

  -- Ⅶ. MIC 제품 (mic) - 2항목
  ('MIC 제품', NULL, 'MIC 사양 게이트 형상 반영', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 701, 'mold_checklist', 'mic', TRUE,
   '{"categoryId":"mic","categoryTitle":"Ⅶ. MIC 제품","itemId":1,"type":"check","options":["반영","미반영"]}'),

  ('MIC 제품', NULL, '웰드라인 확인 및 도장 사양', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 702, 'mold_checklist', 'mic', TRUE,
   '{"categoryId":"mic","categoryTitle":"Ⅶ. MIC 제품","itemId":2,"type":"check","options":["반영","미반영"]}'),

  -- Ⅷ. 도금 (coating) - 3항목
  ('도금', NULL, '게이트 위치/개수 최적화', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 801, 'mold_checklist', 'coating', TRUE,
   '{"categoryId":"coating","categoryTitle":"Ⅷ. 도금","itemId":1,"type":"check","options":["반영","미반영"]}'),

  ('도금', NULL, '수축률', NULL, NULL,
   '[]', FALSE, 'text', FALSE, 802, 'mold_checklist', 'coating', TRUE,
   '{"categoryId":"coating","categoryTitle":"Ⅷ. 도금","itemId":2,"type":"text","suffix":"/1000"}'),

  ('도금', NULL, '보스 조립부 엣지 1R 반영', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 803, 'mold_checklist', 'coating', TRUE,
   '{"categoryId":"coating","categoryTitle":"Ⅷ. 도금","itemId":3,"type":"check","options":["반영","미반영"]}'),

  -- Ⅸ. 리어 백빔 (rear_back_beam) - 2항목
  ('리어 백빔', NULL, '리어 백빔 금형구배 5도 이상', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 901, 'mold_checklist', 'rear_back_beam', TRUE,
   '{"categoryId":"rear_back_beam","categoryTitle":"Ⅸ. 리어 백빔","itemId":1,"type":"check","options":["반영","미반영"]}'),

  ('리어 백빔', NULL, '리어 백빔 제품 끝단부 두께 5.0t 이상', NULL, NULL,
   '[]', FALSE, 'yes_no', FALSE, 902, 'mold_checklist', 'rear_back_beam', TRUE,
   '{"categoryId":"rear_back_beam","categoryTitle":"Ⅸ. 리어 백빔","itemId":2,"type":"check","options":["반영","미반영"]}');
