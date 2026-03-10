-- 승인 메모 컬럼 추가
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='first_approval_notes') THEN
    ALTER TABLE scrapping_requests ADD COLUMN first_approval_notes TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name='second_approval_notes') THEN
    ALTER TABLE scrapping_requests ADD COLUMN second_approval_notes TEXT;
  END IF;
END $$;

SELECT column_name, data_type FROM information_schema.columns WHERE table_name='scrapping_requests' AND column_name IN ('first_approval_notes','second_approval_notes');
