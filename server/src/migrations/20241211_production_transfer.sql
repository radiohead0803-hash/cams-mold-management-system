-- 양산이관 체크리스트 마스터 테이블
CREATE TABLE IF NOT EXISTS production_transfer_checklist_master (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  item_code VARCHAR(50) NOT NULL,
  item_name VARCHAR(200) NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT TRUE,
  requires_attachment BOOLEAN DEFAULT FALSE,
  attachment_type VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfer_checklist_master_category ON production_transfer_checklist_master(category);
CREATE INDEX IF NOT EXISTS idx_transfer_checklist_master_active ON production_transfer_checklist_master(is_active);

-- 양산이관 신청 테이블 (다단계 승인)
CREATE TABLE IF NOT EXISTS production_transfer_requests (
  id SERIAL PRIMARY KEY,
  request_number VARCHAR(50) UNIQUE NOT NULL,
  mold_id INTEGER REFERENCES molds(id),
  mold_spec_id INTEGER REFERENCES mold_specifications(id),
  from_maker_id INTEGER REFERENCES users(id),
  to_plant_id INTEGER REFERENCES users(id),
  requested_date DATE NOT NULL,
  planned_transfer_date DATE,
  actual_transfer_date DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  current_approval_step INTEGER DEFAULT 0,
  
  -- 1차 승인 (생산처)
  plant_approved_by INTEGER REFERENCES users(id),
  plant_approved_at TIMESTAMP WITH TIME ZONE,
  plant_approval_status VARCHAR(20),
  plant_rejection_reason TEXT,
  
  -- 2차 승인 (본사 품질팀)
  quality_approved_by INTEGER REFERENCES users(id),
  quality_approved_at TIMESTAMP WITH TIME ZONE,
  quality_approval_status VARCHAR(20),
  quality_rejection_reason TEXT,
  
  -- 3차 최종 승인 (금형개발 담당)
  final_approved_by INTEGER REFERENCES users(id),
  final_approved_at TIMESTAMP WITH TIME ZONE,
  final_approval_status VARCHAR(20),
  final_rejection_reason TEXT,
  
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfer_requests_mold ON production_transfer_requests(mold_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_status ON production_transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_date ON production_transfer_requests(requested_date);

-- 양산이관 체크리스트 항목 테이블
CREATE TABLE IF NOT EXISTS production_transfer_checklist_items (
  id SERIAL PRIMARY KEY,
  transfer_request_id INTEGER NOT NULL REFERENCES production_transfer_requests(id),
  master_item_id INTEGER NOT NULL REFERENCES production_transfer_checklist_master(id),
  is_checked BOOLEAN DEFAULT FALSE,
  check_result VARCHAR(20),
  check_value TEXT,
  remarks TEXT,
  attachment_url TEXT,
  attachment_filename VARCHAR(255),
  checked_by INTEGER REFERENCES users(id),
  checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfer_checklist_items_request ON production_transfer_checklist_items(transfer_request_id);
CREATE INDEX IF NOT EXISTS idx_transfer_checklist_items_master ON production_transfer_checklist_items(master_item_id);

-- 양산이관 승인 이력 테이블
CREATE TABLE IF NOT EXISTS production_transfer_approvals (
  id SERIAL PRIMARY KEY,
  transfer_request_id INTEGER NOT NULL REFERENCES production_transfer_requests(id),
  approval_step INTEGER DEFAULT 1,
  approval_type VARCHAR(30) NOT NULL,
  approver_id INTEGER REFERENCES users(id),
  approver_name VARCHAR(100),
  approver_role VARCHAR(50),
  decision VARCHAR(20),
  comments TEXT,
  action_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfer_approvals_request ON production_transfer_approvals(transfer_request_id);
CREATE INDEX IF NOT EXISTS idx_transfer_approvals_approver ON production_transfer_approvals(approver_id);

-- 초기 체크리스트 마스터 데이터 삽입 (8개 카테고리, 52개 항목)
INSERT INTO production_transfer_checklist_master (category, item_code, item_name, description, is_required, requires_attachment, attachment_type, display_order) VALUES

-- Category 1. 금형 기본 정보 확인 (6항목)
('1.금형기본정보', 'BI001', '금형코드(Mold Code) 부여 및 QR 부착 여부', '금형코드가 정상 부여되고 QR 코드가 명판에 부착되었는지 확인', TRUE, TRUE, 'image', 101),
('1.금형기본정보', 'BI002', '금형명판(Plate) 부착 위치/체결 상태', '금형명판이 올바른 위치에 견고하게 체결되었는지 확인', TRUE, TRUE, 'image', 102),
('1.금형기본정보', 'BI003', '금형 사양서(스펙) 최신본 적용 여부', '금형 사양서가 최신 버전으로 적용되었는지 확인', TRUE, TRUE, 'document', 103),
('1.금형기본정보', 'BI004', '캐비티 수, 게이트 방식, 런너 사양 확인', '캐비티 수, 게이트 방식, 런너 사양이 설계와 일치하는지 확인', TRUE, FALSE, NULL, 104),
('1.금형기본정보', 'BI005', '금형 총 중량, 외형 치수 확인', '금형의 총 중량과 외형 치수가 사양서와 일치하는지 확인', TRUE, FALSE, NULL, 105),
('1.금형기본정보', 'BI006', '금형 제작 완료보고서 파일 첨부', '금형 제작 완료보고서 파일 첨부', TRUE, TRUE, 'document', 106),

-- Category 2. 도면/문서 검증 (6항목)
('2.도면문서검증', 'DD001', '2D 도면 최신 Revision 여부', '2D 도면이 최신 Revision으로 적용되었는지 확인', TRUE, TRUE, 'document', 201),
('2.도면문서검증', 'DD002', '3D Modeling 적용 사양 일치 여부', '3D 모델링이 적용 사양과 일치하는지 확인', TRUE, TRUE, 'document', 202),
('2.도면문서검증', 'DD003', 'EO(Engineering Order) 반영 여부', 'EO(설계변경지시서)가 정상 반영되었는지 확인', TRUE, TRUE, 'document', 203),
('2.도면문서검증', 'DD004', '성형조건서/트라이얼 조건서 제출', '성형조건서 및 트라이얼 조건서 제출 여부 확인', TRUE, TRUE, 'document', 204),
('2.도면문서검증', 'DD005', '제품 승인 시 편차 데이터 제출', '제품 승인 시 편차 데이터 제출 여부 확인', TRUE, TRUE, 'document', 205),
('2.도면문서검증', 'DD006', '본사 승인 서명 여부', '본사 담당자 승인 서명 완료 여부 확인', TRUE, TRUE, 'document', 206),

-- Category 3. 치수/정밀도 검사 (10항목)
('3.치수정밀도검사', 'DI001', '주요 치수 측정 완료(PASS 기준)', '주요 치수 측정이 완료되고 PASS 기준을 충족하는지 확인', TRUE, TRUE, 'document', 301),
('3.치수정밀도검사', 'DI002', '공차 준수 여부', '설계 공차를 준수하는지 확인', TRUE, FALSE, NULL, 302),
('3.치수정밀도검사', 'DI003', '파팅라인(P/L) 간격 및 정렬 상태', '파팅라인 간격 및 정렬 상태 확인', TRUE, FALSE, NULL, 303),
('3.치수정밀도검사', 'DI004', '가스 벤트 깊이/폭 검증', '가스 벤트의 깊이와 폭이 적정한지 검증', TRUE, FALSE, NULL, 304),
('3.치수정밀도검사', 'DI005', '수평도 및 수직도', '금형의 수평도 및 수직도 확인', TRUE, FALSE, NULL, 305),
('3.치수정밀도검사', 'DI006', '심/핀 위치 정확도', '심 및 핀의 위치 정확도 확인', TRUE, FALSE, NULL, 306),
('3.치수정밀도검사', 'DI007', '이젝션 Stroke 정합성', '이젝션 스트로크가 설계와 정합하는지 확인', TRUE, FALSE, NULL, 307),
('3.치수정밀도검사', 'DI008', '사출압력/금형 강성 안전성', '사출압력 대비 금형 강성의 안전성 확인', TRUE, FALSE, NULL, 308),
('3.치수정밀도검사', 'DI009', '휨·변형 발생 여부', '금형의 휨이나 변형 발생 여부 확인', TRUE, FALSE, NULL, 309),
('3.치수정밀도검사', 'DI010', '초기 불량률 기록', '초기 불량률 기록 및 확인', TRUE, TRUE, 'document', 310),

-- Category 4. 성형면/외관 상태 (8항목)
('4.성형면외관상태', 'SA001', '성형면 미세 흠집·용접흔 여부', '성형면에 미세 흠집이나 용접흔이 없는지 확인', TRUE, TRUE, 'image', 401),
('4.성형면외관상태', 'SA002', 'EDM/연마 상태', 'EDM 가공 및 연마 상태 확인', TRUE, TRUE, 'image', 402),
('4.성형면외관상태', 'SA003', '오염·이물·녹 발생 여부', '오염, 이물질, 녹 발생 여부 확인', TRUE, TRUE, 'image', 403),
('4.성형면외관상태', 'SA004', 'Cooling channel 내부 부식 여부', '냉각 채널 내부 부식 여부 확인', TRUE, FALSE, NULL, 404),
('4.성형면외관상태', 'SA005', '전극/인서트 체결상태', '전극 및 인서트의 체결 상태 확인', TRUE, FALSE, NULL, 405),
('4.성형면외관상태', 'SA006', '러너/게이트 마감상태', '러너 및 게이트의 마감 상태 확인', TRUE, TRUE, 'image', 406),
('4.성형면외관상태', 'SA007', '실리콘/오일 잔여물 제거 여부', '실리콘 및 오일 잔여물 제거 여부 확인', TRUE, FALSE, NULL, 407),
('4.성형면외관상태', 'SA008', '사출 20Shot 외관 결과 (PASS 사진 첨부)', '사출 20Shot 외관 검사 결과 PASS 사진 첨부', TRUE, TRUE, 'image', 408),

-- Category 5. 성능·기능 점검 (8항목)
('5.성능기능점검', 'PF001', '냉각수 흐름 이상 여부', '냉각수 흐름에 이상이 없는지 확인', TRUE, FALSE, NULL, 501),
('5.성능기능점검', 'PF002', '슬라이드·리프터 작동성', '슬라이드 및 리프터의 원활한 작동 확인', TRUE, FALSE, NULL, 502),
('5.성능기능점검', 'PF003', '이젝터 작동/Stroke 정상', '이젝터 작동 및 스트로크가 정상인지 확인', TRUE, FALSE, NULL, 503),
('5.성능기능점검', 'PF004', '핀/가이드/부싱 윤활 상태', '핀, 가이드, 부싱의 윤활 상태 확인', TRUE, FALSE, NULL, 504),
('5.성능기능점검', 'PF005', '코어 백래시(B/L) 허용 범위', '코어 백래시가 허용 범위 내인지 확인', TRUE, FALSE, NULL, 505),
('5.성능기능점검', 'PF006', '러너 밸런스 및 충진상태', '러너 밸런스 및 충진 상태 확인', TRUE, FALSE, NULL, 506),
('5.성능기능점검', 'PF007', '금형 온도 균일성', '금형 온도의 균일성 확인', TRUE, FALSE, NULL, 507),
('5.성능기능점검', 'PF008', '사이클 타임 적합성', '사이클 타임이 목표에 적합한지 확인', TRUE, FALSE, NULL, 508),

-- Category 6. 금형 안전성 확인 (4항목)
('6.금형안전성확인', 'SF001', '금형 클램프 구멍/위치 확인', '금형 클램프 구멍 및 위치 확인', TRUE, FALSE, NULL, 601),
('6.금형안전성확인', 'SF002', '금형 인양 고리 체결상태', '금형 인양 고리의 체결 상태 확인', TRUE, TRUE, 'image', 602),
('6.금형안전성확인', 'SF003', '센서류 배선 보호 여부', '센서류 배선이 적절히 보호되었는지 확인', TRUE, FALSE, NULL, 603),
('6.금형안전성확인', 'SF004', '안전커버/가이드 설치 확인', '안전커버 및 가이드 설치 상태 확인', TRUE, TRUE, 'image', 604),

-- Category 7. 시운전(TRY-OUT) 결과 (8항목)
('7.시운전결과', 'TR001', 'Shot 수: 1st~3rd 시운전 기록', '1차~3차 시운전 Shot 수 기록', TRUE, TRUE, 'document', 701),
('7.시운전결과', 'TR002', '성형조건 최적값 제공', '최적 성형조건 값 제공 여부 확인', TRUE, TRUE, 'document', 702),
('7.시운전결과', 'TR003', 'NG 항목 발생 시 개선이력 기록', 'NG 항목 발생 시 개선 이력 기록 확인', TRUE, TRUE, 'document', 703),
('7.시운전결과', 'TR004', '제품 외관 PASS 여부', '제품 외관 검사 PASS 여부 확인', TRUE, TRUE, 'image', 704),
('7.시운전결과', 'TR005', '제품 치수 PASS 여부', '제품 치수 검사 PASS 여부 확인', TRUE, TRUE, 'document', 705),
('7.시운전결과', 'TR006', '성형압/온도 안정성 검증', '성형압 및 온도 안정성 검증', TRUE, FALSE, NULL, 706),
('7.시운전결과', 'TR007', '생산성 기준 충족 여부', '생산성 기준 충족 여부 확인', TRUE, FALSE, NULL, 707),
('7.시운전결과', 'TR008', '최종 PASS 승인', '최종 PASS 승인 여부 확인', TRUE, TRUE, 'document', 708),

-- Category 8. 금형 인계 및 물류 (6항목)
('8.금형인계물류', 'TL001', '금형 세척·방청 완료', '금형 세척 및 방청 처리 완료 확인', TRUE, FALSE, NULL, 801),
('8.금형인계물류', 'TL002', '금형 포장/보관 사양 준수', '금형 포장 및 보관 사양 준수 여부 확인', TRUE, TRUE, 'image', 802),
('8.금형인계물류', 'TL003', '이관 전 GPS 위치/사진 기록', '이관 전 GPS 위치 및 사진 기록', TRUE, TRUE, 'image', 803),
('8.금형인계물류', 'TL004', '이관 체크리스트 자동 생성(QR 기반)', 'QR 기반 이관 체크리스트 자동 생성 확인', TRUE, FALSE, NULL, 804),
('8.금형인계물류', 'TL005', '인계자/인수자 서명', '인계자 및 인수자 서명 완료 확인', TRUE, TRUE, 'document', 805),
('8.금형인계물류', 'TL006', '생산처 입고 확인 (QR 스캔)', '생산처 입고 QR 스캔 확인', TRUE, FALSE, NULL, 806)

ON CONFLICT DO NOTHING;
