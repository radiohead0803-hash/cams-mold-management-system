# 데이터베이스 업데이트 방법 (3가지)

## 🎯 방법 1: Railway 웹 인터페이스 (가장 쉬움) ⭐

### 단계별 안내

1. **Railway 접속**
   ```
   https://railway.app
   ```

2. **프로젝트 선택**
   - `abundant-freedom` 클릭

3. **Postgres 서비스 클릭**
   - Postgres 박스 클릭

4. **Data 탭 선택**
   - 상단 탭에서 `Data` 클릭
   - 또는 `Variables` 탭 옆에 있을 수 있습니다

5. **SQL 실행 방법**
   
   **방법 A: Data 탭에서 직접 실행**
   - Data 탭 내부에 SQL 입력창이 있습니다
   - 테이블 목록 위나 아래에 "Run SQL" 또는 "Query" 버튼

   **방법 B: Connect 버튼 사용**
   - Postgres 서비스 페이지에서 "Connect" 버튼 클릭
   - "Database URL" 복사
   - 아래 방법 3으로 진행

### 실행할 SQL

```sql
-- 전체 복사해서 한 번에 실행하세요
ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS mold_id INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_mold_specifications_mold_id') THEN
        ALTER TABLE mold_specifications
        ADD CONSTRAINT fk_mold_specifications_mold_id
        FOREIGN KEY (mold_id) REFERENCES molds(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mold_specifications_mold_id ON mold_specifications(mold_id);

UPDATE mold_specifications ms SET mold_id = m.id FROM molds m WHERE m.specification_id = ms.id AND ms.mold_id IS NULL;

SELECT COUNT(*) as total, COUNT(mold_id) as with_mold_id FROM mold_specifications;
```

---

## 🎯 방법 2: PostgreSQL 설치 후 CLI 사용

### 1. PostgreSQL 설치

**Windows**:
```
https://www.postgresql.org/download/windows/
```

또는 Chocolatey 사용:
```powershell
choco install postgresql
```

### 2. Railway에서 DATABASE_URL 복사

1. Railway → Postgres 서비스
2. `Variables` 탭 클릭
3. `DATABASE_URL` 값 복사

### 3. psql로 접속

```bash
# DATABASE_URL 형식: postgresql://user:password@host:port/database
psql "복사한_DATABASE_URL"
```

### 4. SQL 실행

```sql
\i C:/Users/admin/Documents/Wind surf work/10. 금형관리 전산시스템/P2/server/update.sql
```

또는 직접 입력:
```sql
ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS mold_id INTEGER;
-- ... (나머지 SQL)
```

---

## 🎯 방법 3: 온라인 PostgreSQL 클라이언트 사용

### 1. pgAdmin 웹 사용

Railway에서 pgAdmin 연결:
1. Railway → Postgres → Settings
2. "TCP Proxy" 정보 확인
3. pgAdmin에서 새 서버 추가

### 2. DBeaver 사용 (무료)

**다운로드**: https://dbeaver.io/download/

**연결 설정**:
1. New Database Connection → PostgreSQL
2. Railway의 DATABASE_URL 정보 입력
   - Host: `...railway.app`
   - Port: `5432`
   - Database: `railway`
   - Username: `postgres`
   - Password: (Railway Variables에서 확인)

3. SQL Editor에서 `update.sql` 실행

---

## 🎯 방법 4: Node.js 스크립트 (이미 생성됨)

```bash
cd server
npm run db:update
```

**주의**: Railway CLI 연결 문제로 작동하지 않을 수 있습니다.

---

## ✅ 실행 확인

어떤 방법을 사용하든 마지막에 이 쿼리로 확인:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
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

---

## 🆘 Railway Data 탭을 찾을 수 없는 경우

Railway UI가 업데이트되어 위치가 변경되었을 수 있습니다.

### 대안 1: Railway CLI로 환경 변수 확인

```bash
cd server
railway variables
```

`DATABASE_URL` 찾아서 복사 → 방법 2 또는 3 사용

### 대안 2: Railway Support 문의

Railway 대시보드 우측 하단의 "Help" 버튼 클릭

---

## 📞 추천 방법

1. **가장 쉬움**: Railway 웹 Data 탭 (방법 1)
2. **가장 확실**: DBeaver 설치 (방법 3)
3. **개발자용**: PostgreSQL + psql 설치 (방법 2)

---

**작성**: 2024-11-26  
**업데이트**: Railway UI 변경 대응
