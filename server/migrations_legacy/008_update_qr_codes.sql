-- 모든 금형에 QR 코드 업데이트 (MOLD-{id} 형식)
-- mold_specifications 테이블에 qr_code 컬럼이 없으면 추가

-- qr_code 컬럼 추가 (없는 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mold_specifications' AND column_name = 'qr_code'
    ) THEN
        ALTER TABLE mold_specifications ADD COLUMN qr_code VARCHAR(50);
    END IF;
END $$;

-- qr_url 컬럼 추가 (QR 스캔 시 접속할 URL)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mold_specifications' AND column_name = 'qr_url'
    ) THEN
        ALTER TABLE mold_specifications ADD COLUMN qr_url VARCHAR(255);
    END IF;
END $$;

-- 모든 금형에 QR 코드 업데이트 (MOLD-{id} 형식)
UPDATE mold_specifications 
SET qr_code = CONCAT('MOLD-', id)
WHERE qr_code IS NULL OR qr_code = '';

-- QR URL 업데이트 (외부 QR 스캔 앱에서 접속할 URL)
-- Railway 배포 URL 기준
UPDATE mold_specifications 
SET qr_url = CONCAT('https://spirited-liberation-production-1a4d.up.railway.app/m/qr/MOLD-', id)
WHERE qr_url IS NULL OR qr_url = '';

-- 인덱스 추가 (QR 코드 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_mold_specifications_qr_code ON mold_specifications(qr_code);

-- 확인
SELECT id, mold_code, part_name, qr_code, qr_url FROM mold_specifications ORDER BY id;
