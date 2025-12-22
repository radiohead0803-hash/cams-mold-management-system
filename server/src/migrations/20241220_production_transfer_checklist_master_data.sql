-- 양산이관 체크리스트 마스터 데이터 (8개 카테고리, 53개 항목)
-- 기존 데이터 삭제 후 재삽입
DELETE FROM production_transfer_checklist_master;

-- 1. 금형기본정보 (6개 항목)
INSERT INTO production_transfer_checklist_master (category, item_code, item_name, description, is_required, requires_attachment, attachment_type, display_order, is_active) VALUES
('1.금형기본정보', 'B01', '금형코드 확인', '금형코드가 명판 및 시스템과 일치하는지 확인', true, false, NULL, 1, true),
('1.금형기본정보', 'B02', 'QR코드 부착 확인', 'QR코드가 정상 부착되어 있고 스캔 가능한지 확인', true, true, 'image', 2, true),
('1.금형기본정보', 'B03', '금형 명판 상태', '금형 명판이 부착되어 있고 정보가 정확한지 확인', true, true, 'image', 3, true),
('1.금형기본정보', 'B04', '금형사양서 확인', '금형사양서가 최신 버전인지 확인', true, true, 'document', 4, true),
('1.금형기본정보', 'B05', '캐비티 수량 확인', '캐비티 수량이 사양서와 일치하는지 확인', true, false, NULL, 5, true),
('1.금형기본정보', 'B06', '금형 중량 확인', '금형 중량이 사양서와 일치하는지 확인 (±5% 허용)', true, false, NULL, 6, true);

-- 2. 도면문서검증 (6개 항목)
INSERT INTO production_transfer_checklist_master (category, item_code, item_name, description, is_required, requires_attachment, attachment_type, display_order, is_active) VALUES
('2.도면문서검증', 'D01', '2D 도면 확인', '2D 도면이 최신 버전이고 EO 반영 여부 확인', true, true, 'document', 7, true),
('2.도면문서검증', 'D02', '3D 도면 확인', '3D 도면 데이터가 최신 버전인지 확인', true, true, 'document', 8, true),
('2.도면문서검증', 'D03', 'EO 반영 확인', '최신 EO(Engineering Order)가 반영되었는지 확인', true, true, 'document', 9, true),
('2.도면문서검증', 'D04', '성형조건서 확인', '성형조건서가 작성되어 있고 최신 버전인지 확인', true, true, 'document', 10, true),
('2.도면문서검증', 'D05', '승인 서명 확인', '관련 문서에 승인 서명이 완료되었는지 확인', true, true, 'document', 11, true),
('2.도면문서검증', 'D06', '변경이력 확인', '금형 변경이력이 정확히 기록되어 있는지 확인', true, false, NULL, 12, true);

-- 3. 치수정밀도검사 (10개 항목)
INSERT INTO production_transfer_checklist_master (category, item_code, item_name, description, is_required, requires_attachment, attachment_type, display_order, is_active) VALUES
('3.치수정밀도검사', 'M01', '주요 치수 측정', '주요 치수가 도면 공차 내에 있는지 측정', true, true, 'document', 13, true),
('3.치수정밀도검사', 'M02', '공차 적합성 확인', '모든 치수가 허용 공차 범위 내인지 확인', true, true, 'document', 14, true),
('3.치수정밀도검사', 'M03', '파팅라인 상태', '파팅라인 단차 및 버(Burr) 상태 확인', true, true, 'image', 15, true),
('3.치수정밀도검사', 'M04', '가스벤트 상태', '가스벤트 깊이 및 위치가 적정한지 확인', true, true, 'image', 16, true),
('3.치수정밀도검사', 'M05', '코어/캐비티 정밀도', '코어와 캐비티 정밀도가 규격 내인지 확인', true, true, 'document', 17, true),
('3.치수정밀도검사', 'M06', '슬라이드 정밀도', '슬라이드 동작 정밀도 확인', true, false, NULL, 18, true),
('3.치수정밀도검사', 'M07', '이젝터 핀 정밀도', '이젝터 핀 위치 및 동작 정밀도 확인', true, false, NULL, 19, true),
('3.치수정밀도검사', 'M08', '냉각채널 정밀도', '냉각채널 위치 및 직경 확인', true, true, 'image', 20, true),
('3.치수정밀도검사', 'M09', '게이트 치수 확인', '게이트 치수가 설계값과 일치하는지 확인', true, true, 'image', 21, true),
('3.치수정밀도검사', 'M10', '3차원 측정 결과', '3차원 측정기 측정 결과 첨부', true, true, 'document', 22, true);

-- 4. 성형면외관상태 (8개 항목)
INSERT INTO production_transfer_checklist_master (category, item_code, item_name, description, is_required, requires_attachment, attachment_type, display_order, is_active) VALUES
('4.성형면외관상태', 'A01', '표면 흠집 확인', '성형면에 흠집, 긁힘이 없는지 확인', true, true, 'image', 23, true),
('4.성형면외관상태', 'A02', 'EDM 가공면 상태', 'EDM 가공면 품질 상태 확인', true, true, 'image', 24, true),
('4.성형면외관상태', 'A03', '연마면 상태', '연마면 광택 및 품질 상태 확인', true, true, 'image', 25, true),
('4.성형면외관상태', 'A04', '오염 상태 확인', '성형면 오염, 탄화수지 부착 여부 확인', true, true, 'image', 26, true),
('4.성형면외관상태', 'A05', '냉각채널 청결도', '냉각채널 내부 청결 상태 확인', true, false, NULL, 27, true),
('4.성형면외관상태', 'A06', '러너/게이트 상태', '러너 및 게이트 마모 상태 확인', true, true, 'image', 28, true),
('4.성형면외관상태', 'A07', '녹/부식 상태', '녹 또는 부식 발생 여부 확인', true, true, 'image', 29, true),
('4.성형면외관상태', 'A08', '텍스처 상태', '텍스처(시보) 상태 확인 (해당 시)', false, true, 'image', 30, true);

-- 5. 성능기능점검 (8개 항목)
INSERT INTO production_transfer_checklist_master (category, item_code, item_name, description, is_required, requires_attachment, attachment_type, display_order, is_active) VALUES
('5.성능기능점검', 'F01', '냉각수 순환 확인', '냉각수 순환이 정상인지 확인 (누수 여부)', true, false, NULL, 31, true),
('5.성능기능점검', 'F02', '슬라이드 동작 확인', '슬라이드 동작이 원활한지 확인', true, false, NULL, 32, true),
('5.성능기능점검', 'F03', '이젝터 동작 확인', '이젝터 동작이 원활한지 확인', true, false, NULL, 33, true),
('5.성능기능점검', 'F04', '윤활 상태 확인', '각 작동부 윤활 상태 확인', true, false, NULL, 34, true),
('5.성능기능점검', 'F05', '온도 균일성 확인', '금형 온도 분포가 균일한지 확인', true, true, 'document', 35, true),
('5.성능기능점검', 'F06', '유압장치 동작', '유압장치 동작 및 누유 확인', true, false, NULL, 36, true),
('5.성능기능점검', 'F07', '히터 동작 확인', '히터 단선, 누전 여부 확인 (핫러너)', false, false, NULL, 37, true),
('5.성능기능점검', 'F08', '센서 동작 확인', '각종 센서 동작 상태 확인', true, false, NULL, 38, true),
('5.성능기능점검', 'F09', '볼트조림 식별 아이마킹', '볼트조림 식별을 위한 아이마킹 실시 여부 확인', true, true, 'image', 39, true);

-- 6. 금형안전성확인 (4개 항목)
INSERT INTO production_transfer_checklist_master (category, item_code, item_name, description, is_required, requires_attachment, attachment_type, display_order, is_active) VALUES
('6.금형안전성확인', 'S01', '클램프 상태 확인', '클램프 볼트 체결 상태 확인', true, true, 'image', 40, true),
('6.금형안전성확인', 'S02', '인양고리 상태', '인양고리 상태 및 안전성 확인', true, true, 'image', 41, true),
('6.금형안전성확인', 'S03', '센서 배선 상태', '센서 배선 정리 및 손상 여부 확인', true, true, 'image', 42, true),
('6.금형안전성확인', 'S04', '안전커버 상태', '안전커버 부착 및 상태 확인', true, true, 'image', 43, true);

-- 7. 시운전결과 (8개 항목)
INSERT INTO production_transfer_checklist_master (category, item_code, item_name, description, is_required, requires_attachment, attachment_type, display_order, is_active) VALUES
('7.시운전결과', 'T01', 'Shot 기록 확인', '시운전 Shot 수 및 기록 확인', true, true, 'document', 44, true),
('7.시운전결과', 'T02', '성형조건 기록', '최적 성형조건 기록 확인', true, true, 'document', 45, true),
('7.시운전결과', 'T03', 'NG 개선 확인', '시운전 중 발생한 NG 개선 여부 확인', true, true, 'document', 46, true),
('7.시운전결과', 'T04', '외관 PASS 확인', '제품 외관 품질 PASS 확인', true, true, 'image', 47, true),
('7.시운전결과', 'T05', '치수 PASS 확인', '제품 치수 품질 PASS 확인', true, true, 'document', 48, true),
('7.시운전결과', 'T06', '사이클타임 확인', '목표 사이클타임 달성 여부 확인', true, false, NULL, 49, true),
('7.시운전결과', 'T07', '연속 생산성 확인', '연속 생산 시 안정성 확인', true, false, NULL, 50, true),
('7.시운전결과', 'T08', '시운전 보고서', '시운전 결과 보고서 첨부', true, true, 'document', 51, true);

-- 8. 금형인계물류 (6개 항목)
INSERT INTO production_transfer_checklist_master (category, item_code, item_name, description, is_required, requires_attachment, attachment_type, display_order, is_active) VALUES
('8.금형인계물류', 'L01', '세척/방청 처리', '금형 세척 및 방청 처리 완료 확인', true, true, 'image', 52, true),
('8.금형인계물류', 'L02', '포장 상태 확인', '금형 포장 상태 확인 (운송 중 손상 방지)', true, true, 'image', 53, true),
('8.금형인계물류', 'L03', 'GPS 위치 기록', 'GPS 위치 정보 기록 확인', true, false, NULL, 54, true),
('8.금형인계물류', 'L04', 'QR 스캔 기록', 'QR 스캔을 통한 이관 기록 확인', true, false, NULL, 55, true),
('8.금형인계물류', 'L05', '인수자 서명', '인수자 서명 확인', true, true, 'image', 56, true),
('8.금형인계물류', 'L06', '인계자 서명', '인계자 서명 확인', true, true, 'image', 57, true);

-- 결과 확인
SELECT category, COUNT(*) as item_count FROM production_transfer_checklist_master GROUP BY category ORDER BY category;
SELECT '총 항목 수: ' || COUNT(*) as total FROM production_transfer_checklist_master;
