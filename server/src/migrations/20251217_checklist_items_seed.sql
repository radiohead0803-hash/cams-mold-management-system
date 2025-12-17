-- 체크리스트 마스터 항목 시드 데이터
-- 일상점검 / 정기점검(20K/50K/80K/100K) / 습합 / 세척 항목 통합
-- 2025-12-17

-- 기존 데이터 삭제 (중복 방지)
DELETE FROM checklist_items_master WHERE id > 0;

-- =====================================================
-- 1. 일상점검 항목 (DAILY)
-- =====================================================

-- 1.1 정결관리
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('정결관리', '성형물 청결', '캐비티, 코어, 파팅면, 게이트, 벤트부 이물(수지, 가스, 오일 등) 확인', '육안 검사 및 촉감 확인', true, 1),
('정결관리', '파팅면 상태', '파팅면이 수지간섭, 찌꺼기 등 無', '육안 검사', false, 2);

-- 1.2 작동부 점검
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('작동부 점검', '슬라이드 작동상태', '슬라이드 이동 시 걸림/이상음 無', '수동 작동 테스트', false, 3),
('작동부 점검', '가이드핀/리테이너', '핀손, 마모, 운동상태 확인', '육안 검사 및 작동 확인', false, 4),
('작동부 점검', '밀핀/제품핀', '작동 시 걸림, 파손, 변형 無', '수동 작동 테스트', false, 5);

-- 1.3 냉각관리
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('냉각관리', '냉각라인 상태', '입출수 라인 연결불 누수/막힘 無', '육안 검사 및 압력 테스트', true, 6),
('냉각관리', '냉각수 유량', '적/우 온도차 5℃ 이하', '온도계 측정', false, 7);

-- 1.4 온도·전기·계통
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('온도·전기·계통', '히터/온도센서 작동', '단선, 접촉불량, 과열 無', '테스터기 측정', false, 8),
('온도·전기·계통', '배선/커넥터', '피복 손상, 접촉불량 無', '육안 검사', false, 9);

-- 1.5 체결상태
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('체결상태', '금형 체결볼트', '풀림, 균열, 아이마킹 틀어짐 유무 無', '토크렌치 확인', false, 10),
('체결상태', '로케이트링/스프루부', '위치이탈, 손상 無', '육안 검사', false, 11);

-- 1.6 취출계통
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('취출계통', '취출핀/스프링', '정상작동, 파손·마모 無', '수동 작동 테스트', false, 12);

-- 1.7 윤활관리
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('윤활관리', '슬라이드/핀류 윤활', '그리스 도포 상태 양호', '육안 검사', false, 13),
('윤활관리', '엘글라/리프트핀 윤활', '그리스 도포 상태 양호', '육안 검사', false, 14);

-- 1.8 이상유무
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('이상유무', '누유/누수 여부', '냉각수, 오일, 에어라인 이상 無', '육안 검사', true, 15);

-- 1.9 외관상태
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('외관상태', '금형 외관/명판', '찌손, 식별불가 無', '육안 검사', false, 16);

-- 1.10 방청관리
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('방청관리', '방청유 도포', '보관 시 성형면 방청처리', '육안 검사', false, 17);

-- =====================================================
-- 2. 정기점검 추가 항목 (20K/50K/80K/100K)
-- =====================================================

-- 2.1 파팅면/성형면 (20K+)
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('파팅면/성형면', '파팅면 단차', '파팅면 단차 ±0.02mm 이내', '마이크로미터 측정', true, 20),
('파팅면/성형면', '성형면 손상', '성형면 손상/표면 이상 여부', '육안 검사', true, 21);

-- 2.2 벤트/게이트 (20K+)
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('벤트/게이트', '벤트홀 막힘', '벤트홀 막힘 여부 확인', '에어건 테스트', false, 22),
('벤트/게이트', '게이트 청결', '게이트 청결 상태', '육안 검사', false, 23),
('벤트/게이트', '게이트 마모', '0.03mm 이상 마모시 재가공 필요', '마이크로미터 측정', false, 24);

-- 2.3 습합(접합) (20K+)
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('습합점검', '금형 간극', '금형 간극 ±0.02mm 이내 유지', '틈새게이지 측정', true, 25),
('습합점검', '단차 확인', '접합 단차 상태 확인', '마이크로미터 측정', false, 26),
('습합점검', '접합 정렬', '접합 정렬 상태 확인', '육안 검사', false, 27);

-- 2.4 냉각/유압 연결부 (20K+)
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('냉각/유압', '조인트 상태', '조인트 누유/누수 여부', '육안 검사', false, 28),
('냉각/유압', '커넥터 상태', '커넥터 손상 여부', '육안 검사', false, 29),
('냉각/유압', '호스 상태', '호스 균열/노화 여부', '육안 검사', false, 30);

-- 2.5 가이드핀/리테이너 (50K+)
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('가이드핀/리테이너', '가이드핀 마모', '마모/유격 ±0.02mm 이내', '마이크로미터 측정', false, 31),
('가이드핀/리테이너', '리테이너 상태', '변형·이상음 없음', '작동 테스트', false, 32);

-- 2.6 리프트핀/엘글라 (50K+)
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('리프트핀/엘글라', '리프트핀 마모', '마모/유격 확인', '마이크로미터 측정', false, 33),
('리프트핀/엘글라', '엘글라 상태', '작동 상태 확인', '작동 테스트', false, 34);

-- 2.7 냉각라인 유량/온도 (50K+)
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('냉각라인', '유량 저하/막힘', '냉각수 유량 저하 또는 막힘 확인', '유량계 측정', false, 35),
('냉각라인', '온도 편차', '온도 편차 ±10% 이내', '온도계 측정', false, 36);

-- 2.8 히터/센서/배선 (50K+)
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('히터/센서', '히터 저항', '히터 저항 ±10% 이내', '테스터기 측정', false, 37),
('히터/센서', '온도센서 상태', '온도센서 손상·접촉불량 확인', '테스터기 측정', false, 38),
('히터/센서', '배선 상태', '배선 손상·이상 징후 확인', '육안 검사', false, 39);

-- 2.9 표면처리(코팅/크롬층) (50K+)
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('표면처리', '코팅 박리', '코팅 박리 여부 확인', '육안 검사', true, 40),
('표면처리', '크롬층 상태', '크롬층 불균일, 변색 확인', '육안 검사', true, 41);

-- 2.10 취출핀/볼트너트 (50K+)
INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('취출핀/볼트', '취출핀 마모', '핀 마모·손상 여부', '마이크로미터 측정', false, 42),
('취출핀/볼트', '볼트너트 상태', '볼트너트 작동 상태', '토크렌치 확인', false, 43);

-- =====================================================
-- 3. 80K 추가 항목 (청소/습합 집중)
-- =====================================================

INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('세척점검', '금형 외곽 세척', '금형 외곽 세척 상태', '육안 검사', true, 50),
('세척점검', '코어/캐비티 이물', '코어/캐비티 내 이물 제거 상태', '육안 검사', true, 51),
('세척점검', '런너/가이드 클리닝', '런너/가이드 클리닝 상태', '육안 검사', false, 52),
('세척점검', '벤트·게이트 세척', '벤트·게이트 세척 상태', '육안 검사', false, 53),
('세척점검', '세척제 사용', '사용 세척제 및 희석 비율 기록', '기록 확인', false, 54);

-- =====================================================
-- 4. 100K 추가 항목
-- =====================================================

INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('냉각계통', '냉각라인 스케일', '스케일 제거 및 이물 세척', '육안 검사', true, 60),
('냉각계통', '냉각수 흐름', '냉각수 흐름 확보 상태', '유량계 측정', false, 61),
('치수확인', '표준치수 확인', '도면 대비 편차 ±0.05mm 이내', '마이크로미터 측정', false, 62),
('치수확인', '인서트 치수', '인서트 정렬 및 치수 확인', '마이크로미터 측정', false, 63),
('배선점검', '배선 절연', '배선 절연 손상 체크', '절연저항계 측정', false, 64),
('마모분석', '마모 예측', '마모 예측치 및 교체 시점 산정', '측정 데이터 분석', false, 65);

-- =====================================================
-- 5. 습합점검 전용 항목
-- =====================================================

INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('습합점검', '슬라이드 간극', '슬라이드 간극 상태 확인', '틈새게이지 측정', true, 70),
('습합점검', '리프터 간극', '리프터 간극 상태 확인', '틈새게이지 측정', false, 71),
('습합점검', '릴리즈 림 간극', '릴리즈 림 간극 상태', '틈새게이지 측정', false, 72),
('습합점검', '접촉상태', '습합 접촉 상태 확인', '블루잉 테스트', true, 73),
('습합점검', '가이드핀 정렬', '가이드핀 기준 수평각 ±0.02mm', '다이얼게이지 측정', false, 74);

-- =====================================================
-- 6. 세척점검 전용 항목
-- =====================================================

INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('세척점검', '전체 세척', '금형 전체 세척 상태', '육안 검사', true, 80),
('세척점검', '방청유 도포', '방청유 도포 상태', '육안 검사', false, 81),
('세척점검', '마모 부위 집중', '마모 부위 집중 점검', '육안 검사', true, 82),
('세척점검', '세척 방법', '드라이아이스/초음파/케미컬 등 기록', '기록 확인', false, 83),
('세척점검', '세척 완료 확인', '세척 완료 시간/담당자 기록', '기록 확인', false, 84);

-- =====================================================
-- 7. 정기점검 결과 항목
-- =====================================================

INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order) VALUES
('점검결과', '종합 상태', '양호/정비필요/수리필요 판정', '종합 판단', false, 90),
('점검결과', '정비 요청', '정비 요청 사항 기록', '기록 확인', false, 91),
('점검결과', '수리 요청', '수리 요청 사항 기록', '기록 확인', false, 92);

-- =====================================================
-- 8. 기본 마스터 버전 생성 (배포 상태)
-- =====================================================

INSERT INTO checklist_master_versions (name, description, status, version, target_type, is_current_deployed, deployed_at) VALUES
('금형점검 체크리스트 v1.0', '일상점검/정기점검/습합/세척 통합 체크리스트', 'deployed', 1, 'all', true, NOW());

-- 버전-항목 매핑 (전체 항목 포함)
INSERT INTO checklist_version_item_maps (checklist_version_id, item_id, is_required, sort_order)
SELECT 
  (SELECT id FROM checklist_master_versions WHERE name = '금형점검 체크리스트 v1.0'),
  id,
  true,
  sort_order
FROM checklist_items_master;

-- 항목-주기 매핑 (일상점검 항목 - DAILY)
INSERT INTO checklist_item_cycle_maps (checklist_version_id, item_id, cycle_code_id, is_enabled)
SELECT 
  (SELECT id FROM checklist_master_versions WHERE name = '금형점검 체크리스트 v1.0'),
  id,
  (SELECT id FROM checklist_cycle_codes WHERE label = 'DAILY'),
  true
FROM checklist_items_master
WHERE sort_order <= 17;

-- 항목-주기 매핑 (20K 항목)
INSERT INTO checklist_item_cycle_maps (checklist_version_id, item_id, cycle_code_id, is_enabled)
SELECT 
  (SELECT id FROM checklist_master_versions WHERE name = '금형점검 체크리스트 v1.0'),
  id,
  (SELECT id FROM checklist_cycle_codes WHERE label = '20000'),
  true
FROM checklist_items_master
WHERE sort_order <= 30;

-- 항목-주기 매핑 (50K 항목)
INSERT INTO checklist_item_cycle_maps (checklist_version_id, item_id, cycle_code_id, is_enabled)
SELECT 
  (SELECT id FROM checklist_master_versions WHERE name = '금형점검 체크리스트 v1.0'),
  id,
  (SELECT id FROM checklist_cycle_codes WHERE label = '50000'),
  true
FROM checklist_items_master
WHERE sort_order <= 45;

-- 항목-주기 매핑 (80K 항목)
INSERT INTO checklist_item_cycle_maps (checklist_version_id, item_id, cycle_code_id, is_enabled)
SELECT 
  (SELECT id FROM checklist_master_versions WHERE name = '금형점검 체크리스트 v1.0'),
  id,
  (SELECT id FROM checklist_cycle_codes WHERE label = '80000'),
  true
FROM checklist_items_master
WHERE sort_order <= 55;

-- 항목-주기 매핑 (100K 항목 - 전체)
INSERT INTO checklist_item_cycle_maps (checklist_version_id, item_id, cycle_code_id, is_enabled)
SELECT 
  (SELECT id FROM checklist_master_versions WHERE name = '금형점검 체크리스트 v1.0'),
  id,
  (SELECT id FROM checklist_cycle_codes WHERE label = '100000'),
  true
FROM checklist_items_master;

COMMENT ON TABLE checklist_items_master IS '점검항목 마스터 - 일상/정기/습합/세척 통합 (총 55개 항목)';
