-- T/O(Try-Out) 문제점 등록 및 개선 추적 테이블
CREATE TABLE IF NOT EXISTS tryout_issues (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER NOT NULL REFERENCES molds(id),
  mold_spec_id INTEGER REFERENCES mold_specifications(id),
  
  -- T/O 정보
  tryout_number INTEGER NOT NULL DEFAULT 1,
  tryout_date DATE NOT NULL,
  
  -- 문제점 정보
  issue_code VARCHAR(50),
  issue_category VARCHAR(50) NOT NULL,
  issue_title VARCHAR(200) NOT NULL,
  issue_description TEXT,
  issue_location VARCHAR(200),
  severity VARCHAR(20) DEFAULT 'medium',
  
  -- 첨부파일
  issue_image_url TEXT,
  issue_image_filename VARCHAR(255),
  
  -- 개선 정보
  improvement_status VARCHAR(30) DEFAULT 'pending',
  improvement_action TEXT,
  improvement_date DATE,
  improvement_image_url TEXT,
  improvement_image_filename VARCHAR(255),
  improved_by INTEGER REFERENCES users(id),
  
  -- 검증 정보
  verification_status VARCHAR(20),
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_remarks TEXT,
  
  -- 양산이관 연동
  transfer_check_required BOOLEAN DEFAULT TRUE,
  transfer_checked BOOLEAN DEFAULT FALSE,
  transfer_checked_by INTEGER REFERENCES users(id),
  transfer_checked_at TIMESTAMP WITH TIME ZONE,
  
  -- 비고
  remarks TEXT,
  
  -- 등록 정보
  registered_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tryout_issues_mold ON tryout_issues(mold_id);
CREATE INDEX IF NOT EXISTS idx_tryout_issues_tryout ON tryout_issues(tryout_number);
CREATE INDEX IF NOT EXISTS idx_tryout_issues_status ON tryout_issues(improvement_status);
CREATE INDEX IF NOT EXISTS idx_tryout_issues_category ON tryout_issues(issue_category);

-- 문제 카테고리 설명
COMMENT ON COLUMN tryout_issues.issue_category IS '문제 카테고리: dimension(치수), appearance(외관), function(기능), cycle(사이클), quality(품질), other(기타)';
COMMENT ON COLUMN tryout_issues.severity IS '심각도: critical(치명), major(중대), medium(보통), minor(경미)';
COMMENT ON COLUMN tryout_issues.improvement_status IS '개선 상태: pending(대기), in_progress(진행중), resolved(해결), deferred(보류), not_applicable(해당없음)';
COMMENT ON COLUMN tryout_issues.verification_status IS '검증 상태: pending(대기), passed(통과), failed(실패)';
