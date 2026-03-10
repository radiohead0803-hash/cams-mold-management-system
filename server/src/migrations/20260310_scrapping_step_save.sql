-- 폐기 요청 단계별 임시저장 지원을 위한 마이그레이션
-- scrapping_requests 테이블에 current_step 컬럼 추가
-- status에 'draft' 값 허용 (기존: requested, first_approved, approved, rejected, scrapped)

-- current_step 컬럼 추가 (단계별 임시저장 위치 기록)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scrapping_requests' AND column_name = 'current_step'
  ) THEN
    ALTER TABLE scrapping_requests ADD COLUMN current_step VARCHAR(50);
  END IF;
END $$;

-- rejection_reason 컬럼 추가 (반려 사유 별도 저장)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scrapping_requests' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE scrapping_requests ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- mold_id를 NULL 허용으로 변경 (draft 시 금형 미선택 가능)
DO $$ BEGIN
  ALTER TABLE scrapping_requests ALTER COLUMN mold_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- reason을 NULL 허용으로 변경 (draft 시 사유 미선택 가능)
DO $$ BEGIN
  ALTER TABLE scrapping_requests ALTER COLUMN reason DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scrapping_requests' 
ORDER BY ordinal_position;
