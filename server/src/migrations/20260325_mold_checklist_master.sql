-- =============================================
-- 금형체크리스트 마스터 데이터
-- MoldChecklist.jsx 하드코딩 항목 → standard_document_templates JSONB 마스터화
-- template_type = 'mold_checklist'
-- 9개 카테고리, 81개 항목
-- =============================================

INSERT INTO standard_document_templates (
  template_code, template_name, template_type, version, status, 
  description, development_stage, deployed_to,
  item_count, category_count, items, is_active,
  created_at, updated_at
) VALUES (
  'MCL-STD-001',
  '금형 체크리스트 표준양식',
  'mold_checklist',
  '1.0',
  'deployed',
  '금형 설계/제작 시 점검해야 할 9개 카테고리 표준 체크리스트',
  'development',
  '["제작처", "생산처"]'::jsonb,
  81,
  9,
  '[
    {
      "id": "material",
      "title": "Ⅰ. 원재료 (Material)",
      "items": [
        {"id": 1, "name": "수축률", "type": "text", "linkedField": "shrinkage_rate"},
        {"id": 2, "name": "소재 (MS SPEC)", "type": "text", "linkedField": "material"},
        {"id": 3, "name": "공급 업체", "type": "text"}
      ]
    },
    {
      "id": "mold",
      "title": "Ⅱ. 금형 (Mold)",
      "items": [
        {"id": 1, "name": "금형 발주 품번·품목 아이템 사양 일치", "type": "check", "options": ["확인", "미확인"]},
        {"id": 2, "name": "양산차 조건 제작 사양 반영", "type": "check", "options": ["유", "무"]},
        {"id": 3, "name": "수축률", "type": "text", "linkedField": "shrinkage_rate"},
        {"id": 4, "name": "금형 중량", "type": "text", "linkedField": "weight", "suffix": "ton"},
        {"id": 5, "name": "범퍼 히트파팅 적용", "type": "check", "options": ["적용", "미적용", "사양 상이"]},
        {"id": 6, "name": "캐비티 재질", "type": "select", "options": ["NAK80", "S45C", "SKD61"], "linkedField": "cavity_material"},
        {"id": 7, "name": "코어 재질", "type": "select", "options": ["NAK80", "S45C", "SKD61"], "linkedField": "core_material"},
        {"id": 8, "name": "캐비티 수", "type": "checkbox", "options": ["1", "2", "3", "4", "5", "6"], "linkedField": "cavity_count"},
        {"id": 9, "name": "게이트 형식", "type": "check", "options": ["오픈", "밸브"]},
        {"id": 10, "name": "게이트 수", "type": "checkbox", "options": ["1", "2", "3", "4", "5", "6"]},
        {"id": 11, "name": "게이트 위치 적정성", "type": "check", "options": ["반영", "미반영"]},
        {"id": 12, "name": "게이트 사이즈 확인", "type": "check", "options": ["확인", "미확인"]},
        {"id": 13, "name": "게이트 컷팅 형상 적정성", "type": "check", "options": ["캐비티", "오버랩"]},
        {"id": 14, "name": "이젝핀", "type": "check", "options": ["원형", "사각", "취출 불량 여부"]},
        {"id": 15, "name": "노즐·게이트 금형 각인", "type": "check", "options": ["반영", "미반영"]},
        {"id": 16, "name": "냉각라인 위치·스케일 20mm 반영", "type": "check", "options": ["반영", "미반영"]},
        {"id": 17, "name": "온도센서 반영", "type": "check", "options": ["반영", "미반영"]},
        {"id": 18, "name": "온도센서 수(캐비티/코어)", "type": "text"},
        {"id": 19, "name": "금형 스페어 리스트 접수(소급부 아이템)", "type": "date", "checkOptions": ["반영", "미반영"]},
        {"id": 20, "name": "금형 인자표 초도 T/O일정 접수", "type": "date", "checkOptions": ["반영", "미반영"]},
        {"id": 21, "name": "금형 정보 접수(사이즈·톤수·캐비티 수·형체력)", "type": "date", "checkOptions": ["반영", "미반영"]},
        {"id": 22, "name": "금형 정보 전산 등록", "type": "date", "checkOptions": ["완료", "미완료"]},
        {"id": 23, "name": "금형 외관 도색 상태", "type": "date", "checkOptions": ["양호", "불량"]},
        {"id": 24, "name": "금형 명판 부착", "type": "date", "checkOptions": ["부착", "미부착"]},
        {"id": 25, "name": "금형 캘린더 및 재질 각인", "type": "date", "checkOptions": ["반영", "미반영"]},
        {"id": 26, "name": "파팅 구조 적정성(찍힘/손상/버 발생 가능)", "type": "check", "options": ["양호", "불량"]},
        {"id": 27, "name": "내구성 확인(측면 습합 등 금형 크랙 여부)", "type": "check", "options": ["양호", "불량"]},
        {"id": 28, "name": "소프트 게이트 적용", "type": "check", "options": ["적용", "미적용"]},
        {"id": 29, "name": "콜드 슬러그 반영", "type": "check", "options": ["반영", "미반영"]},
        {"id": 30, "name": "기타 특이사항 1", "type": "text"},
        {"id": 31, "name": "기타 특이사항 2", "type": "text"},
        {"id": 32, "name": "기타 특이사항 3", "type": "text"},
        {"id": 33, "name": "기타 특이사항 4", "type": "text"},
        {"id": 34, "name": "기타 특이사항 5", "type": "text"}
      ]
    },
    {
      "id": "gas_vent",
      "title": "Ⅲ. 가스 빼기 (Gas Vent)",
      "items": [
        {"id": 1, "name": "가스 빼기 금형 전반 반영", "type": "check", "options": ["반영", "미반영"]},
        {"id": 2, "name": "가스 빼기 2/100 또는 3/100 반영", "type": "check", "options": ["반영", "미반영"]},
        {"id": 3, "name": "가스 빼기 피치간 거리 30mm 간격 유지", "type": "check", "options": ["반영", "미반영"]},
        {"id": 4, "name": "가스 빼기 폭 7mm 반영", "type": "check", "options": ["반영", "미반영"]},
        {"id": 5, "name": "가스 빼기 위치 적절성", "type": "check", "options": ["반영", "미반영"]},
        {"id": 6, "name": "가스 발생 예상 구간 추가 벤트 여부", "type": "check", "options": ["반영", "미반영"]}
      ]
    },
    {
      "id": "moldflow",
      "title": "Ⅳ. 성형 해석 (Moldflow 등)",
      "items": [
        {"id": 1, "name": "중 대물류 및 도금 아이템 성형 해석 실행", "type": "date", "checkOptions": ["실행", "미실행"]},
        {"id": 2, "name": "성형성 확인(미성형 발생부 확인)", "type": "check", "options": ["확인", "미확인"]},
        {"id": 3, "name": "변형발생 구조 확인(제품두께/날반구조 확인)", "type": "check", "options": ["반영", "미반영"]},
        {"id": 4, "name": "웰드라인 위치 확인", "type": "check", "options": ["확인", "미확인"]},
        {"id": 5, "name": "웰드라인 구조 형상 삭제 검토", "type": "check", "options": ["반영", "미반영"]},
        {"id": 6, "name": "가스 발생 부위 확인", "type": "check", "options": ["확인", "미확인"]}
      ]
    },
    {
      "id": "sink_mark",
      "title": "Ⅴ. 싱크마크 (Sink Mark)",
      "items": [
        {"id": 1, "name": "전체 리브 0.6t 반영", "type": "check", "options": ["반영", "미반영"]},
        {"id": 2, "name": "싱크 발생 구조(제품 두께 편차)", "type": "check", "options": ["반영", "미반영"]},
        {"id": 3, "name": "예각 부위 구조 확인(제품 살빼기 반영)", "type": "check", "options": ["반영", "미반영"]}
      ]
    },
    {
      "id": "ejection",
      "title": "Ⅵ. 취출 (Ejection)",
      "items": [
        {"id": 1, "name": "제품 취출 구조(범퍼 하단 매칭부)", "type": "check", "options": ["반영", "미반영"]},
        {"id": 2, "name": "제품 취출구조(범퍼 밀어치)", "type": "check", "options": ["반영", "미반영"]},
        {"id": 3, "name": "언더컷 구조 확인", "type": "check", "options": ["반영", "미반영"]},
        {"id": 4, "name": "빼기 구배 3~5도", "type": "check", "options": ["반영", "미반영"]},
        {"id": 5, "name": "제품 취출 구조(보스 구배)", "type": "check", "options": ["반영", "미반영"]},
        {"id": 6, "name": "제품 취출 구조(도그하우스 취출)", "type": "check", "options": ["반영", "미반영"]},
        {"id": 7, "name": "제품 취출 언더컷 위치 및 영보 확인", "type": "check", "options": ["반영", "미반영"]}
      ]
    },
    {
      "id": "mic",
      "title": "Ⅶ. MIC 제품 (MICA 스펙클 등)",
      "items": [
        {"id": 1, "name": "MIC 사양 게이트 형상 반영(고객사 제안 게이트)", "type": "check", "options": ["반영", "미반영"]},
        {"id": 2, "name": "성형해석 통한 제품 두께 반영", "type": "check", "options": ["반영", "미반영"]},
        {"id": 3, "name": "웰드라인 확인 및 도장 사양", "type": "check", "options": ["반영", "미반영"]},
        {"id": 4, "name": "A,B면 외관 플레이크 확인", "type": "check", "options": ["반영", "미반영"]}
      ]
    },
    {
      "id": "coating",
      "title": "Ⅷ. 도금 (Coating)",
      "items": [
        {"id": 1, "name": "게이트 위치/개수 최적화(ABS:250mm·PC+ABS:200m)", "type": "check", "options": ["반영", "미반영"]},
        {"id": 2, "name": "수축률", "type": "text", "suffix": "/1000"},
        {"id": 3, "name": "보스 조립부 엣지 1R 반영", "type": "check", "options": ["반영", "미반영"]},
        {"id": 4, "name": "보스 십자리브 R값 반영", "type": "check", "options": ["반영", "미반영"]},
        {"id": 5, "name": "보스 내경(M4=3.6, M5=4.6 등)", "type": "check", "options": ["반영", "미반영"]},
        {"id": 6, "name": "액고임 방지구조", "type": "check", "options": ["반영", "미반영"]},
        {"id": 7, "name": "제품 두께 3.0t", "type": "check", "options": ["반영", "미반영"]},
        {"id": 8, "name": "도금성확보를 위한 제품각도 적절성", "type": "check", "options": ["반영", "미반영"]},
        {"id": 9, "name": "차폐막 형상 도면 반영", "type": "check", "options": ["반영", "미반영"]},
        {"id": 10, "name": "차폐막 컷팅 외곽 미노출", "type": "check", "options": ["반영", "미반영"]},
        {"id": 11, "name": "게이트 컷팅 외곽 미노출", "type": "check", "options": ["반영", "미반영"]},
        {"id": 12, "name": "TPO와 도금 스크류 조립홀 금형 도면 이원화", "type": "check", "options": ["반영", "미반영"]}
      ]
    },
    {
      "id": "rear_back_beam",
      "title": "Ⅸ. 리어 백빔 (Rear Back Beam)",
      "items": [
        {"id": 1, "name": "리어 백빔 금형구배 5도 이상", "type": "check", "options": ["반영", "미반영"]},
        {"id": 2, "name": "리어 백빔 제품 끝단부 두께 5.0t 이상", "type": "check", "options": ["반영", "미반영"]},
        {"id": 3, "name": "후가공 홀 각인 금형 반영", "type": "check", "options": ["반영", "미반영"]},
        {"id": 4, "name": "후가공 홀 판: 탭 타입", "type": "check", "options": ["반영", "미반영"]},
        {"id": 5, "name": "가이드핀 용접부 음각형상", "type": "check", "options": ["반영", "미반영"]},
        {"id": 6, "name": "가이드핀 위치 및 유동", "type": "check", "options": ["반영", "미반영"]}
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
