-- 이관 체크리스트 항목 확장 (2024-12-18)
-- 사진 첨부, 가이드 정보, 점검 포인트 필드 추가

-- 마스터 테이블에 가이드 정보 추가
ALTER TABLE production_transfer_checklist_master
ADD COLUMN IF NOT EXISTS guide_description TEXT,
ADD COLUMN IF NOT EXISTS check_points TEXT[],
ADD COLUMN IF NOT EXISTS guide_video_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS guide_image_url VARCHAR(500);

-- 체크리스트 아이템 테이블에 다중 사진 지원
ALTER TABLE production_transfer_checklist_items
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS photo_count INTEGER DEFAULT 0;

-- 코멘트 추가
COMMENT ON COLUMN production_transfer_checklist_master.guide_description IS '가이드 상세 설명';
COMMENT ON COLUMN production_transfer_checklist_master.check_points IS '점검 포인트 목록';
COMMENT ON COLUMN production_transfer_checklist_master.guide_video_url IS '가이드 동영상 URL';
COMMENT ON COLUMN production_transfer_checklist_master.guide_image_url IS '가이드 이미지 URL';
COMMENT ON COLUMN production_transfer_checklist_items.photos IS '첨부 사진 목록 (JSON 배열)';
COMMENT ON COLUMN production_transfer_checklist_items.photo_count IS '첨부 사진 개수';

-- 기존 마스터 데이터에 가이드 정보 업데이트
UPDATE production_transfer_checklist_master SET
  guide_description = '제품 BURR 발생부의 습합 상태를 확인합니다',
  check_points = ARRAY['BURR 발생 위치 확인', '습합 개소 상태 점검', '필요시 수정 작업 진행']
WHERE item_name = '제품 BURR';

UPDATE production_transfer_checklist_master SET
  guide_description = 'EYE BOLT 체결부의 피치 마모 및 밀착상태를 확인합니다',
  check_points = ARRAY['피치 마모 상태 확인', '밀착 상태 점검', '체결 토크 확인']
WHERE item_name = 'EYE BOLT 체결부';

UPDATE production_transfer_checklist_master SET
  guide_description = '상,하 고정판의 이물 및 녹 오염상태를 확인합니다',
  check_points = ARRAY['이물질 부착 여부 확인', '녹 발생 상태 점검', '오염 정도 확인']
WHERE item_name = '상,하 고정판 확인';

UPDATE production_transfer_checklist_master SET
  guide_description = '냉각호스 정리 및 오염상태를 확인합니다',
  check_points = ARRAY['냉각호스 연결 상태 확인', '호스 정리 상태 점검', '오염 및 누수 확인']
WHERE item_name = '냉각상태';

UPDATE production_transfer_checklist_master SET
  guide_description = '표면 흠 및 녹 발생상태를 확인합니다',
  check_points = ARRAY['표면 흠집 유무 확인', '녹 발생 여부 점검', '손상 정도 기록']
WHERE item_name = '표면 흠집,녹';

UPDATE production_transfer_checklist_master SET
  guide_description = '파팅면 오염 및 탄화수지 상태를 확인합니다',
  check_points = ARRAY['파팅면 오염 상태 확인', '탄화수지 부착 여부 점검', '청소 필요 여부 판단']
WHERE item_name = '파팅면 오염,탄화';

UPDATE production_transfer_checklist_master SET
  guide_description = '파팅면 끝단을 손으로 접촉하여 BURR 상태를 확인합니다',
  check_points = ARRAY['파팅면 끝단 상태 확인', 'BURR 발생 여부 점검', '손으로 접촉 시 이상 유무']
WHERE item_name = '파팅면 BURR';

UPDATE production_transfer_checklist_master SET
  guide_description = '코어류 분해 후 긁힘 상태 및 이물을 확인합니다',
  check_points = ARRAY['코어 분해 상태 확인', '긁힘 및 손상 점검', '이물질 유무 확인']
WHERE item_name = '코어류 분해청소';

UPDATE production_transfer_checklist_master SET
  guide_description = '작동부 마모상태를 점검합니다',
  check_points = ARRAY['작동부 마모 정도 확인', '교체 필요 여부 판단', '마모 패턴 기록']
WHERE item_name = '마모';

UPDATE production_transfer_checklist_master SET
  guide_description = '작동유 윤활상태를 확인합니다',
  check_points = ARRAY['윤활유 상태 확인', '윤활 부족 여부 점검', '보충 필요 여부 판단']
WHERE item_name = '작동유 윤활유';

UPDATE production_transfer_checklist_master SET
  guide_description = '유압 배관 파손 및 누유 상태를 확인합니다',
  check_points = ARRAY['배관 파손 여부 확인', '누유 발생 위치 점검', '수리 필요 여부 판단']
WHERE item_name = '작동유 누유';

UPDATE production_transfer_checklist_master SET
  guide_description = '호스 및 배선 정돈상태를 확인합니다',
  check_points = ARRAY['호스 정리 상태 확인', '배선 정돈 여부 점검', '꼬임 및 손상 확인']
WHERE item_name = '호스 및 배선정리';

UPDATE production_transfer_checklist_master SET
  guide_description = '히터단선 및 누전 상태를 테스터기로 확인합니다',
  check_points = ARRAY['히터 단선 여부 확인', '누전 테스트 진행', '저항값 측정 기록']
WHERE item_name = '히터단선 누전';

UPDATE production_transfer_checklist_master SET
  guide_description = '수지 넘침 상태를 확인합니다',
  check_points = ARRAY['수지 누출 위치 확인', '넘침 정도 점검', '청소 필요 여부 판단']
WHERE item_name = '수지 누출';

SELECT '이관 체크리스트 확장 완료 (2024-12-18)' as result;
