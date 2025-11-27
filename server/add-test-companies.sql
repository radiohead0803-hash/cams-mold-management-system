-- 테스트 회사 데이터 추가 (이미 있으면 무시)

-- ID 2: 제작처
INSERT INTO companies (id, company_name, company_code, company_type, manager_name, manager_phone, created_at, updated_at)
VALUES (2, 'A제작소', 'MAKER-001', 'maker', '김제작', '010-1234-5678', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  company_name = EXCLUDED.company_name,
  company_code = EXCLUDED.company_code,
  company_type = EXCLUDED.company_type;

-- ID 3: 제작처
INSERT INTO companies (id, company_name, company_code, company_type, manager_name, manager_phone, created_at, updated_at)
VALUES (3, 'B제작소', 'MAKER-002', 'maker', '이제작', '010-2345-6789', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  company_name = EXCLUDED.company_name,
  company_code = EXCLUDED.company_code,
  company_type = EXCLUDED.company_type;

-- ID 4: 생산처
INSERT INTO companies (id, company_name, company_code, company_type, manager_name, manager_phone, created_at, updated_at)
VALUES (4, 'A공장', 'PLANT-001', 'plant', '박생산', '010-3456-7890', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  company_name = EXCLUDED.company_name,
  company_code = EXCLUDED.company_code,
  company_type = EXCLUDED.company_type;

-- ID 8: 생산처
INSERT INTO companies (id, company_name, company_code, company_type, manager_name, manager_phone, created_at, updated_at)
VALUES (8, 'B공장', 'PLANT-002', 'plant', '최생산', '010-4567-8901', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  company_name = EXCLUDED.company_name,
  company_code = EXCLUDED.company_code,
  company_type = EXCLUDED.company_type;

-- 시퀀스 업데이트 (다음 ID가 9부터 시작하도록)
SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));
