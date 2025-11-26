-- mold_specifications 테이블에 mold_id 컬럼 추가
-- 실행 날짜: 2024-11-26

-- 1. mold_id 컬럼 추가
ALTER TABLE mold_specifications 
ADD COLUMN IF NOT EXISTS mold_id INTEGER;

-- 2. 외래 키 제약 조건 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_mold_specifications_mold_id'
    ) THEN
        ALTER TABLE mold_specifications
        ADD CONSTRAINT fk_mold_specifications_mold_id
        FOREIGN KEY (mold_id) 
        REFERENCES molds(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;
    END IF;
END $$;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_mold_specifications_mold_id 
ON mold_specifications(mold_id);

-- 4. 컬럼 코멘트 추가
COMMENT ON COLUMN mold_specifications.mold_id IS '연동된 금형 마스터 ID';

-- 5. 기존 데이터 업데이트
UPDATE mold_specifications ms
SET mold_id = m.id
FROM molds m
WHERE m.specification_id = ms.id
AND ms.mold_id IS NULL;

-- 6. 확인 쿼리
SELECT 
    'mold_id 컬럼 추가 완료' as status,
    COUNT(*) as total_specs,
    COUNT(mold_id) as specs_with_mold_id,
    COUNT(*) - COUNT(mold_id) as specs_without_mold_id
FROM mold_specifications;
