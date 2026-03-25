-- =============================================
-- 수리출하점검 마스터 데이터
-- repairShipmentChecklist.js STANDARD_CHECKLIST_ITEMS → DB 마스터화
-- standard_document_templates에 template_type = 'repair_shipment_checklist'
-- 8개 카테고리, 36개 항목
-- =============================================

INSERT INTO standard_document_templates (
  template_code, template_name, template_type, version, status, 
  description, development_stage, deployed_to,
  item_count, category_count, items, is_active,
  created_at, updated_at
) VALUES (
  'RSC-STD-001',
  '수리출하 점검 체크리스트 표준양식',
  'repair_shipment_checklist',
  '1.0',
  'deployed',
  '금형 수리 후 출하단계 점검 8개 카테고리 표준 체크리스트 (전 항목 사진 필수)',
  'production',
  '["제작처"]'::jsonb,
  36,
  8,
  '[
    {
      "category_code": "repair_history",
      "category_name": "수리 이력 및 범위 확인",
      "category_order": 1,
      "items": [
        {"item_code": "1-1", "item_name": "수리 요청 내역 일치 여부", "item_description": "요청서의 NG 내용과 실제 수리 내용 일치", "item_order": 1, "photo_required": true},
        {"item_code": "1-2", "item_name": "수리 범위 명확화", "item_description": "코어/캐비티/슬라이드/리프터 등 명시", "item_order": 2, "photo_required": true},
        {"item_code": "1-3", "item_name": "추가 수리 발생 여부", "item_description": "최초 요청 외 추가 가공/보완 여부 기록", "item_order": 3, "photo_required": true},
        {"item_code": "1-4", "item_name": "수리 전·후 비교 사진", "item_description": "동일 위치 Before/After 사진 첨부 (필수)", "item_order": 4, "photo_required": true}
      ]
    },
    {
      "category_code": "surface",
      "category_name": "성형면 및 외관 상태 점검",
      "category_order": 2,
      "items": [
        {"item_code": "2-1", "item_name": "성형면 손상", "item_description": "찍힘, 스크래치, 용접 흔적 無", "item_order": 1, "photo_required": true},
        {"item_code": "2-2", "item_name": "폴리싱 상태", "item_description": "광택 균일, 웨이브/오렌지필 無", "item_order": 2, "photo_required": true},
        {"item_code": "2-3", "item_name": "파팅라인", "item_description": "단차, 까짐, 날카로움 無", "item_order": 3, "photo_required": true},
        {"item_code": "2-4", "item_name": "텍스처 영역", "item_description": "텍스처 손상·번짐 無", "item_order": 4, "photo_required": true},
        {"item_code": "2-5", "item_name": "육안 이물", "item_description": "연마 분진, 오일 잔존 無", "item_order": 5, "photo_required": true}
      ]
    },
    {
      "category_code": "function",
      "category_name": "기능부 작동 점검",
      "category_order": 3,
      "items": [
        {"item_code": "3-1", "item_name": "슬라이드 작동", "item_description": "전후진 부드러움, 걸림 無", "item_order": 1, "photo_required": true},
        {"item_code": "3-2", "item_name": "리프터 작동", "item_description": "편마모·비틀림 無", "item_order": 2, "photo_required": true},
        {"item_code": "3-3", "item_name": "이젝터", "item_description": "복귀 정상, 편심 無", "item_order": 3, "photo_required": true},
        {"item_code": "3-4", "item_name": "가이드핀/부시", "item_description": "유격 이상 無", "item_order": 4, "photo_required": true},
        {"item_code": "3-5", "item_name": "볼트 체결 상태", "item_description": "풀림 방지 상태 양호", "item_order": 5, "photo_required": true}
      ]
    },
    {
      "category_code": "dimension",
      "category_name": "치수 및 맞물림 상태",
      "category_order": 4,
      "items": [
        {"item_code": "4-1", "item_name": "습합 상태", "item_description": "코어·캐비티 밀착 균일", "item_order": 1, "photo_required": true},
        {"item_code": "4-2", "item_name": "간섭 흔적", "item_description": "긁힘/찍힘 無", "item_order": 2, "photo_required": true},
        {"item_code": "4-3", "item_name": "틈새 과다 여부", "item_description": "누유·플래시 우려 無", "item_order": 3, "photo_required": true},
        {"item_code": "4-4", "item_name": "Shim 변경 여부", "item_description": "변경 시 두께·위치 기록", "item_order": 4, "photo_required": true}
      ]
    },
    {
      "category_code": "cooling",
      "category_name": "냉각·윤활·방청 상태",
      "category_order": 5,
      "items": [
        {"item_code": "5-1", "item_name": "냉각 회로", "item_description": "막힘·누수 無", "item_order": 1, "photo_required": true},
        {"item_code": "5-2", "item_name": "오링/실링", "item_description": "재조립 정상", "item_order": 2, "photo_required": true},
        {"item_code": "5-3", "item_name": "윤활 상태", "item_description": "필요부 윤활 완료", "item_order": 3, "photo_required": true},
        {"item_code": "5-4", "item_name": "방청 처리", "item_description": "출하용 방청 완료", "item_order": 4, "photo_required": true},
        {"item_code": "5-5", "item_name": "잔유 제거", "item_description": "절삭유·연마유 無", "item_order": 5, "photo_required": true}
      ]
    },
    {
      "category_code": "trial",
      "category_name": "시운전 결과 확인",
      "category_order": 6,
      "items": [
        {"item_code": "6-1", "item_name": "시운전 실시 여부", "item_description": "필요 시 실시", "item_order": 1, "photo_required": true},
        {"item_code": "6-2", "item_name": "성형품 외관", "item_description": "수리 NG 재발 無", "item_order": 2, "photo_required": true},
        {"item_code": "6-3", "item_name": "기능 불량", "item_description": "취출·변형·단차 無", "item_order": 3, "photo_required": true},
        {"item_code": "6-4", "item_name": "판단 결과", "item_description": "PASS / 조건부 PASS", "item_order": 4, "photo_required": true}
      ]
    },
    {
      "category_code": "shipment",
      "category_name": "출하 준비 및 식별 관리",
      "category_order": 7,
      "items": [
        {"item_code": "7-1", "item_name": "금형 세척 상태", "item_description": "이물 제거 완료", "item_order": 1, "photo_required": true},
        {"item_code": "7-2", "item_name": "금형 고정", "item_description": "운송 중 이동 방지", "item_order": 2, "photo_required": true},
        {"item_code": "7-3", "item_name": "QR/명판", "item_description": "QR 정상 스캔 확인", "item_order": 3, "photo_required": true},
        {"item_code": "7-4", "item_name": "출하 사진", "item_description": "전체/포장 상태 사진", "item_order": 4, "photo_required": true},
        {"item_code": "7-5", "item_name": "출하 목적지", "item_description": "생산처/보관처 명확", "item_order": 5, "photo_required": true}
      ]
    },
    {
      "category_code": "final",
      "category_name": "최종 확인 및 승인",
      "category_order": 8,
      "items": [
        {"item_code": "8-1", "item_name": "제작처 확인", "item_description": "수리 완료 확인", "item_order": 1, "photo_required": true},
        {"item_code": "8-2", "item_name": "본사 승인", "item_description": "승인 / 반려", "item_order": 2, "photo_required": true}
      ]
    }
  ]'::jsonb,
  TRUE,
  NOW(),
  NOW()
) ON CONFLICT (template_code) DO UPDATE SET
  items = EXCLUDED.items,
  item_count = EXCLUDED.item_count,
  category_count = EXCLUDED.category_count,
  updated_at = NOW();
