-- =============================================
-- system_code_options: 시스템 전역 코드/옵션 마스터
-- 하드코딩된 셀렉트 옵션, 상태값, 워크플로 단계 등을 관리
-- =============================================
CREATE TABLE IF NOT EXISTS system_code_options (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,        -- 카테고리 그룹 (repair_status, scrapping_reason 등)
  code VARCHAR(100) NOT NULL,            -- 코드값 (실제 저장되는 값)
  label VARCHAR(200) NOT NULL,           -- 표시 라벨 (한글)
  description TEXT,                       -- 설명
  sort_order INTEGER DEFAULT 0,          -- 정렬 순서
  is_active BOOLEAN DEFAULT true,        -- 활성 여부
  metadata JSONB DEFAULT '{}'::jsonb,    -- 추가 메타 (색상, 아이콘 등)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, code)
);

CREATE INDEX IF NOT EXISTS idx_system_code_options_category ON system_code_options(category);
CREATE INDEX IF NOT EXISTS idx_system_code_options_active ON system_code_options(category, is_active);

-- =============================================
-- 1. 수리요청 관련 옵션
-- =============================================

-- 수리 상태
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('repair_status', '요청접수', '요청접수', 1),
  ('repair_status', '수리처선정', '수리처선정', 2),
  ('repair_status', '수리처승인대기', '수리처승인대기', 3),
  ('repair_status', '수리진행', '수리진행', 4),
  ('repair_status', '체크리스트점검', '체크리스트점검', 5),
  ('repair_status', '생산처검수대기', '생산처검수대기', 6),
  ('repair_status', '생산처검수완료', '생산처검수완료', 7),
  ('repair_status', '귀책처리', '귀책처리', 8),
  ('repair_status', '수리완료', '수리완료', 9),
  ('repair_status', '완료', '완료', 10)
ON CONFLICT (category, code) DO NOTHING;

-- 문제 유형
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('repair_problem_type', '내구성', '내구성', 1),
  ('repair_problem_type', '외관', '외관', 2),
  ('repair_problem_type', '치수', '치수', 3),
  ('repair_problem_type', '기능', '기능', 4),
  ('repair_problem_type', '기타', '기타', 5)
ON CONFLICT (category, code) DO NOTHING;

-- 수리 카테고리
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('repair_category', 'EO', 'EO', 1),
  ('repair_category', '현실화', '현실화', 2),
  ('repair_category', '돌발', '돌발', 3)
ON CONFLICT (category, code) DO NOTHING;

-- 발생 유형
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('repair_occurrence', '신규', '신규', 1),
  ('repair_occurrence', '재발', '재발', 2)
ON CONFLICT (category, code) DO NOTHING;

-- 운영 구분
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('repair_operation', '양산', '양산', 1),
  ('repair_operation', '개발', '개발', 2),
  ('repair_operation', '시작', '시작', 3)
ON CONFLICT (category, code) DO NOTHING;

-- 수리처 유형
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('repair_shop_type', '자체', '자체', 1),
  ('repair_shop_type', '외주', '외주', 2)
ON CONFLICT (category, code) DO NOTHING;

-- 귀책 유형
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('repair_liability', '제작처', '제작처', 1),
  ('repair_liability', '생산처', '생산처', 2),
  ('repair_liability', '공동', '공동', 3),
  ('repair_liability', '기타', '기타', 4)
ON CONFLICT (category, code) DO NOTHING;

-- 관리 유형
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('repair_management_type', '전산공유(L1)', '전산공유(L1)', 1),
  ('repair_management_type', '일반', '일반', 2),
  ('repair_management_type', '긴급', '긴급', 3)
ON CONFLICT (category, code) DO NOTHING;

-- 우선순위
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('priority', '높음', '높음', 1),
  ('priority', '보통', '보통', 2),
  ('priority', '낮음', '낮음', 3)
ON CONFLICT (category, code) DO NOTHING;

-- 우선순위 (긴급 추가)
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('priority', '긴급', '긴급', 0)
ON CONFLICT (category, code) DO NOTHING;

-- =============================================
-- 이관 유형
-- =============================================
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('transfer_type', 'plant_to_plant', '생산처 → 생산처', 1),
  ('transfer_type', 'maker_to_plant', '제작처 → 생산처', 2),
  ('transfer_type', 'plant_to_maker', '생산처 → 제작처', 3)
ON CONFLICT (category, code) DO NOTHING;

-- =============================================
-- 금형 재질
-- =============================================
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('mold_material', 'NAK80', 'NAK80', 1),
  ('mold_material', 'S45C', 'S45C', 2),
  ('mold_material', 'SKD61', 'SKD61', 3),
  ('mold_material', 'SKD11', 'SKD11', 4),
  ('mold_material', 'SUS420', 'SUS420', 5),
  ('mold_material', 'HPM38', 'HPM38', 6),
  ('mold_material', 'STAVAX', 'STAVAX', 7),
  ('mold_material', 'P20', 'P20', 8)
ON CONFLICT (category, code) DO NOTHING;

-- =============================================
-- 2. 폐기관리 관련 옵션
-- =============================================

-- 폐기 사유
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('scrapping_reason', '수명종료', '수명 종료', 1),
  ('scrapping_reason', '수리불가', '수리 불가', 2),
  ('scrapping_reason', '모델단종', '모델 단종', 3),
  ('scrapping_reason', '품질불량', '품질 불량', 4),
  ('scrapping_reason', '경제성부족', '경제성 부족', 5),
  ('scrapping_reason', '기타', '기타', 6)
ON CONFLICT (category, code) DO NOTHING;

-- 외관 상태
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('scrapping_appearance', '양호', '양호', 1),
  ('scrapping_appearance', '경미손상', '경미손상', 2),
  ('scrapping_appearance', '중대손상', '중대손상', 3),
  ('scrapping_appearance', '파손', '파손', 4)
ON CONFLICT (category, code) DO NOTHING;

-- 기능 상태
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('scrapping_functional', '정상', '정상', 1),
  ('scrapping_functional', '부분불량', '부분불량', 2),
  ('scrapping_functional', '기능저하', '기능저하', 3),
  ('scrapping_functional', '작동불가', '작동불가', 4)
ON CONFLICT (category, code) DO NOTHING;

-- 치수 상태
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('scrapping_dimensional', '규격내', '규격내', 1),
  ('scrapping_dimensional', '경미이탈', '경미이탈', 2),
  ('scrapping_dimensional', '규격초과', '규격초과', 3)
ON CONFLICT (category, code) DO NOTHING;

-- 경제성 검토 결과
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('scrapping_review_result', '폐기타당', '폐기타당', 1),
  ('scrapping_review_result', '폐기권고', '폐기권고', 2),
  ('scrapping_review_result', '수리검토', '수리검토', 3),
  ('scrapping_review_result', '폐기보류', '폐기보류', 4)
ON CONFLICT (category, code) DO NOTHING;

-- 처리 방법
INSERT INTO system_code_options (category, code, label, sort_order) VALUES
  ('scrapping_disposal_method', '전문업체 위탁', '전문업체 위탁', 1),
  ('scrapping_disposal_method', '자체 처리', '자체 처리', 2),
  ('scrapping_disposal_method', '재활용 매각', '재활용 매각', 3),
  ('scrapping_disposal_method', '부품 분리 후 폐기', '부품 분리 후 폐기', 4)
ON CONFLICT (category, code) DO NOTHING;

-- =============================================
-- 3. 이관 워크플로 단계
-- =============================================
INSERT INTO system_code_options (category, code, label, sort_order, metadata) VALUES
  ('transfer_step', 'request', '요청', 1, '{"icon":"FileText","color":"purple"}'::jsonb),
  ('transfer_step', 'checklist', '점검', 2, '{"icon":"ClipboardList","color":"cyan"}'::jsonb),
  ('transfer_step', 'handover', '인계승인', 3, '{"icon":"Shield","color":"blue"}'::jsonb),
  ('transfer_step', 'takeover', '인수승인', 4, '{"icon":"Shield","color":"green"}'::jsonb),
  ('transfer_step', 'complete', '완료', 5, '{"icon":"CheckCircle","color":"emerald"}'::jsonb)
ON CONFLICT (category, code) DO NOTHING;

-- =============================================
-- 4. 폐기 워크플로 단계
-- =============================================
INSERT INTO system_code_options (category, code, label, sort_order, metadata) VALUES
  ('scrapping_step', 'request', '폐기요청', 1, '{"icon":"FileText"}'::jsonb),
  ('scrapping_step', 'assessment', '상태평가', 2, '{"icon":"Search"}'::jsonb),
  ('scrapping_step', 'review', '경제성검토', 3, '{"icon":"Calculator"}'::jsonb),
  ('scrapping_step', 'first_approval', '1차승인', 4, '{"icon":"Shield"}'::jsonb),
  ('scrapping_step', 'second_approval', '2차승인', 5, '{"icon":"Shield"}'::jsonb),
  ('scrapping_step', 'disposal', '폐기처리', 6, '{"icon":"Trash2"}'::jsonb),
  ('scrapping_step', 'postcare', '사후관리', 7, '{"icon":"Archive"}'::jsonb)
ON CONFLICT (category, code) DO NOTHING;

-- =============================================
-- 5. 변경이력 유형
-- =============================================
INSERT INTO system_code_options (category, code, label, sort_order, metadata) VALUES
  ('history_type', 'created', '등록', 1, '{"icon":"Package","color":"bg-blue-100 text-blue-600"}'::jsonb),
  ('history_type', 'status_change', '상태변경', 2, '{"icon":"AlertTriangle","color":"bg-yellow-100 text-yellow-600"}'::jsonb),
  ('history_type', 'transfer', '이관', 3, '{"icon":"MapPin","color":"bg-purple-100 text-purple-600"}'::jsonb),
  ('history_type', 'repair', '수리', 4, '{"icon":"Wrench","color":"bg-orange-100 text-orange-600"}'::jsonb),
  ('history_type', 'inspection', '점검', 5, '{"icon":"CheckCircle","color":"bg-green-100 text-green-600"}'::jsonb),
  ('history_type', 'maintenance', '유지보전', 6, '{"icon":"Wrench","color":"bg-cyan-100 text-cyan-600"}'::jsonb),
  ('history_type', 'specification', '사양변경', 7, '{"icon":"FileText","color":"bg-indigo-100 text-indigo-600"}'::jsonb),
  ('history_type', 'scrapping', '폐기', 8, '{"icon":"AlertTriangle","color":"bg-red-100 text-red-600"}'::jsonb)
ON CONFLICT (category, code) DO NOTHING;

-- =============================================
-- 6. 개발계획 상태
-- =============================================
INSERT INTO system_code_options (category, code, label, sort_order, metadata) VALUES
  ('dev_plan_status', 'pending', '대기', 1, '{"color":"bg-gray-100 text-gray-700"}'::jsonb),
  ('dev_plan_status', 'in_progress', '진행중', 2, '{"color":"bg-yellow-100 text-yellow-700"}'::jsonb),
  ('dev_plan_status', 'completed', '완료', 3, '{"color":"bg-green-100 text-green-700"}'::jsonb),
  ('dev_plan_status', 'delayed', '지연', 4, '{"color":"bg-red-100 text-red-700"}'::jsonb)
ON CONFLICT (category, code) DO NOTHING;
