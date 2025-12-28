-- =====================================================
-- 금형 경도측정 시스템
-- 제작처 작성 → 본사 승인 구조
-- =====================================================

-- 1. 금형 재질별 경도 기준 테이블 (마스터)
CREATE TABLE IF NOT EXISTS hardness_material_std (
  id              SERIAL PRIMARY KEY,
  grade           TEXT NOT NULL UNIQUE,     -- S45C, HP4A, CENA G, SKD61...
  hardness_min    NUMERIC(4,1),             -- 최소 경도 (HRC)
  hardness_max    NUMERIC(4,1),             -- 최대 경도 (HRC)
  feature         TEXT,                     -- 특성, 비고
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_hardness_std_grade ON hardness_material_std(grade);
CREATE INDEX idx_hardness_std_active ON hardness_material_std(is_active);

-- 2. 금형 경도측정 헤더
CREATE TABLE IF NOT EXISTS mold_hardness (
  id              SERIAL PRIMARY KEY,
  mold_id         INTEGER NOT NULL REFERENCES molds(id),
  maker_id        INTEGER NOT NULL REFERENCES companies(id),
  status          VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, submitted, approved, rejected
  
  -- 기본 정보
  material        TEXT,                     -- 재질
  mold_type       TEXT,                     -- 형별
  ms_spec         TEXT,                     -- MS SPEC
  supply_type     TEXT,                     -- 공급 타입 (사출금형 등)
  mold_number     TEXT,                     -- M-2024-001
  mold_name       TEXT,                     -- 금형명
  cavity_count    INTEGER,                  -- 캐비티 수
  tonnage         INTEGER,                  -- 톤수
  remark          TEXT,                     -- 비고
  
  -- 상측(Cavity) 정보
  cavity_material TEXT,                     -- 상측 재질 (선택된 값)
  cavity_std_id   INTEGER REFERENCES hardness_material_std(id), -- 상측 기준
  cavity_image_url TEXT,                    -- 상측 사진
  cavity_avg_hrc  NUMERIC(4,1),             -- 상측 평균 HRC (자동 계산)
  
  -- 하측(Core) 정보
  core_material   TEXT,                     -- 하측 재질 (선택된 값)
  core_std_id     INTEGER REFERENCES hardness_material_std(id), -- 하측 기준
  core_image_url  TEXT,                     -- 하측 사진
  core_avg_hrc    NUMERIC(4,1),             -- 하측 평균 HRC (자동 계산)
  
  -- 승인 정보
  created_by      INTEGER NOT NULL REFERENCES users(id),
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_by      INTEGER REFERENCES users(id),
  updated_at      TIMESTAMP NOT NULL DEFAULT now(),
  submitted_at    TIMESTAMP,
  approved_by     INTEGER REFERENCES users(id),
  approved_at     TIMESTAMP,
  approval_comment TEXT                     -- 승인/반려 코멘트
);

CREATE INDEX idx_mold_hardness_mold ON mold_hardness(mold_id);
CREATE INDEX idx_mold_hardness_status ON mold_hardness(status);
CREATE INDEX idx_mold_hardness_maker ON mold_hardness(maker_id);

-- 3. 경도 측정값 (상측/하측 각 3포인트)
CREATE TABLE IF NOT EXISTS mold_hardness_measurements (
  id              SERIAL PRIMARY KEY,
  hardness_id     INTEGER NOT NULL REFERENCES mold_hardness(id) ON DELETE CASCADE,
  position        VARCHAR(20) NOT NULL,     -- 'cavity' or 'core'
  measure_no      INTEGER NOT NULL,         -- 1, 2, 3 (측정 #1~3)
  value_hrc       NUMERIC(4,1),             -- HRC 값
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now(),
  
  UNIQUE(hardness_id, position, measure_no)
);

CREATE INDEX idx_hardness_measurements_hardness ON mold_hardness_measurements(hardness_id);

-- 4. 경도측정 변경 이력
CREATE TABLE IF NOT EXISTS mold_hardness_history (
  id              SERIAL PRIMARY KEY,
  hardness_id     INTEGER NOT NULL REFERENCES mold_hardness(id) ON DELETE CASCADE,
  action          VARCHAR(20) NOT NULL,     -- created, updated, submitted, approved, rejected
  changed_by      INTEGER NOT NULL REFERENCES users(id),
  comment         TEXT,
  snapshot        JSONB,                    -- 변경 시점의 데이터 스냅샷
  created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_hardness_history_hardness ON mold_hardness_history(hardness_id);

-- =====================================================
-- 샘플 데이터: 금형 재질별 경도 기준
-- =====================================================

INSERT INTO hardness_material_std (grade, hardness_min, hardness_max, feature) VALUES
  ('S45C', 20.0, 25.0, '일반 구조용 탄소강'),
  ('S50C', 22.0, 28.0, '기계 구조용 탄소강'),
  ('S55C', 25.0, 30.0, '고강도 탄소강'),
  ('HP4A', 35.0, 41.0, '프리하든강 (Pre-hardened Steel)'),
  ('CENA G', 35.0, 41.0, '프리하든강'),
  ('NAK80', 37.0, 43.0, '프리하든 미러강'),
  ('P20', 28.0, 32.0, '플라스틱 금형용강'),
  ('SKD61', 48.0, 52.0, '열간 금형용강 (고온용)'),
  ('SKD11', 58.0, 62.0, '냉간 금형용강'),
  ('STD61', 48.0, 52.0, '열간 금형용강'),
  ('STAVAX', 52.0, 56.0, '스테인리스 미러강'),
  ('SUS420J2', 50.0, 54.0, '스테인리스강'),
  ('IMPAX SUPREME', 38.0, 42.0, '고경도 프리하든강'),
  ('RAMAX HH', 38.0, 42.0, '고경도 프리하든강'),
  ('CORRAX', 38.0, 42.0, '내식성 금형강');

-- =====================================================
-- 트리거: 평균 HRC 자동 계산
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_hardness_avg()
RETURNS TRIGGER AS $$
BEGIN
  -- 상측(Cavity) 평균 계산
  UPDATE mold_hardness
  SET cavity_avg_hrc = (
    SELECT AVG(value_hrc)
    FROM mold_hardness_measurements
    WHERE hardness_id = NEW.hardness_id
      AND position = 'cavity'
      AND value_hrc IS NOT NULL
  )
  WHERE id = NEW.hardness_id;
  
  -- 하측(Core) 평균 계산
  UPDATE mold_hardness
  SET core_avg_hrc = (
    SELECT AVG(value_hrc)
    FROM mold_hardness_measurements
    WHERE hardness_id = NEW.hardness_id
      AND position = 'core'
      AND value_hrc IS NOT NULL
  )
  WHERE id = NEW.hardness_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_hardness_avg
AFTER INSERT OR UPDATE ON mold_hardness_measurements
FOR EACH ROW
EXECUTE FUNCTION calculate_hardness_avg();

-- =====================================================
-- 뷰: 경도측정 상세 (기준 포함)
-- =====================================================

CREATE OR REPLACE VIEW v_mold_hardness_detail AS
SELECT 
  h.id,
  h.mold_id,
  h.maker_id,
  h.status,
  h.material,
  h.mold_type,
  h.mold_number,
  h.mold_name,
  
  -- 상측 정보
  h.cavity_material,
  h.cavity_avg_hrc,
  cavity_std.hardness_min AS cavity_min,
  cavity_std.hardness_max AS cavity_max,
  CASE 
    WHEN h.cavity_avg_hrc IS NULL THEN NULL
    WHEN h.cavity_avg_hrc >= cavity_std.hardness_min 
     AND h.cavity_avg_hrc <= cavity_std.hardness_max THEN 'OK'
    ELSE 'NG'
  END AS cavity_result,
  
  -- 하측 정보
  h.core_material,
  h.core_avg_hrc,
  core_std.hardness_min AS core_min,
  core_std.hardness_max AS core_max,
  CASE 
    WHEN h.core_avg_hrc IS NULL THEN NULL
    WHEN h.core_avg_hrc >= core_std.hardness_min 
     AND h.core_avg_hrc <= core_std.hardness_max THEN 'OK'
    ELSE 'NG'
  END AS core_result,
  
  h.created_by,
  h.created_at,
  h.approved_by,
  h.approved_at,
  h.approval_comment
  
FROM mold_hardness h
LEFT JOIN hardness_material_std cavity_std ON h.cavity_std_id = cavity_std.id
LEFT JOIN hardness_material_std core_std ON h.core_std_id = core_std.id;

COMMENT ON TABLE hardness_material_std IS '금형 재질별 경도 기준 (마스터)';
COMMENT ON TABLE mold_hardness IS '금형 경도측정 헤더';
COMMENT ON TABLE mold_hardness_measurements IS '경도 측정값 (상측/하측 각 3포인트)';
COMMENT ON TABLE mold_hardness_history IS '경도측정 변경 이력';
COMMENT ON VIEW v_mold_hardness_detail IS '경도측정 상세 (기준 포함, OK/NG 판정)';
