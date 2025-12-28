-- =====================================================
-- 금형 체크리스트 폼즈 시스템
-- 마스터(템플릿) 기반 동적 폼 관리
-- =====================================================

-- 1. 체크리스트 폼(마스터/템플릿)
CREATE TABLE IF NOT EXISTS checklist_forms (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,                    -- 예: "금형 체크리스트 v1.0"
  category        VARCHAR(30) NOT NULL,             -- dev_mold, daily, regular, transfer
  target_role     VARCHAR(20) NOT NULL,             -- maker, production, both
  mold_type       VARCHAR(50),                      -- 범퍼, 백빔, 코팅, MICA 등
  customer        VARCHAR(50),                      -- 현대, 기아 등
  version         INTEGER NOT NULL DEFAULT 1,
  status          VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, published, archived
  description     TEXT,                             -- 폼 설명
  created_by      INTEGER NOT NULL REFERENCES users(id),
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_forms_status ON checklist_forms(status);
CREATE INDEX idx_checklist_forms_category ON checklist_forms(category);

-- 2. 체크리스트 섹션 (I.원재료, II.금형, III.가스베기 등)
CREATE TABLE IF NOT EXISTS checklist_sections (
  id              SERIAL PRIMARY KEY,
  form_id         INTEGER NOT NULL REFERENCES checklist_forms(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,                    -- "I. 원재료 (Material)"
  description     TEXT,                             -- 섹션 설명
  order_index     INTEGER NOT NULL,
  is_required     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_sections_form ON checklist_sections(form_id);

-- 3. 체크리스트 질문/항목
CREATE TABLE IF NOT EXISTS checklist_questions (
  id              SERIAL PRIMARY KEY,
  section_id      INTEGER NOT NULL REFERENCES checklist_sections(id) ON DELETE CASCADE,
  order_index     INTEGER NOT NULL,
  label           TEXT NOT NULL,                    -- "수촛물", "냉각라인 위치" 등
  description     TEXT,                             -- 상세 설명
  field_type      VARCHAR(20) NOT NULL,             -- text, number, select, checkbox, radio, date, file
  spec_default    TEXT,                             -- 기준/사양 기본값 (예: "6/1000")
  required        BOOLEAN NOT NULL DEFAULT FALSE,   -- 필수 응답 여부
  enable_confirm  BOOLEAN NOT NULL DEFAULT TRUE,    -- '확인' 체크박스 사용 여부
  enable_ng       BOOLEAN NOT NULL DEFAULT TRUE,    -- NG 체크 가능 여부
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_questions_section ON checklist_questions(section_id);

-- 4. 질문 선택지 (라디오, 체크박스, 드롭다운 옵션)
CREATE TABLE IF NOT EXISTS checklist_options (
  id            SERIAL PRIMARY KEY,
  question_id   INTEGER NOT NULL REFERENCES checklist_questions(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,                      -- "반영", "미반영", "예", "아니오"
  value         TEXT NOT NULL,                      -- 'Y', 'N', 'APPLY', 'NOT_APPLY'
  order_index   INTEGER NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_options_question ON checklist_options(question_id);

-- 5. 폼-금형 매핑 (배포 설정)
CREATE TABLE IF NOT EXISTS checklist_form_assignments (
  id              SERIAL PRIMARY KEY,
  form_id         INTEGER NOT NULL REFERENCES checklist_forms(id) ON DELETE CASCADE,
  mold_type       VARCHAR(50),                      -- 범퍼/백빔/코팅 등
  customer        VARCHAR(50),                      -- 고객사
  usage_stage     VARCHAR(20),                      -- dev, mass, transfer
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      INTEGER NOT NULL REFERENCES users(id),
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_assignments_active ON checklist_form_assignments(is_active);

-- 6. 체크리스트 인스턴스 (작성본)
CREATE TABLE IF NOT EXISTS checklist_instances (
  id              SERIAL PRIMARY KEY,
  form_id         INTEGER NOT NULL REFERENCES checklist_forms(id),
  mold_id         INTEGER NOT NULL REFERENCES molds(id),
  site_id         INTEGER NOT NULL REFERENCES companies(id), -- 작성한 공장/제작처
  role            VARCHAR(20) NOT NULL,             -- maker or production
  status          VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- in_progress, submitted, approved, rejected
  progress_rate   NUMERIC(5,2) DEFAULT 0,           -- 완료율 (%)
  ng_count        INTEGER DEFAULT 0,                -- NG 항목 수
  total_count     INTEGER DEFAULT 0,                -- 전체 항목 수
  
  -- 헤더 정보 (금형 체크리스트 상단)
  car_name        TEXT,
  part_no         TEXT,
  eo_cut          TEXT,
  check_date      DATE,
  
  created_by      INTEGER NOT NULL REFERENCES users(id),
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now(),
  submitted_at    TIMESTAMP,
  approved_by     INTEGER REFERENCES users(id),
  approved_at     TIMESTAMP,
  approval_comment TEXT
);

CREATE INDEX idx_checklist_instances_mold ON checklist_instances(mold_id);
CREATE INDEX idx_checklist_instances_status ON checklist_instances(status);
CREATE INDEX idx_checklist_instances_site ON checklist_instances(site_id);

-- 7. 체크리스트 답변
CREATE TABLE IF NOT EXISTS checklist_answers (
  id             SERIAL PRIMARY KEY,
  instance_id    INTEGER NOT NULL REFERENCES checklist_instances(id) ON DELETE CASCADE,
  question_id    INTEGER NOT NULL REFERENCES checklist_questions(id),
  
  -- 답변 값
  value_text     TEXT,                              -- 텍스트/숫자/날짜 값
  value_option   TEXT,                              -- 선택값 (APPLY, NOT_APPLY 등)
  is_checked     BOOLEAN DEFAULT FALSE,             -- '확인' 체크박스
  is_ng          BOOLEAN DEFAULT FALSE,             -- NG 여부
  ng_reason      TEXT,                              -- NG 사유
  
  -- 첨부파일
  attachment_url TEXT,                              -- 파일 URL
  
  created_at     TIMESTAMP NOT NULL DEFAULT now(),
  updated_at     TIMESTAMP NOT NULL DEFAULT now(),
  
  UNIQUE(instance_id, question_id)
);

CREATE INDEX idx_checklist_answers_instance ON checklist_answers(instance_id);
CREATE INDEX idx_checklist_answers_ng ON checklist_answers(is_ng);

-- 8. 체크리스트 변경 이력
CREATE TABLE IF NOT EXISTS checklist_history (
  id              SERIAL PRIMARY KEY,
  instance_id     INTEGER NOT NULL REFERENCES checklist_instances(id) ON DELETE CASCADE,
  action          VARCHAR(20) NOT NULL,             -- created, updated, submitted, approved, rejected
  changed_by      INTEGER NOT NULL REFERENCES users(id),
  comment         TEXT,
  snapshot        JSONB,                            -- 변경 시점의 데이터 스냅샷
  created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_history_instance ON checklist_history(instance_id);

-- =====================================================
-- 샘플 데이터: 금형 체크리스트 템플릿
-- =====================================================

-- 샘플 폼 생성 (금형 개발 체크리스트)
INSERT INTO checklist_forms (name, category, target_role, mold_type, version, status, created_by)
VALUES 
  ('금형 체크리스트 v1.0', 'dev_mold', 'maker', NULL, 1, 'published', 1),
  ('일상점검 체크리스트', 'daily', 'production', NULL, 1, 'published', 1),
  ('정기점검 체크리스트', 'regular', 'both', NULL, 1, 'published', 1);

-- 샘플 섹션 (금형 체크리스트)
INSERT INTO checklist_sections (form_id, title, order_index)
VALUES 
  (1, 'I. 원재료 (Material)', 1),
  (1, 'II. 금형 (Mold)', 2),
  (1, 'III. 가스베기 (Gas Vent)', 3),
  (1, 'IV. 냉각 (Cooling)', 4);

-- 샘플 질문 (I. 원재료)
INSERT INTO checklist_questions (section_id, order_index, label, field_type, spec_default, required, enable_confirm)
VALUES 
  (1, 1, '수촛물', 'text', '6/1000', true, true),
  (1, 2, '재질', 'select', NULL, true, true),
  (1, 3, '열처리', 'radio', NULL, true, true);

-- 샘플 옵션 (재질 선택)
INSERT INTO checklist_options (question_id, label, value, order_index)
VALUES 
  (2, 'NAK80', 'NAK80', 1),
  (2, 'P20', 'P20', 2),
  (2, 'S50C', 'S50C', 3);

-- 샘플 옵션 (열처리 라디오)
INSERT INTO checklist_options (question_id, label, value, order_index)
VALUES 
  (3, '반영', 'APPLY', 1),
  (3, '미반영', 'NOT_APPLY', 2);

-- 폼 배포 설정
INSERT INTO checklist_form_assignments (form_id, mold_type, usage_stage, is_active, created_by)
VALUES 
  (1, '범퍼', 'dev', true, 1),
  (1, '백빔', 'dev', true, 1),
  (2, NULL, 'mass', true, 1),
  (3, NULL, 'mass', true, 1);

COMMENT ON TABLE checklist_forms IS '체크리스트 폼 마스터 (템플릿)';
COMMENT ON TABLE checklist_sections IS '체크리스트 섹션 (구분)';
COMMENT ON TABLE checklist_questions IS '체크리스트 질문/항목';
COMMENT ON TABLE checklist_options IS '질문 선택지 (라디오/체크박스/드롭다운)';
COMMENT ON TABLE checklist_form_assignments IS '폼-금형 매핑 (배포 설정)';
COMMENT ON TABLE checklist_instances IS '체크리스트 인스턴스 (작성본)';
COMMENT ON TABLE checklist_answers IS '체크리스트 답변';
COMMENT ON TABLE checklist_history IS '체크리스트 변경 이력';
