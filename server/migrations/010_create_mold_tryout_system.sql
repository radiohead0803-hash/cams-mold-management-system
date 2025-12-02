-- =====================================================
-- 금형육성(TRY-OUT) 시스템
-- 제작처/생산처 작성 → 본사 승인 구조
-- =====================================================

-- 1. TRY-OUT 헤더 (회차별)
CREATE TABLE IF NOT EXISTS mold_tryout (
  id              SERIAL PRIMARY KEY,
  mold_id         INTEGER NOT NULL REFERENCES molds(id),
  maker_id        INTEGER REFERENCES companies(id),      -- 제작처 (개발 단계)
  plant_id        INTEGER REFERENCES companies(id),      -- 생산처 (양산 단계)
  trial_no        VARCHAR(20) NOT NULL,                  -- "T0", "T1", "T2", "PPAP", "MASS-001"
  trial_date      DATE,
  status          VARCHAR(20) NOT NULL DEFAULT 'draft',  -- draft, submitted, approved, rejected
  
  -- 사출기 정보
  machine_name    TEXT,                                  -- 사용 사출기
  tonnage         INTEGER,                               -- 톤수
  
  -- 수지 정보
  resin           TEXT,                                  -- 사용 수지
  resin_maker     TEXT,                                  -- 수지 제조사
  color           TEXT,                                  -- 색상
  
  -- 성형 기본 정보
  cavity_used     INTEGER,                               -- 사용 캐비티 수
  shot_weight_g   NUMERIC(8,2),                          -- 샷 중량 (g)
  cycle_sec       NUMERIC(6,2),                          -- 싸이클 타임 (초)
  
  -- 품질 평가
  overall_quality VARCHAR(20),                           -- OK, NG, CONDITIONAL
  is_mass_ready   BOOLEAN DEFAULT FALSE,                 -- 양산 준비 완료 여부
  use_as_mass_condition BOOLEAN DEFAULT FALSE,           -- 양산 기준 조건으로 사용
  
  -- 종합 코멘트
  comment         TEXT,
  
  -- 승인 정보
  created_by      INTEGER NOT NULL REFERENCES users(id),
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_by      INTEGER REFERENCES users(id),
  updated_at      TIMESTAMP NOT NULL DEFAULT now(),
  submitted_at    TIMESTAMP,
  approved_by     INTEGER REFERENCES users(id),
  approved_at     TIMESTAMP,
  approval_comment TEXT,
  
  UNIQUE(mold_id, trial_no)
);

CREATE INDEX idx_mold_tryout_mold ON mold_tryout(mold_id);
CREATE INDEX idx_mold_tryout_status ON mold_tryout(status);
CREATE INDEX idx_mold_tryout_maker ON mold_tryout(maker_id);
CREATE INDEX idx_mold_tryout_plant ON mold_tryout(plant_id);
CREATE INDEX idx_mold_tryout_trial ON mold_tryout(trial_no);

-- 2. 성형 조건 (온도/압력/속도/시간 등)
CREATE TABLE IF NOT EXISTS mold_tryout_conditions (
  id              SERIAL PRIMARY KEY,
  tryout_id       INTEGER NOT NULL REFERENCES mold_tryout(id) ON DELETE CASCADE,
  category        VARCHAR(50) NOT NULL,                  -- temperature, pressure, speed, time
  name            TEXT NOT NULL,                         -- "용융온도", "금형온도", "보압", "냉각시간"
  value           TEXT,                                  -- "230", "60", "800"
  unit            TEXT,                                  -- "℃", "bar", "sec", "mm/s"
  target_value    TEXT,                                  -- 목표값
  tolerance       TEXT,                                  -- 허용 오차
  is_critical     BOOLEAN DEFAULT FALSE,                 -- 중요 조건 여부
  order_index     INTEGER NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_tryout_conditions_tryout ON mold_tryout_conditions(tryout_id);
CREATE INDEX idx_tryout_conditions_category ON mold_tryout_conditions(category);

-- 3. 품질 평가 / 불량 기록
CREATE TABLE IF NOT EXISTS mold_tryout_defects (
  id              SERIAL PRIMARY KEY,
  tryout_id       INTEGER NOT NULL REFERENCES mold_tryout(id) ON DELETE CASCADE,
  defect_type     VARCHAR(50) NOT NULL,                  -- sink, warp, weld, short, burr, flash, burn
  severity        VARCHAR(20) NOT NULL,                  -- none, minor, major, critical
  location        TEXT,                                  -- 불량 위치
  description     TEXT,                                  -- 상세 내용
  cause_analysis  TEXT,                                  -- 원인 분석
  action_plan     TEXT,                                  -- 개선 대책
  is_resolved     BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at     TIMESTAMP,
  resolved_by     INTEGER REFERENCES users(id),
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_tryout_defects_tryout ON mold_tryout_defects(tryout_id);
CREATE INDEX idx_tryout_defects_severity ON mold_tryout_defects(severity);
CREATE INDEX idx_tryout_defects_resolved ON mold_tryout_defects(is_resolved);

-- 4. 사진/파일 첨부
CREATE TABLE IF NOT EXISTS mold_tryout_files (
  id              SERIAL PRIMARY KEY,
  tryout_id       INTEGER NOT NULL REFERENCES mold_tryout(id) ON DELETE CASCADE,
  file_url        TEXT NOT NULL,
  file_type       VARCHAR(50),                           -- part_photo, mold_photo, report, analysis
  file_name       TEXT,
  file_size       INTEGER,                               -- bytes
  description     TEXT,
  uploaded_by     INTEGER REFERENCES users(id),
  uploaded_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_tryout_files_tryout ON mold_tryout_files(tryout_id);
CREATE INDEX idx_tryout_files_type ON mold_tryout_files(file_type);

-- 5. TRY-OUT 변경 이력
CREATE TABLE IF NOT EXISTS mold_tryout_history (
  id              SERIAL PRIMARY KEY,
  tryout_id       INTEGER NOT NULL REFERENCES mold_tryout(id) ON DELETE CASCADE,
  action          VARCHAR(20) NOT NULL,                  -- created, updated, submitted, approved, rejected
  changed_by      INTEGER NOT NULL REFERENCES users(id),
  comment         TEXT,
  snapshot        JSONB,                                 -- 변경 시점의 데이터 스냅샷
  created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_tryout_history_tryout ON mold_tryout_history(tryout_id);

-- =====================================================
-- 샘플 데이터: 성형 조건 템플릿
-- =====================================================

-- 온도 조건 (Temperature)
INSERT INTO mold_tryout_conditions (tryout_id, category, name, unit, order_index)
SELECT 0, 'temperature', name, '℃', order_index FROM (VALUES
  ('용융온도 (Nozzle)', 1),
  ('실린더 온도 1구', 2),
  ('실린더 온도 2구', 3),
  ('실린더 온도 3구', 4),
  ('실린더 온도 4구', 5),
  ('금형온도 (고정측)', 6),
  ('금형온도 (가동측)', 7)
) AS t(name, order_index)
WHERE NOT EXISTS (SELECT 1 FROM mold_tryout_conditions WHERE tryout_id = 0);

-- 압력 조건 (Pressure)
INSERT INTO mold_tryout_conditions (tryout_id, category, name, unit, order_index)
SELECT 0, 'pressure', name, 'bar', order_index FROM (VALUES
  ('사출압력', 10),
  ('보압 1단', 11),
  ('보압 2단', 12),
  ('보압 3단', 13),
  ('배압', 14)
) AS t(name, order_index)
WHERE NOT EXISTS (SELECT 1 FROM mold_tryout_conditions WHERE tryout_id = 0 AND category = 'pressure');

-- 속도 조건 (Speed)
INSERT INTO mold_tryout_conditions (tryout_id, category, name, unit, order_index)
SELECT 0, 'speed', name, 'mm/s', order_index FROM (VALUES
  ('사출속도 1단', 20),
  ('사출속도 2단', 21),
  ('사출속도 3단', 22),
  ('스크류 회전수', 23)
) AS t(name, order_index)
WHERE NOT EXISTS (SELECT 1 FROM mold_tryout_conditions WHERE tryout_id = 0 AND category = 'speed');

-- 시간 조건 (Time)
INSERT INTO mold_tryout_conditions (tryout_id, category, name, unit, order_index)
SELECT 0, 'time', name, 'sec', order_index FROM (VALUES
  ('사출시간', 30),
  ('보압시간', 31),
  ('냉각시간', 32),
  ('총 싸이클 타임', 33)
) AS t(name, order_index)
WHERE NOT EXISTS (SELECT 1 FROM mold_tryout_conditions WHERE tryout_id = 0 AND category = 'time');

-- =====================================================
-- 뷰: TRY-OUT 상세 (불량 집계 포함)
-- =====================================================

CREATE OR REPLACE VIEW v_mold_tryout_summary AS
SELECT 
  t.id,
  t.mold_id,
  t.trial_no,
  t.trial_date,
  t.status,
  t.overall_quality,
  t.is_mass_ready,
  
  -- 불량 집계
  COUNT(d.id) FILTER (WHERE d.severity = 'critical') AS critical_defects,
  COUNT(d.id) FILTER (WHERE d.severity = 'major') AS major_defects,
  COUNT(d.id) FILTER (WHERE d.severity = 'minor') AS minor_defects,
  COUNT(d.id) FILTER (WHERE d.severity != 'none') AS total_defects,
  COUNT(d.id) FILTER (WHERE d.is_resolved = FALSE AND d.severity != 'none') AS unresolved_defects,
  
  -- 파일 집계
  COUNT(f.id) AS file_count,
  
  t.created_by,
  t.created_at,
  t.approved_by,
  t.approved_at
  
FROM mold_tryout t
LEFT JOIN mold_tryout_defects d ON t.id = d.tryout_id
LEFT JOIN mold_tryout_files f ON t.id = f.tryout_id
GROUP BY t.id;

COMMENT ON TABLE mold_tryout IS '금형육성(TRY-OUT) 헤더';
COMMENT ON TABLE mold_tryout_conditions IS '성형 조건 (온도/압력/속도/시간)';
COMMENT ON TABLE mold_tryout_defects IS '품질 평가 / 불량 기록';
COMMENT ON TABLE mold_tryout_files IS '사진/파일 첨부';
COMMENT ON TABLE mold_tryout_history IS 'TRY-OUT 변경 이력';
COMMENT ON VIEW v_mold_tryout_summary IS 'TRY-OUT 요약 (불량/파일 집계)';
