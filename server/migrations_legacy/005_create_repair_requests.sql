-- 수리요청 헤더 테이블
CREATE TABLE IF NOT EXISTS repair_requests (
  id                    BIGSERIAL PRIMARY KEY,
  mold_id               BIGINT NOT NULL REFERENCES molds(id),
  plant_id              BIGINT REFERENCES plants(id),
  checklist_instance_id BIGINT REFERENCES checklist_instances(id),
  status                VARCHAR(20) NOT NULL DEFAULT 'requested',
  priority              VARCHAR(10) NOT NULL DEFAULT 'normal',
  request_type          VARCHAR(20) NOT NULL,
  requested_by          BIGINT,
  requested_role        VARCHAR(20),
  title                 VARCHAR(200) NOT NULL,
  description           TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- 수리요청 NG 항목 상세 테이블
CREATE TABLE IF NOT EXISTS repair_request_items (
  id                  BIGSERIAL PRIMARY KEY,
  repair_request_id   BIGINT NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
  checklist_answer_id BIGINT REFERENCES checklist_answers(id),
  item_label          VARCHAR(200) NOT NULL,
  item_section        VARCHAR(50),
  value_text          TEXT,
  value_bool          BOOLEAN,
  is_ng               BOOLEAN DEFAULT TRUE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_repair_requests_mold_id ON repair_requests(mold_id);
CREATE INDEX IF NOT EXISTS idx_repair_requests_status ON repair_requests(status);
CREATE INDEX IF NOT EXISTS idx_repair_requests_checklist_instance_id ON repair_requests(checklist_instance_id);
CREATE INDEX IF NOT EXISTS idx_repair_request_items_repair_request_id ON repair_request_items(repair_request_id);

-- 코멘트
COMMENT ON TABLE repair_requests IS '수리요청 헤더 (NG 발생 시 자동 생성)';
COMMENT ON TABLE repair_request_items IS '수리요청 NG 항목 상세';

COMMENT ON COLUMN repair_requests.status IS 'requested | accepted | in_progress | done | rejected';
COMMENT ON COLUMN repair_requests.priority IS 'low | normal | high';
COMMENT ON COLUMN repair_requests.request_type IS 'ng_repair | preventive | modification';
COMMENT ON COLUMN repair_requests.requested_role IS 'production | maker | hq';
