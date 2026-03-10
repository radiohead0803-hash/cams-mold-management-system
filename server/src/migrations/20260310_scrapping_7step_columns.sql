-- 7단계 표준 폐기 절차를 위한 컬럼 추가
-- 2. 상태 평가 항목
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='appearance_condition') THEN
    ALTER TABLE scrapping_requests ADD COLUMN appearance_condition VARCHAR(50);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='functional_condition') THEN
    ALTER TABLE scrapping_requests ADD COLUMN functional_condition VARCHAR(50);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='dimensional_condition') THEN
    ALTER TABLE scrapping_requests ADD COLUMN dimensional_condition VARCHAR(50);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='assessment_notes') THEN
    ALTER TABLE scrapping_requests ADD COLUMN assessment_notes TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='assessed_by') THEN
    ALTER TABLE scrapping_requests ADD COLUMN assessed_by INTEGER REFERENCES users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='assessed_at') THEN
    ALTER TABLE scrapping_requests ADD COLUMN assessed_at TIMESTAMP;
  END IF;
END $$;

-- 3. 경제성 검토 항목
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='repair_cost_estimate') THEN
    ALTER TABLE scrapping_requests ADD COLUMN repair_cost_estimate NUMERIC(12,2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='new_mold_cost') THEN
    ALTER TABLE scrapping_requests ADD COLUMN new_mold_cost NUMERIC(12,2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='remaining_value') THEN
    ALTER TABLE scrapping_requests ADD COLUMN remaining_value NUMERIC(12,2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='review_result') THEN
    ALTER TABLE scrapping_requests ADD COLUMN review_result VARCHAR(50);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='review_notes') THEN
    ALTER TABLE scrapping_requests ADD COLUMN review_notes TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='reviewed_by') THEN
    ALTER TABLE scrapping_requests ADD COLUMN reviewed_by INTEGER REFERENCES users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='reviewed_at') THEN
    ALTER TABLE scrapping_requests ADD COLUMN reviewed_at TIMESTAMP;
  END IF;
END $$;

-- 7. 사후 관리 항목
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='asset_disposal_completed') THEN
    ALTER TABLE scrapping_requests ADD COLUMN asset_disposal_completed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='documentation_archived') THEN
    ALTER TABLE scrapping_requests ADD COLUMN documentation_archived BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='replacement_plan') THEN
    ALTER TABLE scrapping_requests ADD COLUMN replacement_plan TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='postcare_notes') THEN
    ALTER TABLE scrapping_requests ADD COLUMN postcare_notes TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='closed_at') THEN
    ALTER TABLE scrapping_requests ADD COLUMN closed_at TIMESTAMP;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='closed_by') THEN
    ALTER TABLE scrapping_requests ADD COLUMN closed_by INTEGER REFERENCES users(id);
  END IF;
END $$;

-- 확인
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'scrapping_requests' ORDER BY ordinal_position;
