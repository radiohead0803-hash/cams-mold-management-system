-- =====================================================
-- 금형사양(Mold Spec) 시스템
-- 개발 단계 데이터 통합 → 최종 사양 확정
-- =====================================================

-- 1. 금형사양 테이블
CREATE TABLE IF NOT EXISTS mold_spec (
  id              SERIAL PRIMARY KEY,
  mold_id         INTEGER NOT NULL UNIQUE REFERENCES molds(id),
  
  -- 기본 정보
  mold_name       TEXT,
  customer        TEXT,                     -- 고객사
  car_name        TEXT,                     -- 차종
  part_name       TEXT,                     -- 부품명
  part_no         TEXT,                     -- 부품 번호
  
  -- 구조/사양
  cavity_count    INTEGER,                  -- 캐비티 수
  mold_base       TEXT,                     -- 몰드베이스 타입
  runner_type     TEXT,                     -- Hot Runner / Cold Runner / Valve Gate
  gate_type       TEXT,                     -- 게이트 타입
  slide_cnt       INTEGER,                  -- 슬라이드 수
  lifter_cnt      INTEGER,                  -- 리프터 수
  
  -- 재질/열처리 (경도측정에서 자동 반영)
  cavity_material TEXT,                     -- 캐비티 재질
  core_material   TEXT,                     -- 코어 재질
  cavity_hardness_min NUMERIC(4,1),         -- 캐비티 경도 최소
  cavity_hardness_max NUMERIC(4,1),         -- 캐비티 경도 최대
  cavity_hardness_avg NUMERIC(4,1),         -- 캐비티 경도 평균
  core_hardness_min   NUMERIC(4,1),         -- 코어 경도 최소
  core_hardness_max   NUMERIC(4,1),         -- 코어 경도 최대
  core_hardness_avg   NUMERIC(4,1),         -- 코어 경도 평균
  
  -- 성형기/조건 (TRY-OUT에서 자동 반영)
  tonnage_min     INTEGER,                  -- 최소 톤수
  tonnage_max     INTEGER,                  -- 최대 톤수
  recommend_tonnage INTEGER,                -- 추천 톤수
  resin           TEXT,                     -- 수지
  resin_maker     TEXT,                     -- 수지 제조사
  color           TEXT,                     -- 색상
  shot_weight_g   NUMERIC(8,2),             -- 샷 중량 (g)
  cycle_sec       NUMERIC(6,2),             -- 싸이클 타임 (초)
  
  -- 성형 조건 상세
  melt_temp       NUMERIC(5,1),             -- 용융온도 (℃)
  mold_temp       NUMERIC(5,1),             -- 금형온도 (℃)
  injection_pressure NUMERIC(6,1),          -- 사출압력 (bar)
  hold_pressure   NUMERIC(6,1),             -- 보압 (bar)
  injection_speed NUMERIC(6,2),             -- 사출속도 (mm/s)
  cooling_time    NUMERIC(6,2),             -- 냉각시간 (sec)
  
  -- 기타
  remark          TEXT,                     -- 비고
  special_note    TEXT,                     -- 특이사항
  
  -- 상태 관리
  status          VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, submitted, locked
  
  -- 추적 정보
  created_by      INTEGER NOT NULL REFERENCES users(id),
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_by      INTEGER REFERENCES users(id),
  updated_at      TIMESTAMP NOT NULL DEFAULT now(),
  submitted_by    INTEGER REFERENCES users(id),
  submitted_at    TIMESTAMP,
  locked_by       INTEGER REFERENCES users(id),
  locked_at       TIMESTAMP,
  lock_comment    TEXT                      -- Lock 시 코멘트
);

CREATE INDEX idx_mold_spec_mold ON mold_spec(mold_id);
CREATE INDEX idx_mold_spec_status ON mold_spec(status);

-- 2. 금형사양 변경 이력
CREATE TABLE IF NOT EXISTS mold_spec_history (
  id              SERIAL PRIMARY KEY,
  spec_id         INTEGER NOT NULL REFERENCES mold_spec(id) ON DELETE CASCADE,
  action          VARCHAR(20) NOT NULL,     -- created, updated, submitted, locked, unlocked
  changed_by      INTEGER NOT NULL REFERENCES users(id),
  comment         TEXT,
  snapshot        JSONB,                    -- 변경 시점의 데이터 스냅샷
  created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_spec_history_spec ON mold_spec_history(spec_id);

-- =====================================================
-- 트리거: 개발 모듈 데이터 자동 반영
-- =====================================================

-- 경도측정 승인 시 금형사양에 자동 반영
CREATE OR REPLACE FUNCTION sync_hardness_to_spec()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- 금형사양 업데이트 (없으면 생성)
    INSERT INTO mold_spec (
      mold_id,
      cavity_material,
      core_material,
      cavity_hardness_avg,
      core_hardness_avg,
      created_by,
      status
    )
    VALUES (
      NEW.mold_id,
      NEW.cavity_material,
      NEW.core_material,
      NEW.cavity_avg_hrc,
      NEW.core_avg_hrc,
      NEW.approved_by,
      'draft'
    )
    ON CONFLICT (mold_id) DO UPDATE SET
      cavity_material = EXCLUDED.cavity_material,
      core_material = EXCLUDED.core_material,
      cavity_hardness_avg = EXCLUDED.cavity_hardness_avg,
      core_hardness_avg = EXCLUDED.core_hardness_avg,
      updated_by = EXCLUDED.created_by,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_hardness_to_spec
AFTER UPDATE ON mold_hardness
FOR EACH ROW
EXECUTE FUNCTION sync_hardness_to_spec();

-- TRY-OUT 승인 시 금형사양에 자동 반영 (use_as_mass_condition = true인 경우)
CREATE OR REPLACE FUNCTION sync_tryout_to_spec()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND NEW.use_as_mass_condition = TRUE AND 
     (OLD.status != 'approved' OR OLD.use_as_mass_condition != TRUE) THEN
    
    -- 금형사양 업데이트 (없으면 생성)
    INSERT INTO mold_spec (
      mold_id,
      recommend_tonnage,
      resin,
      resin_maker,
      color,
      shot_weight_g,
      cycle_sec,
      created_by,
      status
    )
    VALUES (
      NEW.mold_id,
      NEW.tonnage,
      NEW.resin,
      NEW.resin_maker,
      NEW.color,
      NEW.shot_weight_g,
      NEW.cycle_sec,
      NEW.approved_by,
      'draft'
    )
    ON CONFLICT (mold_id) DO UPDATE SET
      recommend_tonnage = EXCLUDED.recommend_tonnage,
      resin = EXCLUDED.resin,
      resin_maker = EXCLUDED.resin_maker,
      color = EXCLUDED.color,
      shot_weight_g = EXCLUDED.shot_weight_g,
      cycle_sec = EXCLUDED.cycle_sec,
      updated_by = EXCLUDED.created_by,
      updated_at = now();
    
    -- 성형 조건도 반영 (tryout_conditions에서 가져오기)
    UPDATE mold_spec ms
    SET
      melt_temp = (
        SELECT CAST(value AS NUMERIC)
        FROM mold_tryout_conditions
        WHERE tryout_id = NEW.id AND name LIKE '%용융온도%'
        LIMIT 1
      ),
      mold_temp = (
        SELECT CAST(value AS NUMERIC)
        FROM mold_tryout_conditions
        WHERE tryout_id = NEW.id AND name LIKE '%금형온도%'
        LIMIT 1
      ),
      hold_pressure = (
        SELECT CAST(value AS NUMERIC)
        FROM mold_tryout_conditions
        WHERE tryout_id = NEW.id AND name LIKE '%보압%'
        LIMIT 1
      ),
      cooling_time = (
        SELECT CAST(value AS NUMERIC)
        FROM mold_tryout_conditions
        WHERE tryout_id = NEW.id AND name LIKE '%냉각시간%'
        LIMIT 1
      ),
      updated_at = now()
    WHERE ms.mold_id = NEW.mold_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_tryout_to_spec
AFTER UPDATE ON mold_tryout
FOR EACH ROW
EXECUTE FUNCTION sync_tryout_to_spec();

-- =====================================================
-- 뷰: 금형사양 상세 (개발 모듈 연동 상태 포함)
-- =====================================================

CREATE OR REPLACE VIEW v_mold_spec_detail AS
SELECT 
  ms.id,
  ms.mold_id,
  ms.mold_name,
  ms.customer,
  ms.car_name,
  ms.part_name,
  ms.part_no,
  ms.cavity_count,
  ms.status,
  
  -- 개발 모듈 승인 상태
  (SELECT status FROM mold_dev_plan WHERE mold_id = ms.mold_id) AS dev_plan_status,
  (SELECT COUNT(*) FROM checklist_instances WHERE mold_id = ms.mold_id AND status = 'approved') AS checklist_approved_count,
  (SELECT status FROM mold_hardness WHERE mold_id = ms.mold_id) AS hardness_status,
  (SELECT COUNT(*) FROM mold_tryout WHERE mold_id = ms.mold_id AND status = 'approved') AS tryout_approved_count,
  
  -- 개발 완료 여부
  CASE 
    WHEN ms.status = 'locked' THEN TRUE
    ELSE FALSE
  END AS is_ready_for_mass,
  
  ms.created_by,
  ms.created_at,
  ms.locked_by,
  ms.locked_at
  
FROM mold_spec ms;

COMMENT ON TABLE mold_spec IS '금형사양 (개발 단계 데이터 통합)';
COMMENT ON TABLE mold_spec_history IS '금형사양 변경 이력';
COMMENT ON VIEW v_mold_spec_detail IS '금형사양 상세 (개발 모듈 연동 상태 포함)';
