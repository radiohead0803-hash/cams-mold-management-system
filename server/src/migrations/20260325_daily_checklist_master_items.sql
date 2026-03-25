-- =============================================
-- 일상점검 마스터 항목 데이터 보강
-- DailyChecklistNew.jsx 하드코딩 항목 → DB 마스터화
-- 기존 샘플 10개 → 완전한 25개 항목으로 확장
-- =============================================

-- check_points JSONB 컬럼 추가 (점검포인트 배열)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_items_master' AND column_name = 'check_points'
  ) THEN
    ALTER TABLE checklist_items_master ADD COLUMN check_points JSONB DEFAULT '[]';
    COMMENT ON COLUMN checklist_items_master.check_points IS '점검 포인트 배열 (가이드용)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_items_master' AND column_name = 'is_required'
  ) THEN
    ALTER TABLE checklist_items_master ADD COLUMN is_required BOOLEAN DEFAULT TRUE;
    COMMENT ON COLUMN checklist_items_master.is_required IS '필수 점검 항목 여부';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_items_master' AND column_name = 'field_type'
  ) THEN
    ALTER TABLE checklist_items_master ADD COLUMN field_type VARCHAR(30) DEFAULT 'yes_no';
    COMMENT ON COLUMN checklist_items_master.field_type IS '입력 필드 유형: yes_no, number, text, select';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_items_master' AND column_name = 'inspection_type'
  ) THEN
    ALTER TABLE checklist_items_master ADD COLUMN inspection_type VARCHAR(30) DEFAULT 'daily';
    COMMENT ON COLUMN checklist_items_master.inspection_type IS '점검 유형: daily, periodic, all';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_items_master' AND column_name = 'category_icon'
  ) THEN
    ALTER TABLE checklist_items_master ADD COLUMN category_icon VARCHAR(10);
    COMMENT ON COLUMN checklist_items_master.category_icon IS '카테고리 아이콘 (이모지)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_items_master' AND column_name = 'extra_config'
  ) THEN
    ALTER TABLE checklist_items_master ADD COLUMN extra_config JSONB DEFAULT '{}';
    COMMENT ON COLUMN checklist_items_master.extra_config IS '추가 설정 (isShotLinked 등)';
  END IF;
END $$;

-- 기존 데이터 삭제 후 전체 재삽입 (일상점검 전용)
DELETE FROM checklist_items_master 
WHERE inspection_type = 'daily' OR inspection_type IS NULL;

-- 일상점검 마스터 항목 (10개 카테고리, 25개 항목)
INSERT INTO checklist_items_master 
  (major_category, category_icon, item_name, description, check_method, check_points, is_required, field_type, required_photo, sort_order, inspection_type, is_active) 
VALUES
  -- 1. 금형 외관 점검 (3항목)
  ('금형 외관 점검', '🔍', '금형 외관 상태', '금형 외관의 손상, 변형, 부식 여부 확인', '육안 검사 및 촉감 확인',
   '["금형 표면 스크래치 확인", "찌그러짐/변형 여부", "녹/부식 발생 여부", "외관 청결 상태"]',
   TRUE, 'yes_no', TRUE, 101, 'daily', TRUE),
  ('금형 외관 점검', '🔍', '금형 명판 상태', '명판 식별 가능 여부 확인', 'QR코드 스캔 및 육안 확인',
   '["금형 번호 식별 가능", "제작일자 확인 가능", "명판 손상 여부"]',
   TRUE, 'yes_no', FALSE, 102, 'daily', TRUE),
  ('금형 외관 점검', '🔍', '파팅라인 상태', '파팅라인 밀착 상태 및 버 발생 여부', '육안 검사',
   '["상/하형 접합부 밀착도", "버(Burr) 발생 여부", "수지 간섭 흔적 확인", "찌꺼기 제거 상태"]',
   TRUE, 'yes_no', FALSE, 103, 'daily', TRUE),

  -- 2. 냉각 시스템 (3항목)
  ('냉각 시스템', '💧', '냉각수 연결 상태', '냉각수 라인 연결 및 누수 여부', '육안 검사 및 압력 테스트',
   '["입/출구 호스 연결 상태", "누수 여부 확인", "커플링 체결 상태"]',
   TRUE, 'yes_no', TRUE, 201, 'daily', TRUE),
  ('냉각 시스템', '💧', '냉각수 유량', '냉각수 흐름 원활 여부 (온도차 5℃ 이하)', '온도 측정',
   '["입구 온도 측정", "출구 온도 측정", "온도차 5℃ 이하 확인", "유량 정상 여부"]',
   TRUE, 'yes_no', FALSE, 202, 'daily', TRUE),
  ('냉각 시스템', '💧', '냉각 채널 막힘', '냉각 채널 스케일/이물질 막힘', '압력 테스트 및 유량 확인',
   '["채널 막힘 여부", "스케일 축적 상태", "냉각 효율 저하 여부"]',
   FALSE, 'yes_no', FALSE, 203, 'daily', TRUE),

  -- 3. 작동부 점검 (5항목)
  ('작동부 점검', '⚙️', '이젝터 작동 상태', '이젝터 핀 작동 원활성', '수동 작동 테스트',
   '["이젝터 핀 걸림 없음", "부드러운 작동 확인", "복귀 동작 정상"]',
   TRUE, 'yes_no', FALSE, 301, 'daily', TRUE),
  ('작동부 점검', '⚙️', '슬라이드 작동 상태', '슬라이드 코어 작동 상태', '수동 작동 테스트',
   '["슬라이드 이동 시 걸림 확인", "이상음 발생 여부", "작동 속도 정상 여부"]',
   FALSE, 'yes_no', FALSE, 302, 'daily', TRUE),
  ('작동부 점검', '⚙️', '가이드 핀/부시 상태', '가이드 핀 마모 및 유격', '촉감 확인 및 육안 검사',
   '["가이드핀 손상 확인", "마모 상태 점검", "유격 정상 여부"]',
   TRUE, 'yes_no', FALSE, 303, 'daily', TRUE),
  ('작동부 점검', '⚙️', '밀핀/제품핀', '작동 시 걸림, 파손, 변형 無', '수동 작동 테스트',
   '["밀핀 작동 확인", "파손 여부 점검", "변형 상태 확인"]',
   TRUE, 'yes_no', FALSE, 304, 'daily', TRUE),
  ('작동부 점검', '⚙️', '리턴 핀/스프링', '리턴 핀 작동 및 스프링 탄성', '수동 작동 테스트',
   '["리턴 핀 복귀 동작", "스프링 탄성 상태", "정상 작동 확인"]',
   TRUE, 'yes_no', FALSE, 305, 'daily', TRUE),

  -- 4. 게이트/런너/벤트 (3항목)
  ('게이트/런너/벤트', '🔄', '게이트 상태', '게이트 마모 및 손상 여부', '육안 검사',
   '["게이트 마모 확인", "변형/손상 여부", "막힘 상태 점검"]',
   TRUE, 'yes_no', FALSE, 401, 'daily', TRUE),
  ('게이트/런너/벤트', '🔄', '런너 상태', '런너 청결 및 막힘 여부', '육안 검사',
   '["잔류 수지 확인", "이물질 여부", "청결 상태"]',
   TRUE, 'yes_no', FALSE, 402, 'daily', TRUE),
  ('게이트/런너/벤트', '🔄', '벤트 상태', '가스 벤트 막힘 여부', '육안 검사 및 기능 테스트',
   '["벤트 구멍 막힘 확인", "가스 배출 원활성", "이물질 제거 상태"]',
   TRUE, 'yes_no', FALSE, 403, 'daily', TRUE),

  -- 5. 히터/센서/전기 (2항목)
  ('히터/센서/전기', '🌡️', '히터/온도센서 상태', '히터 작동 및 센서 정상 여부', '작동 테스트 및 저항 측정',
   '["히터 작동 확인", "온도센서 정상 작동", "과열 여부 점검", "단선/접촉불량 확인"]',
   FALSE, 'yes_no', FALSE, 501, 'daily', TRUE),
  ('히터/센서/전기', '🌡️', '배선/커넥터 상태', '전기 배선 손상 여부', '육안 검사',
   '["배선 피복 상태", "커넥터 접촉 상태", "단선 여부 확인"]',
   FALSE, 'yes_no', FALSE, 502, 'daily', TRUE),

  -- 6. 체결/취출 계통 (3항목)
  ('체결/취출 계통', '🔧', '금형 체결볼트', '풀림, 균열, 아이마킹 상태', '토크렌치 및 육안 확인',
   '["볼트 풀림 확인", "균열 발생 여부", "아이마킹 상태"]',
   TRUE, 'yes_no', FALSE, 601, 'daily', TRUE),
  ('체결/취출 계통', '🔧', '로케이트링/스프루부', '위치이탈, 손상 無', '육안 검사',
   '["로케이트링 위치", "스프루부 손상 여부", "고정 상태 확인"]',
   TRUE, 'yes_no', FALSE, 602, 'daily', TRUE),
  ('체결/취출 계통', '🔧', '취출핀/스프링', '정상작동, 파손·마모 無', '수동 작동 테스트',
   '["취출핀 작동 확인", "스프링 탄성 상태", "파손/마모 여부"]',
   TRUE, 'yes_no', FALSE, 603, 'daily', TRUE),

  -- 7. 윤활/청결 관리 (3항목)
  ('윤활/청결 관리', '🧴', '슬라이드/핀류 윤활', '그리스 도포 상태 양호', '촉감 확인',
   '["슬라이드 그리스 상태", "핀류 윤활 상태", "그리스 도포량 적정"]',
   TRUE, 'yes_no', FALSE, 701, 'daily', TRUE),
  ('윤활/청결 관리', '🧴', '엘글라/리프트핀 윤활', '그리스 도포 상태 양호', '촉감 확인',
   '["엘글라 그리스 상태", "리프트핀 윤활 상태", "도포 상태 확인"]',
   TRUE, 'yes_no', FALSE, 702, 'daily', TRUE),
  ('윤활/청결 관리', '🧴', '성형면 청결', '캐비티/코어 이물질 제거', '육안 검사',
   '["캐비티 표면 수지 잔류 확인", "코어 청결 상태", "이물질 제거 완료"]',
   TRUE, 'yes_no', FALSE, 703, 'daily', TRUE),

  -- 8. 이상/누출 점검 (1항목)
  ('이상/누출 점검', '⚠️', '누유/누수 여부', '냉각수, 오일, 에어라인 이상 無', '육안 검사 및 압력 확인',
   '["냉각수 누수 확인", "오일 누유 확인", "에어라인 이상 확인"]',
   TRUE, 'yes_no', TRUE, 801, 'daily', TRUE),

  -- 9. 방청 관리 (1항목)
  ('방청 관리', '🛡️', '방청유 도포', '보관 시 성형면 방청처리 (비가동 시)', '육안 검사',
   '["방청유 도포 상태", "성형면 처리 확인", "보관 환경 적정"]',
   FALSE, 'yes_no', FALSE, 901, 'daily', TRUE),

  -- 10. 생산 정보 (1항목) - 숫자 입력 필드
  ('생산 정보', '📊', '생산수량', '금일 생산수량 입력 (숏수 자동 누적)', '수량 입력',
   '["생산수량 정확히 입력", "숏수 자동 누적 확인", "보증숏수 90% 도달 시 경고", "100% 도달 시 긴급 알림"]',
   FALSE, 'number', FALSE, 1001, 'daily', TRUE);

-- inspection_type 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_checklist_items_master_inspection_type 
  ON checklist_items_master(inspection_type);
CREATE INDEX IF NOT EXISTS idx_checklist_items_master_type_category 
  ON checklist_items_master(inspection_type, major_category, sort_order);
