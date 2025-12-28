-- 테스트용 QR 금형 데이터 추가
-- QR 로그인 페이지에서 사용할 테스트 금형

-- QR-MOLD-001, QR-MOLD-002 추가
INSERT INTO molds (
  mold_code,
  mold_name,
  plant_id,
  maker_id,
  status,
  shot_counter,
  max_shots,
  created_at,
  updated_at
) VALUES
  (
    'QR-MOLD-001',
    'QR 테스트 금형 #001',
    1,  -- 생산공장1
    1,  -- A제작소
    'active',
    5000,
    100000,
    NOW(),
    NOW()
  ),
  (
    'QR-MOLD-002',
    'QR 테스트 금형 #002',
    1,  -- 생산공장1
    1,  -- A제작소
    'active',
    8000,
    100000,
    NOW(),
    NOW()
  ),
  (
    'QR-MOLD-003',
    'QR 테스트 금형 #003',
    2,  -- 생산공장2
    2,  -- B제작소
    'active',
    3000,
    100000,
    NOW(),
    NOW()
  )
ON CONFLICT (mold_code) DO UPDATE SET
  mold_name = EXCLUDED.mold_name,
  updated_at = NOW();

-- 확인 쿼리
SELECT 
  mold_code,
  mold_name,
  status,
  shot_counter
FROM molds
WHERE mold_code LIKE 'QR-MOLD-%'
ORDER BY mold_code;
