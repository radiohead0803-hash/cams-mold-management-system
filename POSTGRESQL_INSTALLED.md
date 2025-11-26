# ✅ PostgreSQL 설치 완료!

## 🎉 설치 정보

- **버전**: PostgreSQL 17.7
- **설치 경로**: `C:\Program Files\PostgreSQL\17`
- **psql 경로**: `C:\Program Files\PostgreSQL\17\bin\psql.exe`

---

## ⚠️ Railway CLI 제한사항

Railway CLI의 `railway run` 명령어가 로컬 PostgreSQL의 psql을 제대로 인식하지 못합니다.

이는 Railway가 자체 환경에서 명령을 실행하기 때문입니다.

---

## 🎯 해결 방법: Railway 웹 인터페이스 사용

PostgreSQL이 설치되었지만, **Railway 웹 대시보드에서 SQL을 직접 실행하는 것이 가장 확실합니다**.

### 📝 실행 단계

1. **Railway 접속**
   ```
   https://railway.app
   ```

2. **프로젝트 선택**
   - `abundant-freedom` 클릭

3. **Postgres 서비스 클릭**

4. **Data 탭 또는 Connect 버튼 찾기**
   - `Data` 탭: SQL 입력창이 있음
   - `Connect` 버튼: 연결 정보 확인 가능

5. **SQL 실행** (아래 전체 복사)

```sql
-- ========================================
-- mold_specifications 테이블 업데이트
-- ========================================

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
    'Update Complete' as status,
    COUNT(*) as total_specs,
    COUNT(mold_id) as specs_with_mold_id,
    COUNT(*) - COUNT(mold_id) as specs_without_mold_id
FROM mold_specifications;
```

---

## 🔧 대안: DBeaver 사용 (추천)

PostgreSQL이 설치되었으므로, DBeaver 같은 GUI 도구를 사용하는 것이 더 편리합니다.

### 1. DBeaver 설치

```powershell
winget install DBeaver.DBeaver
```

### 2. Railway 연결 정보 가져오기

```bash
cd server
railway variables | findstr DATABASE_PUBLIC_URL
```

### 3. DBeaver에서 연결

1. New Database Connection → PostgreSQL
2. Railway의 DATABASE_PUBLIC_URL 정보 입력
   - Host: `switchyard.proxy.rlwy.net`
   - Port: `34950`
   - Database: `railway`
   - Username: `postgres`
   - Password: (Railway Variables에서 확인)

3. SQL Editor에서 위의 SQL 실행

---

## 📊 설치된 도구

### PostgreSQL 17.7
- ✅ psql 명령줄 도구
- ✅ pgAdmin 4 (GUI 도구)
- ✅ PostgreSQL 서버 (로컬)

### 사용 가능한 명령어

```bash
# psql 버전 확인
"C:\Program Files\PostgreSQL\17\bin\psql.exe" --version

# pgAdmin 실행
"C:\Program Files\PostgreSQL\17\pgAdmin 4\bin\pgAdmin4.exe"
```

---

## ✅ 다음 단계

1. **Railway 웹 대시보드에서 SQL 실행** (가장 쉬움)
   - 위의 SQL 복사 & 붙여넣기

2. **또는 DBeaver 설치** (GUI 선호시)
   - 더 편리한 데이터베이스 관리

3. **실행 후 확인**
   - 금형 등록 페이지 테스트
   - https://bountiful-nurturing-production-cd5c.up.railway.app/molds/new

---

## 📞 요약

- ✅ PostgreSQL 17.7 설치 완료
- ⚠️ Railway CLI 제한으로 직접 실행 불가
- 🎯 **Railway 웹 대시보드 사용 권장**
- 🔧 또는 DBeaver 같은 GUI 도구 사용

---

**작성**: 2024-11-26  
**PostgreSQL 버전**: 17.7  
**설치 위치**: C:\Program Files\PostgreSQL\17
