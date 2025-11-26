# 데이터베이스 업데이트 가이드

## 🎯 목적
Railway PostgreSQL 데이터베이스에 `mold_specifications` 테이블의 `mold_id` 컬럼을 추가합니다.

---

## 📋 실행 방법

### 방법 1: Railway CLI 사용 (권장)

```bash
# 1. Railway CLI 설치 (미설치 시)
npm install -g @railway/cli

# 2. Railway 로그인
railway login

# 3. 프로젝트 연결
railway link

# 4. SQL 스크립트 실행
railway run psql < server/sql/add-mold-id-column.sql
```

### 방법 2: Railway 웹 대시보드 사용

1. **Railway 대시보드 접속**
   - https://railway.app 로그인
   - 프로젝트 선택: `CAMS Mold Management System`

2. **PostgreSQL 서비스 선택**
   - 좌측 메뉴에서 PostgreSQL 클릭

3. **Query 탭 선택**
   - 상단 탭에서 "Query" 선택

4. **SQL 실행**
   - 아래 SQL을 복사하여 붙여넣기
   - "Execute" 버튼 클릭

```sql
-- mold_specifications 테이블에 mold_id 컬럼 추가
ALTER TABLE mold_specifications 
ADD COLUMN IF NOT EXISTS mold_id INTEGER;

-- 외래 키 제약 조건 추가
ALTER TABLE mold_specifications
ADD CONSTRAINT fk_mold_specifications_mold_id
FOREIGN KEY (mold_id) 
REFERENCES molds(id)
ON UPDATE CASCADE
ON DELETE SET NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_mold_specifications_mold_id 
ON mold_specifications(mold_id);

-- 컬럼 코멘트 추가
COMMENT ON COLUMN mold_specifications.mold_id IS '연동된 금형 마스터 ID';

-- 기존 데이터 업데이트
UPDATE mold_specifications ms
SET mold_id = m.id
FROM molds m
WHERE m.specification_id = ms.id
AND ms.mold_id IS NULL;
```

5. **결과 확인**
```sql
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
```

### 방법 3: psql 직접 접속

```bash
# Railway에서 DATABASE_URL 환경변수 복사 후
psql "postgresql://postgres:password@host:port/database"

# SQL 파일 실행
\i server/sql/add-mold-id-column.sql
```

---

## ✅ 확인 사항

### 1. 컬럼 추가 확인
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'mold_specifications'
AND column_name = 'mold_id';
```

**예상 결과**:
```
 column_name | data_type | is_nullable
-------------+-----------+-------------
 mold_id     | integer   | YES
```

### 2. 외래 키 확인
```sql
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'mold_specifications'
AND kcu.column_name = 'mold_id';
```

**예상 결과**:
```
 constraint_name                        | table_name            | column_name | foreign_table_name | foreign_column_name
----------------------------------------+-----------------------+-------------+--------------------+---------------------
 fk_mold_specifications_mold_id         | mold_specifications   | mold_id     | molds              | id
```

### 3. 인덱스 확인
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'mold_specifications'
AND indexname = 'idx_mold_specifications_mold_id';
```

### 4. 데이터 연동 확인
```sql
-- mold_id가 제대로 연동되었는지 확인
SELECT 
    COUNT(*) as total_specs,
    COUNT(mold_id) as specs_with_mold,
    COUNT(*) - COUNT(mold_id) as specs_without_mold
FROM mold_specifications;
```

---

## 🔄 롤백 방법

문제 발생 시 아래 SQL로 롤백:

```sql
-- 인덱스 제거
DROP INDEX IF EXISTS idx_mold_specifications_mold_id;

-- 외래 키 제약 제거
ALTER TABLE mold_specifications
DROP CONSTRAINT IF EXISTS fk_mold_specifications_mold_id;

-- 컬럼 제거
ALTER TABLE mold_specifications
DROP COLUMN IF EXISTS mold_id;
```

---

## 📊 영향 범위

### 영향받는 테이블
- `mold_specifications` (컬럼 추가)

### 영향받는 관계
- `mold_specifications` ↔ `molds` (양방향 참조)

### 영향받는 API
- `POST /api/v1/mold-specifications` (금형 등록)
- `GET /api/v1/mold-specifications` (금형 목록)
- `GET /api/v1/mold-specifications/:id` (금형 상세)

---

## ⚠️ 주의사항

1. **데이터 백업**: 실행 전 데이터베이스 백업 권장
2. **다운타임**: 컬럼 추가는 매우 빠르므로 다운타임 거의 없음
3. **기존 데이터**: NULL 허용이므로 기존 데이터에 영향 없음
4. **자동 업데이트**: UPDATE 문이 기존 데이터를 자동으로 연동

---

## 🚀 실행 후 작업

1. **서버 재시작**
   ```bash
   # Railway가 자동으로 재시작하거나
   # 수동으로 재시작
   railway restart
   ```

2. **API 테스트**
   - 금형 신규 등록 테스트
   - 금형 목록 조회 테스트
   - 금형 상세 조회 테스트

3. **프론트엔드 테스트**
   - https://bountiful-nurturing-production-cd5c.up.railway.app/molds/new
   - 금형 등록 폼 작성 및 제출
   - QR 코드 생성 확인

---

## 📞 문제 발생 시

1. **에러 로그 확인**
   ```bash
   railway logs
   ```

2. **데이터베이스 연결 확인**
   ```bash
   railway run psql -c "SELECT version();"
   ```

3. **롤백 실행** (위의 롤백 방법 참조)

---

**작성일**: 2024-11-26  
**작성자**: Cascade AI  
**버전**: 1.0
