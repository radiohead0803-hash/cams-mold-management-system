-- 점검 템플릿 마스터 테이블
CREATE TABLE IF NOT EXISTS checklist_templates (
  id            BIGSERIAL PRIMARY KEY,
  code          VARCHAR(50) NOT NULL UNIQUE,
  name          VARCHAR(100) NOT NULL,
  category      VARCHAR(20) NOT NULL,       -- 'daily' | 'regular'
  shot_interval INTEGER,                    -- 정기점검이면 샷 간격
  is_active     BOOLEAN DEFAULT TRUE,
  version       INTEGER DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 점검 템플릿 항목 테이블
CREATE TABLE IF NOT EXISTS checklist_template_items (
  id             BIGSERIAL PRIMARY KEY,
  template_id    BIGINT NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  order_no       INTEGER NOT NULL,
  section        VARCHAR(50),
  label          VARCHAR(200) NOT NULL,
  field_type     VARCHAR(20) NOT NULL,      -- 'boolean' | 'number' | 'text'
  required       BOOLEAN DEFAULT TRUE,
  ng_criteria    VARCHAR(100),
  default_value  VARCHAR(100)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_checklist_templates_code ON checklist_templates(code);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_category ON checklist_templates(category);
CREATE INDEX IF NOT EXISTS idx_checklist_template_items_template_id ON checklist_template_items(template_id);

-- 샘플 템플릿 데이터 삽입
INSERT INTO checklist_templates (code, name, category, shot_interval, is_active, version)
VALUES
  ('DAILY_MOLD', '생산처 일상점검', 'daily', NULL, TRUE, 1),
  ('REG_20K',     '2만샷 정기점검', 'regular', 20000, TRUE, 1)
ON CONFLICT (code) DO NOTHING;

-- 일상점검 항목 (template_id는 실제 생성된 ID로 교체 필요)
INSERT INTO checklist_template_items (template_id, order_no, section, label, field_type, required, ng_criteria)
SELECT 
  t.id,
  1,
  '공통',
  '금형 외관 손상/파손 여부',
  'boolean',
  TRUE,
  'NO면 NG'
FROM checklist_templates t WHERE t.code = 'DAILY_MOLD'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (template_id, order_no, section, label, field_type, required, ng_criteria)
SELECT 
  t.id,
  2,
  '공통',
  '코어/캐비티 이물 및 오염 여부',
  'boolean',
  TRUE,
  'NO면 NG'
FROM checklist_templates t WHERE t.code = 'DAILY_MOLD';

INSERT INTO checklist_template_items (template_id, order_no, section, label, field_type, required, ng_criteria)
SELECT 
  t.id,
  3,
  '냉각',
  '냉각라인 누수/막힘 여부',
  'boolean',
  TRUE,
  'NO면 NG'
FROM checklist_templates t WHERE t.code = 'DAILY_MOLD';

INSERT INTO checklist_template_items (template_id, order_no, section, label, field_type, required, ng_criteria)
SELECT 
  t.id,
  4,
  '성형조건',
  '현재 설정 성형조건과 표준조건 일치 여부',
  'boolean',
  TRUE,
  'NO면 NG'
FROM checklist_templates t WHERE t.code = 'DAILY_MOLD';

-- 정기점검 항목
INSERT INTO checklist_template_items (template_id, order_no, section, label, field_type, required, ng_criteria)
SELECT 
  t.id,
  1,
  '공통',
  '금형 분해/세척 작업 여부',
  'boolean',
  TRUE,
  'YES 필수'
FROM checklist_templates t WHERE t.code = 'REG_20K';

INSERT INTO checklist_template_items (template_id, order_no, section, label, field_type, required, ng_criteria)
SELECT 
  t.id,
  2,
  '냉각',
  '냉각라인 스케일/이물 제거 여부',
  'boolean',
  TRUE,
  'YES 필수'
FROM checklist_templates t WHERE t.code = 'REG_20K';

INSERT INTO checklist_template_items (template_id, order_no, section, label, field_type, required, ng_criteria)
SELECT 
  t.id,
  3,
  '가이드',
  '가이드핀/부시 마모 상태 점검',
  'text',
  FALSE,
  NULL
FROM checklist_templates t WHERE t.code = 'REG_20K';

INSERT INTO checklist_template_items (template_id, order_no, section, label, field_type, required, ng_criteria)
SELECT 
  t.id,
  4,
  '윤활',
  '슬라이드/리프팅 등 윤활 상태',
  'text',
  FALSE,
  NULL
FROM checklist_templates t WHERE t.code = 'REG_20K';

-- 점검 인스턴스 테이블 (실제 작성된 점검 기록)
CREATE TABLE IF NOT EXISTS checklist_instances (
  id             BIGSERIAL PRIMARY KEY,
  template_id    BIGINT NOT NULL REFERENCES checklist_templates(id),
  mold_id        BIGINT NOT NULL REFERENCES molds(id),
  plant_id       BIGINT REFERENCES plants(id),
  site_type      VARCHAR(20) NOT NULL,      -- 'production' | 'maker'
  category       VARCHAR(20) NOT NULL,      -- 'daily' | 'regular'
  shot_counter   INTEGER,
  status         VARCHAR(20) NOT NULL DEFAULT 'draft',  -- 'draft' | 'submitted'
  inspected_by   BIGINT,
  inspected_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- 점검 답변 테이블
CREATE TABLE IF NOT EXISTS checklist_answers (
  id             BIGSERIAL PRIMARY KEY,
  instance_id    BIGINT NOT NULL REFERENCES checklist_instances(id) ON DELETE CASCADE,
  item_id        BIGINT NOT NULL REFERENCES checklist_template_items(id),
  value_bool     BOOLEAN,
  value_number   NUMERIC,
  value_text     TEXT,
  is_ng          BOOLEAN DEFAULT FALSE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_checklist_instances_mold_id ON checklist_instances(mold_id);
CREATE INDEX IF NOT EXISTS idx_checklist_instances_template_id ON checklist_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_checklist_instances_status ON checklist_instances(status);
CREATE INDEX IF NOT EXISTS idx_checklist_answers_instance_id ON checklist_answers(instance_id);

COMMENT ON TABLE checklist_templates IS '점검 템플릿 마스터';
COMMENT ON TABLE checklist_template_items IS '점검 템플릿 항목';
COMMENT ON TABLE checklist_instances IS '실제 작성된 점검 기록';
COMMENT ON TABLE checklist_answers IS '점검 항목별 답변';
