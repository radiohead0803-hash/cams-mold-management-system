-- ============================================================
-- 마이그레이션: DB 감사 누락 테이블 및 인덱스 생성
-- 날짜: 2026-03-26
-- 목적: drafts, mold_events, approvals 테이블 생성 및 누락 인덱스 추가
-- ============================================================

-- ========================
-- 1. drafts 테이블 (임시저장)
-- ========================
CREATE TABLE IF NOT EXISTS drafts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  draft_key VARCHAR(100) NOT NULL,
  draft_id VARCHAR(100) NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE drafts IS '임시저장 데이터 테이블';
COMMENT ON COLUMN drafts.draft_key IS '메뉴 키 (periodic_inspection, scrapping, transfer, maintenance 등)';
COMMENT ON COLUMN drafts.draft_id IS '식별자 (moldId 또는 new)';
COMMENT ON COLUMN drafts.data IS '임시저장 데이터 (JSON)';
COMMENT ON COLUMN drafts.expires_at IS '만료일 (7일 후 자동 삭제용)';

-- drafts 유니크 인덱스 (user_id + draft_key + draft_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_drafts_user_key_id
  ON drafts(user_id, draft_key, draft_id);

-- ========================
-- 2. mold_events 테이블 (금형 Life-cycle 이력)
-- ========================

-- ENUM 타입 생성 (이미 존재하면 무시)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_mold_events_event_type') THEN
    CREATE TYPE enum_mold_events_event_type AS ENUM (
      'created',
      'status_changed',
      'inspection_daily',
      'inspection_periodic',
      'inspection_cleaning',
      'inspection_greasing',
      'repair_requested',
      'repair_started',
      'repair_completed',
      'transfer_requested',
      'transfer_approved',
      'transfer_completed',
      'scrapping_requested',
      'scrapping_approved',
      'scrapping_completed',
      'shot_count_updated',
      'location_changed',
      'specification_updated',
      'document_uploaded',
      'approval_requested',
      'approval_completed',
      'note_added'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS mold_events (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER NOT NULL,
  mold_code VARCHAR(50),
  event_type enum_mold_events_event_type NOT NULL,
  reference_id INTEGER,
  reference_table VARCHAR(100),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  previous_value VARCHAR(500),
  new_value VARCHAR(500),
  actor_id INTEGER,
  actor_name VARCHAR(100),
  actor_company VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE mold_events IS '금형 Life-cycle 이벤트 이력 테이블';
COMMENT ON COLUMN mold_events.event_type IS '이벤트 유형';
COMMENT ON COLUMN mold_events.reference_id IS '참조 ID (관련 테이블의 ID)';
COMMENT ON COLUMN mold_events.reference_table IS '참조 테이블명';

-- mold_events 인덱스
CREATE INDEX IF NOT EXISTS idx_mold_events_mold_id ON mold_events(mold_id);
CREATE INDEX IF NOT EXISTS idx_mold_events_mold_code ON mold_events(mold_code);
CREATE INDEX IF NOT EXISTS idx_mold_events_event_type ON mold_events(event_type);
CREATE INDEX IF NOT EXISTS idx_mold_events_created_at ON mold_events(created_at);
CREATE INDEX IF NOT EXISTS idx_mold_events_actor_id ON mold_events(actor_id);

-- ========================
-- 3. approvals 테이블 (통합 승인)
-- ========================

-- ENUM 타입 생성 (이미 존재하면 무시)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_approvals_approval_type') THEN
    CREATE TYPE enum_approvals_approval_type AS ENUM (
      'checklist_revision',
      'document_publish',
      'transfer_approval',
      'scrapping_approval',
      'repair_liability',
      'inspection_approval'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_approvals_status') THEN
    CREATE TYPE enum_approvals_status AS ENUM (
      'pending', 'approved', 'rejected', 'cancelled'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_approvals_priority') THEN
    CREATE TYPE enum_approvals_priority AS ENUM (
      'low', 'normal', 'high', 'critical'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS approvals (
  id SERIAL PRIMARY KEY,
  approval_type enum_approvals_approval_type NOT NULL,
  target_id INTEGER NOT NULL,
  target_table VARCHAR(100) NOT NULL,
  status enum_approvals_status DEFAULT 'pending',
  title VARCHAR(200) NOT NULL,
  description TEXT,
  requester_id INTEGER NOT NULL,
  requester_name VARCHAR(100),
  requester_company VARCHAR(100),
  requested_at TIMESTAMP DEFAULT NOW(),
  approver_id INTEGER,
  approver_name VARCHAR(100),
  processed_at TIMESTAMP,
  comment TEXT,
  priority enum_approvals_priority DEFAULT 'normal',
  due_date TIMESTAMP,
  mold_code VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE approvals IS '통합 승인 요청 테이블';
COMMENT ON COLUMN approvals.approval_type IS '승인 유형';
COMMENT ON COLUMN approvals.target_id IS '대상 ID (각 유형별 원본 테이블의 ID)';
COMMENT ON COLUMN approvals.target_table IS '대상 테이블명 (참조용)';
COMMENT ON COLUMN approvals.priority IS '우선순위';
COMMENT ON COLUMN approvals.due_date IS 'SLA 마감일 (승인 기한)';

-- approvals 인덱스
CREATE INDEX IF NOT EXISTS idx_approvals_approval_type ON approvals(approval_type);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_requester_id ON approvals(requester_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_requested_at ON approvals(requested_at);
CREATE INDEX IF NOT EXISTS idx_approvals_due_date ON approvals(due_date);
CREATE INDEX IF NOT EXISTS idx_approvals_mold_code ON approvals(mold_code);

-- ========================
-- 4. 누락 인덱스 추가 (기존 테이블)
-- ========================

-- users 테이블: company_id 인덱스
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- users 테이블: company_id + is_active 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_users_company_active ON users(company_id, is_active);

-- notifications 테이블: 읽지 않은 알림 부분 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id) WHERE is_read = false;

-- molds 테이블: 활성 금형 부분 인덱스
CREATE INDEX IF NOT EXISTS idx_molds_status_active
  ON molds(status) WHERE status = 'active';

-- daily_check_items 테이블: mold_id 인덱스 (테이블 존재 시에만)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'daily_check_items'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_daily_check_items_mold ON daily_check_items(mold_id)';
  END IF;
END
$$;

-- ========================
-- 5. 누락 외래키 제약조건 (users.company_id → companies.id)
-- ========================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_users_company_id'
      AND table_name = 'users'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_company_id
      FOREIGN KEY (company_id) REFERENCES companies(id)
      ON DELETE SET NULL;
  END IF;
END
$$;
