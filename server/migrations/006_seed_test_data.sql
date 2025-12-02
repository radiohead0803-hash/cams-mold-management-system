-- 테스트용 시드 데이터
-- 이 파일은 개발/테스트 환경에서만 실행하세요!

-- 1. 테스트용 금형 데이터
INSERT INTO molds (mold_code, mold_name, status, shot_counter, created_at, updated_at)
VALUES 
  ('M2024-001', '테스트 금형 A', 'active', 15000, now(), now()),
  ('M2024-002', '테스트 금형 B', 'active', 25000, now(), now()),
  ('M2024-003', '테스트 금형 C', 'maintenance', 8000, now(), now())
ON CONFLICT (mold_code) DO NOTHING;

-- 2. 테스트용 체크리스트 인스턴스 (일부 제출 완료)
INSERT INTO checklist_instances (
  template_id, 
  mold_id, 
  plant_id, 
  site_type, 
  category, 
  shot_counter, 
  status, 
  inspected_at, 
  created_at
)
SELECT 
  t.id,
  m.id,
  NULL,
  'production',
  'daily',
  m.shot_counter,
  'submitted',
  now() - interval '2 hours',
  now() - interval '2 hours'
FROM checklist_templates t
CROSS JOIN molds m
WHERE t.code = 'DAILY_MOLD' 
  AND m.mold_code = 'M2024-001'
LIMIT 1;

INSERT INTO checklist_instances (
  template_id, 
  mold_id, 
  plant_id, 
  site_type, 
  category, 
  shot_counter, 
  status, 
  inspected_at, 
  created_at
)
SELECT 
  t.id,
  m.id,
  NULL,
  'production',
  'regular',
  m.shot_counter,
  'submitted',
  now() - interval '1 day',
  now() - interval '1 day'
FROM checklist_templates t
CROSS JOIN molds m
WHERE t.code = 'REG_20K' 
  AND m.mold_code = 'M2024-002'
LIMIT 1;

-- 3. 테스트용 체크리스트 답변 (NG 포함)
-- 첫 번째 인스턴스 답변 (NG 2건)
INSERT INTO checklist_answers (instance_id, item_id, value_bool, is_ng)
SELECT 
  ci.id,
  cti.id,
  CASE 
    WHEN cti.order_no = 1 THEN true
    WHEN cti.order_no = 2 THEN false  -- NG!
    WHEN cti.order_no = 3 THEN false  -- NG!
    WHEN cti.order_no = 4 THEN true
  END,
  CASE 
    WHEN cti.order_no = 1 THEN false
    WHEN cti.order_no = 2 THEN true   -- NG!
    WHEN cti.order_no = 3 THEN true   -- NG!
    WHEN cti.order_no = 4 THEN false
  END
FROM checklist_instances ci
JOIN checklist_templates ct ON ci.template_id = ct.id
JOIN checklist_template_items cti ON ct.id = cti.template_id
WHERE ct.code = 'DAILY_MOLD'
  AND ci.status = 'submitted'
  AND ci.created_at > now() - interval '3 hours'
LIMIT 4;

-- 두 번째 인스턴스 답변 (NG 1건)
INSERT INTO checklist_answers (instance_id, item_id, value_bool, is_ng)
SELECT 
  ci.id,
  cti.id,
  CASE 
    WHEN cti.order_no = 1 THEN true
    WHEN cti.order_no = 2 THEN true
    WHEN cti.order_no = 3 THEN false  -- NG!
    WHEN cti.order_no = 4 THEN true
  END,
  CASE 
    WHEN cti.order_no = 1 THEN false
    WHEN cti.order_no = 2 THEN false
    WHEN cti.order_no = 3 THEN true   -- NG!
    WHEN cti.order_no = 4 THEN false
  END
FROM checklist_instances ci
JOIN checklist_templates ct ON ci.template_id = ct.id
JOIN checklist_template_items cti ON ct.id = cti.template_id
WHERE ct.code = 'REG_20K'
  AND ci.status = 'submitted'
  AND ci.created_at > now() - interval '2 days'
LIMIT 4;

-- 4. 테스트용 수리요청 (체크리스트 NG로 인한 자동 생성)
-- 첫 번째 수리요청 (M2024-001, NG 2건)
INSERT INTO repair_requests (
  mold_id,
  plant_id,
  checklist_instance_id,
  status,
  priority,
  request_type,
  requested_by,
  requested_role,
  title,
  description,
  created_at,
  updated_at
)
SELECT 
  m.id,
  NULL,
  ci.id,
  'requested',
  'normal',
  'ng_repair',
  NULL,
  'production',
  '[NG] 금형 ' || m.mold_code || ' 점검 결과 수리요청',
  '체크리스트(ID: ' || ci.id || ')에서 NG 항목 2건 발생

NG 항목:
- 공통: 코어/캐비티 이물 및 오염 여부
- 냉각: 냉각라인 누수/막힘 여부',
  now() - interval '2 hours',
  now() - interval '2 hours'
FROM molds m
JOIN checklist_instances ci ON m.id = ci.mold_id
WHERE m.mold_code = 'M2024-001'
  AND ci.status = 'submitted'
  AND ci.created_at > now() - interval '3 hours'
LIMIT 1;

-- 두 번째 수리요청 (M2024-002, NG 1건)
INSERT INTO repair_requests (
  mold_id,
  plant_id,
  checklist_instance_id,
  status,
  priority,
  request_type,
  requested_by,
  requested_role,
  title,
  description,
  created_at,
  updated_at
)
SELECT 
  m.id,
  NULL,
  ci.id,
  'accepted',
  'high',
  'ng_repair',
  NULL,
  'production',
  '[NG] 금형 ' || m.mold_code || ' 정기점검 수리요청',
  '체크리스트(ID: ' || ci.id || ')에서 NG 항목 1건 발생

NG 항목:
- 가이드: 가이드핀/부시 마모 상태 점검',
  now() - interval '1 day',
  now() - interval '1 day'
FROM molds m
JOIN checklist_instances ci ON m.id = ci.mold_id
WHERE m.mold_code = 'M2024-002'
  AND ci.status = 'submitted'
  AND ci.created_at > now() - interval '2 days'
LIMIT 1;

-- 5. 수리요청 항목 상세 (NG 항목들)
-- 첫 번째 수리요청의 NG 항목들
INSERT INTO repair_request_items (
  repair_request_id,
  checklist_answer_id,
  item_label,
  item_section,
  value_bool,
  is_ng
)
SELECT 
  rr.id,
  ca.id,
  cti.label,
  cti.section,
  ca.value_bool,
  true
FROM repair_requests rr
JOIN checklist_instances ci ON rr.checklist_instance_id = ci.id
JOIN checklist_answers ca ON ci.id = ca.instance_id
JOIN checklist_template_items cti ON ca.item_id = cti.id
WHERE ca.is_ng = true
  AND rr.created_at > now() - interval '3 hours'
  AND ci.created_at > now() - interval '3 hours';

-- 두 번째 수리요청의 NG 항목들
INSERT INTO repair_request_items (
  repair_request_id,
  checklist_answer_id,
  item_label,
  item_section,
  value_bool,
  is_ng
)
SELECT 
  rr.id,
  ca.id,
  cti.label,
  cti.section,
  ca.value_bool,
  true
FROM repair_requests rr
JOIN checklist_instances ci ON rr.checklist_instance_id = ci.id
JOIN checklist_answers ca ON ci.id = ca.instance_id
JOIN checklist_template_items cti ON ca.item_id = cti.id
WHERE ca.is_ng = true
  AND rr.created_at > now() - interval '2 days'
  AND ci.created_at > now() - interval '2 days';

-- 6. 추가 수리요청 (다양한 상태 테스트용)
INSERT INTO repair_requests (
  mold_id,
  plant_id,
  checklist_instance_id,
  status,
  priority,
  request_type,
  requested_by,
  requested_role,
  title,
  description,
  created_at,
  updated_at
)
SELECT 
  m.id,
  NULL,
  NULL,
  'in_progress',
  'high',
  'preventive',
  NULL,
  'production',
  '[예방정비] 금형 ' || m.mold_code || ' 정기 예방정비',
  '20,000샷 도달로 인한 정기 예방정비 요청',
  now() - interval '3 days',
  now() - interval '1 day'
FROM molds m
WHERE m.mold_code = 'M2024-002'
LIMIT 1;

INSERT INTO repair_requests (
  mold_id,
  plant_id,
  checklist_instance_id,
  status,
  priority,
  request_type,
  requested_by,
  requested_role,
  title,
  description,
  created_at,
  updated_at
)
SELECT 
  m.id,
  NULL,
  NULL,
  'done',
  'normal',
  'ng_repair',
  NULL,
  'production',
  '[완료] 금형 ' || m.mold_code || ' 수리 완료',
  '냉각라인 청소 및 점검 완료',
  now() - interval '5 days',
  now() - interval '2 days'
FROM molds m
WHERE m.mold_code = 'M2024-003'
LIMIT 1;

-- 확인 쿼리
SELECT 
  '금형' as 구분,
  COUNT(*) as 개수
FROM molds
WHERE mold_code LIKE 'M2024-%'

UNION ALL

SELECT 
  '체크리스트 인스턴스' as 구분,
  COUNT(*) as 개수
FROM checklist_instances

UNION ALL

SELECT 
  '체크리스트 답변' as 구분,
  COUNT(*) as 개수
FROM checklist_answers

UNION ALL

SELECT 
  '수리요청' as 구분,
  COUNT(*) as 개수
FROM repair_requests

UNION ALL

SELECT 
  '수리요청 항목' as 구분,
  COUNT(*) as 개수
FROM repair_request_items;
