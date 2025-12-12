-- 사내사용자 데이터 삽입
-- 생성일: 2025-12-12

-- 비밀번호는 아이디와 동일 (bcrypt 해시: $2a$10$... 형태로 별도 처리 필요)
-- 여기서는 임시로 'temp_password' 사용, 스크립트에서 bcrypt로 변환

INSERT INTO users (username, employee_id, name, department, position, factory, email, phone, user_type, permission_class, is_active, is_password_changed, approval_status, password_hash, created_at, updated_at)
SELECT * FROM (VALUES
('203104', '203104', '강문숙', '자재관리팀', '-', '(주)캠스', '', '062-573-0077', 'mold_developer', 'user', true, false, 'approved', 'temp', NOW(), NOW()),
('102042', '102042', '강민구', '품질기술반', '-', '(주)캠스', '', '971-7165', 'mold_developer', 'user', true, false, 'approved', 'temp', NOW(), NOW()),
('103130', '103130', '강성주', '연구개발팀', '-', '(주)캠스', '', '055-643-4278', 'mold_developer', 'user', true, false, 'approved', 'temp', NOW(), NOW()),
('103359', '103359', '강영권', '설계개발팀', '-', '(주)캠스', '', '016-748-8390', 'mold_developer', 'user', true, false, 'approved', 'temp', NOW(), NOW()),
('102027', '102027', '강을원', 'PU조립반', '-', '(주)캠스', 'kho2218@daum.net', '062-971-2219', 'mold_developer', 'user', true, false, 'approved', 'temp', NOW(), NOW())
) AS t(username, employee_id, name, department, position, factory, email, phone, user_type, permission_class, is_active, is_password_changed, approval_status, password_hash, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.username = t.username);
