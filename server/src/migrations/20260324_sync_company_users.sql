-- 사내 사용자 동기화는 JS 스크립트(sync-users.js)로 처리
-- 이 파일은 department, position 컬럼 추가용
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
