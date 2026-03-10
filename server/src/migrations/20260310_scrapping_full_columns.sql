-- 폐기 요청 전체 워크플로 지원을 위한 컬럼 추가
-- 기존 테이블: id, mold_id, request_number, reason, requested_by, requested_at, status,
--   approved_by, approved_at, rejection_reason, scrapped_at, notes, attachments, 
--   created_at, updated_at, current_step

-- reason_detail (상세 사유)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='reason_detail') THEN
    ALTER TABLE scrapping_requests ADD COLUMN reason_detail TEXT;
  END IF;
END $$;

-- current_shots (현재 타수 스냅샷)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='current_shots') THEN
    ALTER TABLE scrapping_requests ADD COLUMN current_shots INTEGER DEFAULT 0;
  END IF;
END $$;

-- target_shots (목표 타수 스냅샷)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='target_shots') THEN
    ALTER TABLE scrapping_requests ADD COLUMN target_shots INTEGER;
  END IF;
END $$;

-- condition_assessment (상태 평가)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='condition_assessment') THEN
    ALTER TABLE scrapping_requests ADD COLUMN condition_assessment VARCHAR(50);
  END IF;
END $$;

-- repair_history_summary (수리 이력 요약)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='repair_history_summary') THEN
    ALTER TABLE scrapping_requests ADD COLUMN repair_history_summary TEXT;
  END IF;
END $$;

-- estimated_scrap_value (예상 잔존가치)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='estimated_scrap_value') THEN
    ALTER TABLE scrapping_requests ADD COLUMN estimated_scrap_value NUMERIC(12,2);
  END IF;
END $$;

-- 1차 승인 관련
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='first_approved_by') THEN
    ALTER TABLE scrapping_requests ADD COLUMN first_approved_by INTEGER REFERENCES users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='first_approved_at') THEN
    ALTER TABLE scrapping_requests ADD COLUMN first_approved_at TIMESTAMP;
  END IF;
END $$;

-- 2차 승인 관련
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='second_approved_by') THEN
    ALTER TABLE scrapping_requests ADD COLUMN second_approved_by INTEGER REFERENCES users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='second_approved_at') THEN
    ALTER TABLE scrapping_requests ADD COLUMN second_approved_at TIMESTAMP;
  END IF;
END $$;

-- 폐기 처리자
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='scrapped_by') THEN
    ALTER TABLE scrapping_requests ADD COLUMN scrapped_by INTEGER REFERENCES users(id);
  END IF;
END $$;

-- 폐기 처리 관련 (disposal_method, disposal_company, disposal_cost, disposal_certificate)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='disposal_method') THEN
    ALTER TABLE scrapping_requests ADD COLUMN disposal_method VARCHAR(100);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='disposal_company') THEN
    ALTER TABLE scrapping_requests ADD COLUMN disposal_company VARCHAR(200);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='disposal_cost') THEN
    ALTER TABLE scrapping_requests ADD COLUMN disposal_cost NUMERIC(12,2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='disposal_certificate') THEN
    ALTER TABLE scrapping_requests ADD COLUMN disposal_certificate VARCHAR(200);
  END IF;
END $$;

-- 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scrapping_requests' 
ORDER BY ordinal_position;
