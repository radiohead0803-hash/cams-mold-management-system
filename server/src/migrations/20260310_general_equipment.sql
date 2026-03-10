-- ============================================================
-- 협력사 보유 장비현황 시스템 (카테고리별 분류)
-- 2026-03-10
-- ============================================================

-- 1) 장비 카테고리 (대분류/중분류)
CREATE TABLE IF NOT EXISTS general_equipment_category (
  id SERIAL PRIMARY KEY,
  category_code VARCHAR(30) NOT NULL UNIQUE,
  category_name VARCHAR(100) NOT NULL,
  parent_id INTEGER REFERENCES general_equipment_category(id),
  applicable_to VARCHAR(20) DEFAULT 'all',
    -- all: 공통, maker: 제작처, plant: 생산처
  sort_order INTEGER DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) 일반 장비 마스터 (카테고리별 기초정보)
CREATE TABLE IF NOT EXISTS general_equipment_master (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES general_equipment_category(id),
  equipment_name VARCHAR(150) NOT NULL,
  manufacturer VARCHAR(100),
  model_name VARCHAR(100),
  spec_summary VARCHAR(200),
  spec_info JSONB DEFAULT '{}',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gem_category ON general_equipment_master (category_id);
CREATE INDEX IF NOT EXISTS idx_gem_name ON general_equipment_master (equipment_name);

-- 3) 업체별 보유 장비 (마스터 연동 또는 수동입력)
CREATE TABLE IF NOT EXISTS company_general_equipment (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES general_equipment_category(id),
  equipment_master_id INTEGER REFERENCES general_equipment_master(id),
  equipment_name VARCHAR(150) NOT NULL,
  manufacturer VARCHAR(100),
  model_name VARCHAR(100),
  spec_summary VARCHAR(200),
  quantity INTEGER DEFAULT 1,
  year_installed INTEGER,
  status VARCHAR(30) DEFAULT 'active',
    -- active, maintenance, retired, standby
  condition_grade VARCHAR(10),
    -- A, B, C, D
  daily_capacity VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cge_company ON company_general_equipment (company_id);
CREATE INDEX IF NOT EXISTS idx_cge_category ON company_general_equipment (category_id);
CREATE INDEX IF NOT EXISTS idx_cge_master ON company_general_equipment (equipment_master_id);

-- ============================================================
-- 카테고리 초기 데이터: 금형 제작처/생산처 주요 장비 분류
-- ============================================================

-- === 공통 장비 ===
INSERT INTO general_equipment_category (category_code, category_name, applicable_to, sort_order, description)
VALUES
  ('CRANE', '크레인/호이스트', 'all', 10, '천장크레인, 호이스트, 지브크레인 등'),
  ('FORKLIFT', '지게차/운반장비', 'all', 11, '지게차, 핸드리프트, AGV 등'),
  ('COMPRESSOR', '공압/유압장비', 'all', 12, '에어컴프레서, 유압유닛 등'),
  ('MEASURE', '측정/검사장비', 'all', 13, 'CMM, 3D스캐너, 경도계, 현미경 등'),
  ('TEMP_CONTROL', '온도조절장비', 'all', 14, '금형온도조절기, 칠러, 냉각타워 등'),
  ('CLEAN', '세척/클리닝', 'all', 15, '초음파세척기, 드라이아이스 블라스터 등')
ON CONFLICT (category_code) DO NOTHING;

-- === 제작처(Maker) 전용 장비 ===
INSERT INTO general_equipment_category (category_code, category_name, applicable_to, sort_order, description)
VALUES
  ('CNC', 'CNC 가공기', 'maker', 20, 'CNC 밀링, CNC 선반, 머시닝센터 등'),
  ('EDM', '방전가공기', 'maker', 21, '와이어EDM, 형조EDM(싱커) 등'),
  ('GRINDING', '연삭/연마기', 'maker', 22, '평면연삭기, 원통연삭기, 지그그라인더 등'),
  ('DRILL', '드릴/보링', 'maker', 23, '건드릴, 심공드릴, 보링머신 등'),
  ('LATHE', '선반', 'maker', 24, '범용선반, CNC선반 등'),
  ('MILLING', '밀링', 'maker', 25, '범용밀링, 고속밀링 등'),
  ('WIRE_CUT', '와이어컷', 'maker', 26, '와이어컷 방전가공기'),
  ('POLISH', '경면/폴리싱', 'maker', 27, '경면가공기, 래핑기, 폴리싱 등'),
  ('HEAT_TREAT', '열처리장비', 'maker', 28, '진공열처리, 질화처리, 고주파 등'),
  ('WELD', '용접장비', 'maker', 29, 'TIG, MIG, 레이저용접, 보수용접기 등'),
  ('DESIGN_SW', '설계/CAD/CAM', 'maker', 30, 'NX, CATIA, SolidWorks, PowerMill 등'),
  ('MOLD_FLOW', '해석 소프트웨어', 'maker', 31, 'Moldflow, Moldex3D 등')
ON CONFLICT (category_code) DO NOTHING;

-- === 생산처(Plant) 전용 장비 ===
INSERT INTO general_equipment_category (category_code, category_name, applicable_to, sort_order, description)
VALUES
  ('INJECTION', '사출기', 'plant', 40, '사출성형기 (기존 equipment_master 연동)'),
  ('ROBOT', '로봇/자동화', 'plant', 41, '취출로봇, 다관절로봇, 자동화설비 등'),
  ('CONVEYOR', '컨베이어/이송', 'plant', 42, '벨트컨베이어, 롤러컨베이어 등'),
  ('DRYER', '건조기/제습기', 'plant', 43, '호퍼드라이어, 제습건조기 등'),
  ('MIXER', '믹서/블렌더', 'plant', 44, '자동배합기, 컬러믹서 등'),
  ('GRINDER', '분쇄기/재생기', 'plant', 45, '스프루분쇄기, 재생펠릿 장비 등'),
  ('ASSEMBLY', '조립/후가공', 'plant', 46, '초음파융착기, 핫스탬프, 패드인쇄 등'),
  ('PACK', '포장장비', 'plant', 47, '자동포장기, 밴딩기 등'),
  ('QC_INLINE', '인라인 검사', 'plant', 48, '비전검사기, 중량선별기 등')
ON CONFLICT (category_code) DO NOTHING;

-- ============================================================
-- 주요 장비 마스터 초기 데이터 (예시)
-- ============================================================

-- CNC 가공기
INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, spec_summary, description)
SELECT id, 'VMC 850', '두산', '작업영역 850x510x510mm', '수직 머시닝센터' FROM general_equipment_category WHERE category_code = 'CNC'
ON CONFLICT DO NOTHING;
INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, spec_summary, description)
SELECT id, 'VMC 1060', '두산', '작업영역 1060x600x600mm', '수직 머시닝센터' FROM general_equipment_category WHERE category_code = 'CNC'
ON CONFLICT DO NOTHING;
INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, spec_summary, description)
SELECT id, 'DMC 850V', 'DMG MORI', '5축 머시닝센터', '고정밀 5축 가공' FROM general_equipment_category WHERE category_code = 'CNC'
ON CONFLICT DO NOTHING;
INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, spec_summary, description)
SELECT id, 'PUMA 2600', '두산', 'CNC 선반 Φ300', 'CNC 터닝센터' FROM general_equipment_category WHERE category_code = 'CNC'
ON CONFLICT DO NOTHING;

-- 방전가공기
INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, spec_summary, description)
SELECT id, 'AG60L', 'Sodick', '와이어EDM', '정밀 와이어 방전가공기' FROM general_equipment_category WHERE category_code = 'EDM'
ON CONFLICT DO NOTHING;
INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, spec_summary, description)
SELECT id, 'EA12V Advance', 'Mitsubishi', '형조EDM', '고속 형조 방전가공기' FROM general_equipment_category WHERE category_code = 'EDM'
ON CONFLICT DO NOTHING;

-- 연삭기
INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, spec_summary, description)
SELECT id, 'PSG-63DX', '오카모토', '평면연삭 600x300mm', '평면연삭기' FROM general_equipment_category WHERE category_code = 'GRINDING'
ON CONFLICT DO NOTHING;

-- 건드릴
INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, spec_summary, description)
SELECT id, 'GD-5120', 'TIBO', 'Φ3~32 깊이1200mm', '건드릴 심공가공기' FROM general_equipment_category WHERE category_code = 'DRILL'
ON CONFLICT DO NOTHING;

-- 측정장비
INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, spec_summary, description)
SELECT id, 'CRYSTA-Apex S', 'Mitutoyo', '3차원 좌표측정기', 'CNC CMM' FROM general_equipment_category WHERE category_code = 'MEASURE'
ON CONFLICT DO NOTHING;
INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, spec_summary, description)
SELECT id, 'ATOS Q', 'GOM', '3D 스캐너', '광학식 3D 스캐너' FROM general_equipment_category WHERE category_code = 'MEASURE'
ON CONFLICT DO NOTHING;

-- 크레인
INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, spec_summary, description)
SELECT id, '천장크레인 10톤', '한국크레인', '10ton 천장주행', '천장 오버헤드 크레인' FROM general_equipment_category WHERE category_code = 'CRANE'
ON CONFLICT DO NOTHING;
INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, spec_summary, description)
SELECT id, '천장크레인 30톤', '한국크레인', '30ton 천장주행', '대형 천장 크레인' FROM general_equipment_category WHERE category_code = 'CRANE'
ON CONFLICT DO NOTHING;

-- 로봇
INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, spec_summary, description)
SELECT id, '6축 다관절 로봇', 'Fanuc', 'M-20iD/25', '사출 취출/조립용 로봇' FROM general_equipment_category WHERE category_code = 'ROBOT'
ON CONFLICT DO NOTHING;
INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, spec_summary, description)
SELECT id, '직교좌표 취출로봇', 'Yushin', 'HSA 시리즈', '사출성형 자동 취출' FROM general_equipment_category WHERE category_code = 'ROBOT'
ON CONFLICT DO NOTHING;

-- 온도조절기
INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, spec_summary, description)
SELECT id, '금형 온도조절기', '아진', 'AMT-200', '금형 온도 조절 (수/유)' FROM general_equipment_category WHERE category_code = 'TEMP_CONTROL'
ON CONFLICT DO NOTHING;

-- 건조기
INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, spec_summary, description)
SELECT id, '호퍼드라이어', '한국건조', '100L', '원재료 건조기' FROM general_equipment_category WHERE category_code = 'DRYER'
ON CONFLICT DO NOTHING;

-- 설계소프트웨어
INSERT INTO general_equipment_master (category_id, equipment_name, spec_summary, description)
SELECT id, 'NX (Siemens)', 'CAD/CAM/CAE 통합', '금형설계 주력 소프트웨어' FROM general_equipment_category WHERE category_code = 'DESIGN_SW'
ON CONFLICT DO NOTHING;
INSERT INTO general_equipment_master (category_id, equipment_name, spec_summary, description)
SELECT id, 'CATIA (Dassault)', '3D CAD/CAM', '자동차 금형설계' FROM general_equipment_category WHERE category_code = 'DESIGN_SW'
ON CONFLICT DO NOTHING;
INSERT INTO general_equipment_master (category_id, equipment_name, spec_summary, description)
SELECT id, 'PowerMill (Autodesk)', 'CAM 전문', '고속가공 CAM' FROM general_equipment_category WHERE category_code = 'DESIGN_SW'
ON CONFLICT DO NOTHING;

-- 해석소프트웨어
INSERT INTO general_equipment_master (category_id, equipment_name, spec_summary, description)
SELECT id, 'Moldflow (Autodesk)', '사출해석', '유동/냉각/변형 해석' FROM general_equipment_category WHERE category_code = 'MOLD_FLOW'
ON CONFLICT DO NOTHING;
INSERT INTO general_equipment_master (category_id, equipment_name, spec_summary, description)
SELECT id, 'Moldex3D', '사출해석', '3D 사출성형 해석' FROM general_equipment_category WHERE category_code = 'MOLD_FLOW'
ON CONFLICT DO NOTHING;
