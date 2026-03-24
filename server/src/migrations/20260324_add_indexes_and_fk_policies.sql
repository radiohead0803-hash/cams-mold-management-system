-- ============================================================
-- 마이그레이션: 인덱스 추가 및 FK ON DELETE 정책 보완
-- 날짜: 2026-03-24
-- 목적: 쿼리 성능 개선 및 참조 무결성 강화
-- ============================================================

-- ========================
-- 1. 누락된 인덱스 추가
-- ========================

-- scrapping_requests 테이블 인덱스
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_scrapping_requests_status') THEN
    CREATE INDEX idx_scrapping_requests_status ON scrapping_requests(status);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_scrapping_requests_mold_id') THEN
    CREATE INDEX idx_scrapping_requests_mold_id ON scrapping_requests(mold_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_scrapping_requests_requested_at') THEN
    CREATE INDEX idx_scrapping_requests_requested_at ON scrapping_requests(requested_at DESC);
  END IF;
END $$;

-- production_transfer_requests 테이블 인덱스
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_production_transfer_requests_status') THEN
    CREATE INDEX idx_production_transfer_requests_status ON production_transfer_requests(status);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_production_transfer_requests_mold_id') THEN
    CREATE INDEX idx_production_transfer_requests_mold_id ON production_transfer_requests(mold_id);
  END IF;
END $$;

-- daily_checks 복합 인덱스 (자주 함께 조회되는 컬럼)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_daily_checks_mold_date') THEN
    CREATE INDEX idx_daily_checks_mold_date ON daily_checks(mold_id, check_date DESC);
  END IF;
END $$;

-- repair_requests 복합 인덱스
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_repair_requests_mold_status') THEN
    CREATE INDEX idx_repair_requests_mold_status ON repair_requests(mold_id, status);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_repair_requests_request_date') THEN
    CREATE INDEX idx_repair_requests_request_date ON repair_requests(request_date DESC);
  END IF;
END $$;

-- transfers 복합 인덱스
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transfers_mold_status') THEN
    CREATE INDEX idx_transfers_mold_status ON transfers(mold_id, status);
  END IF;
END $$;

-- inspections 복합 인덱스
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inspections_mold_type_date') THEN
    CREATE INDEX idx_inspections_mold_type_date ON inspections(mold_id, inspection_type, inspection_date DESC);
  END IF;
END $$;

-- checklist_instances 복합 인덱스
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_checklist_instances_mold_category') THEN
    CREATE INDEX idx_checklist_instances_mold_category ON checklist_instances(mold_id, category, status);
  END IF;
END $$;

-- alerts 인덱스 (읽지 않은 알림 조회용)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_alerts_user_read') THEN
    CREATE INDEX idx_alerts_user_read ON alerts(user_id, is_read, created_at DESC);
  END IF;
END $$;

-- mold_specifications.mold_id 인덱스
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_mold_specifications_mold_id') THEN
    CREATE INDEX idx_mold_specifications_mold_id ON mold_specifications(mold_id);
  END IF;
END $$;

-- ========================
-- 2. FK ON DELETE 정책 보완
-- ========================

-- production_transfer_checklist_items → production_transfer_requests
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'production_transfer_checklist_items_transfer_request_id_fkey'
    AND table_name = 'production_transfer_checklist_items'
  ) THEN
    ALTER TABLE production_transfer_checklist_items
      DROP CONSTRAINT production_transfer_checklist_items_transfer_request_id_fkey;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'production_transfer_checklist_items' AND column_name = 'transfer_request_id') THEN
    ALTER TABLE production_transfer_checklist_items
      ADD CONSTRAINT production_transfer_checklist_items_transfer_request_id_fkey
      FOREIGN KEY (transfer_request_id) REFERENCES production_transfer_requests(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- scrapping_requests.mold_id → molds (RESTRICT: 폐기 진행중인 금형 삭제 방지)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'scrapping_requests_mold_id_fkey'
    AND table_name = 'scrapping_requests'
  ) THEN
    ALTER TABLE scrapping_requests
      DROP CONSTRAINT scrapping_requests_mold_id_fkey;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scrapping_requests' AND column_name = 'mold_id') THEN
    ALTER TABLE scrapping_requests
      ADD CONSTRAINT scrapping_requests_mold_id_fkey
      FOREIGN KEY (mold_id) REFERENCES molds(id) ON DELETE RESTRICT;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- scrapping_requests 사용자 참조 FK (SET NULL: 사용자 삭제 시 참조만 해제)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scrapping_requests' AND column_name = 'assessed_by') THEN
    -- 기존 FK 제거 (있으면)
    BEGIN
      ALTER TABLE scrapping_requests DROP CONSTRAINT IF EXISTS scrapping_requests_assessed_by_fkey;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    ALTER TABLE scrapping_requests
      ADD CONSTRAINT scrapping_requests_assessed_by_fkey
      FOREIGN KEY (assessed_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scrapping_requests' AND column_name = 'reviewed_by') THEN
    BEGIN
      ALTER TABLE scrapping_requests DROP CONSTRAINT IF EXISTS scrapping_requests_reviewed_by_fkey;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    ALTER TABLE scrapping_requests
      ADD CONSTRAINT scrapping_requests_reviewed_by_fkey
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scrapping_requests' AND column_name = 'first_approved_by') THEN
    BEGIN
      ALTER TABLE scrapping_requests DROP CONSTRAINT IF EXISTS scrapping_requests_first_approved_by_fkey;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    ALTER TABLE scrapping_requests
      ADD CONSTRAINT scrapping_requests_first_approved_by_fkey
      FOREIGN KEY (first_approved_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scrapping_requests' AND column_name = 'second_approved_by') THEN
    BEGIN
      ALTER TABLE scrapping_requests DROP CONSTRAINT IF EXISTS scrapping_requests_second_approved_by_fkey;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    ALTER TABLE scrapping_requests
      ADD CONSTRAINT scrapping_requests_second_approved_by_fkey
      FOREIGN KEY (second_approved_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
