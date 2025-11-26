-- mold_specifications 테이블에 mold_id 컬럼 추가
-- 실행 날짜: 2024-11-26

-- 1. mold_id 컬럼 추가
ALTER TABLE mold_specifications 
ADD COLUMN IF NOT EXISTS mold_id INTEGER;

-- 2. 외래 키 제약 조건 추가
ALTER TABLE mold_specifications
ADD CONSTRAINT fk_mold_specifications_mold_id
FOREIGN KEY (mold_id) 
REFERENCES molds(id)
ON UPDATE CASCADE
ON DELETE SET NULL;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_mold_specifications_mold_id 
ON mold_specifications(mold_id);

-- 4. 컬럼 코멘트 추가
COMMENT ON COLUMN mold_specifications.mold_id IS '연동된 금형 마스터 ID';

-- 5. 기존 데이터 업데이트 (molds 테이블의 specification_id를 기반으로)
UPDATE mold_specifications ms
SET mold_id = m.id
FROM molds m
WHERE m.specification_id = ms.id
AND ms.mold_id IS NULL;

-- 확인 쿼리
SELECT 
    ms.id,
    ms.part_number,
    ms.part_name,
    ms.mold_id,
    m.mold_code,
    m.qr_token
FROM mold_specifications ms
LEFT JOIN molds m ON ms.mold_id = m.id
ORDER BY ms.id DESC
LIMIT 10;
