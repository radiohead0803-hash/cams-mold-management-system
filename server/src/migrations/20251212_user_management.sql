-- 사용자 관리 시스템 확장
-- 생성일: 2025-12-12

-- 1. users 테이블 확장 (사내 사용자 + 협력사 사용자 통합)
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(20);          -- 사번
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);          -- 부서명
ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(50);             -- 직급
ALTER TABLE users ADD COLUMN IF NOT EXISTS factory VARCHAR(100);             -- 공장
ALTER TABLE users ADD COLUMN IF NOT EXISTS permission_class VARCHAR(20) DEFAULT 'user';  -- 권한 클래스: admin, manager, user, viewer
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_password_changed BOOLEAN DEFAULT FALSE;   -- 비밀번호 변경 여부
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_at TIMESTAMP;      -- 비밀번호 초기화 일시
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved'; -- 승인상태: pending, approved, rejected
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by INTEGER;              -- 승인자 ID
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;            -- 승인일시
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;            -- 거부 사유

-- 2. 협력사 사용자 전용 컬럼
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_type VARCHAR(20);         -- 협력사 구분: maker(제작처), plant(생산처)
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_code VARCHAR(20);         -- 업체코드 (자동부여)
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_contact VARCHAR(20);      -- 연락처
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_address TEXT;             -- 주소

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_permission_class ON users(permission_class);
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
CREATE INDEX IF NOT EXISTS idx_users_partner_type ON users(partner_type);
CREATE INDEX IF NOT EXISTS idx_users_partner_code ON users(partner_code);

-- 4. 승인 요청 알림 테이블
CREATE TABLE IF NOT EXISTS user_approval_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type VARCHAR(20) NOT NULL,  -- 'new_user', 'permission_change', 'password_reset'
  request_data JSONB,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
  requested_at TIMESTAMP DEFAULT NOW(),
  processed_by INTEGER REFERENCES users(id),
  processed_at TIMESTAMP,
  process_note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_user ON user_approval_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON user_approval_requests(status);

-- 5. 권한 클래스 정의 테이블
CREATE TABLE IF NOT EXISTS permission_classes (
  id SERIAL PRIMARY KEY,
  class_code VARCHAR(20) UNIQUE NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  description TEXT,
  permissions JSONB,  -- 세부 권한 설정
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. 기본 권한 클래스 데이터 삽입
INSERT INTO permission_classes (class_code, class_name, description, permissions, sort_order)
VALUES 
  ('admin', '시스템관리자', '모든 기능 접근 가능', '{"all": true}', 1),
  ('manager', '관리자', '사용자 관리 및 승인 권한', '{"user_manage": true, "approval": true, "report": true}', 2),
  ('user', '일반사용자', '기본 업무 기능 사용', '{"read": true, "write": true}', 3),
  ('viewer', '조회전용', '데이터 조회만 가능', '{"read": true}', 4)
ON CONFLICT (class_code) DO NOTHING;

-- 7. 기존 사용자 데이터 업데이트
UPDATE users SET permission_class = 'admin' WHERE user_type = 'system_admin';
UPDATE users SET permission_class = 'manager' WHERE user_type = 'mold_developer';
UPDATE users SET permission_class = 'user' WHERE user_type IN ('maker', 'plant');
UPDATE users SET approval_status = 'approved' WHERE approval_status IS NULL;
UPDATE users SET is_password_changed = TRUE WHERE is_password_changed IS NULL;

COMMENT ON COLUMN users.employee_id IS '사번';
COMMENT ON COLUMN users.department IS '부서명';
COMMENT ON COLUMN users.position IS '직급';
COMMENT ON COLUMN users.factory IS '공장';
COMMENT ON COLUMN users.permission_class IS '권한 클래스: admin, manager, user, viewer';
COMMENT ON COLUMN users.approval_status IS '승인상태: pending, approved, rejected';
COMMENT ON COLUMN users.partner_type IS '협력사 구분: maker(제작처), plant(생산처)';
COMMENT ON COLUMN users.partner_code IS '업체코드 (자동부여)';
