# ⚠️ 긴급 조치 필요

## 🚨 현재 상태

### ✅ 완료된 작업
- [x] Git 커밋 완료 (커밋 ID: 5963cc9)
- [x] GitHub 푸시 완료
- [x] Railway 자동 재배포 완료

### ❌ 미완료 작업 (필수)
- [ ] **Railway PostgreSQL 데이터베이스 스키마 업데이트**

---

## 🔴 문제 상황

Railway 로그에서 다음 에러 발생:
```
ERROR: column "mold_id" does not exist at character 308
```

**원인**: 코드는 배포되었지만 데이터베이스에 `mold_id` 컬럼이 아직 추가되지 않음

**영향**: 
- ❌ 금형 등록 페이지 작동 불가
- ❌ 금형 목록 조회 오류
- ❌ 금형 상세 조회 오류

---

## 🎯 즉시 실행해야 할 작업

### Railway 웹 대시보드에서 SQL 실행

1. **Railway 대시보드 접속**
   - 🔗 https://railway.app
   - 로그인 후 프로젝트 `abundant-freedom` 선택

2. **PostgreSQL 서비스 선택**
   - 좌측 메뉴에서 "Postgres" 클릭

3. **Query 탭 선택**
   - 상단 탭에서 "Query" 클릭

4. **아래 SQL 전체 복사 & 붙여넣기**

```sql
-- ========================================
-- Railway PostgreSQL 스키마 업데이트
-- 실행 날짜: 2024-11-26
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
    'mold_id 컬럼 추가 완료' as status,
    COUNT(*) as total_specs,
    COUNT(mold_id) as specs_with_mold_id
FROM mold_specifications;
```

5. **"Execute" 또는 "Run" 버튼 클릭**

6. **결과 확인**
   - ✅ 성공 메시지 확인
   - ✅ 확인 쿼리 결과에서 `specs_with_mold_id` 확인

---

## ✅ 실행 후 확인 사항

### 1. 데이터베이스 확인
Railway Query 탭에서 실행:
```sql
-- 컬럼 존재 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'mold_specifications'
AND column_name = 'mold_id';
```

예상 결과:
```
column_name | data_type | is_nullable
------------+-----------+-------------
mold_id     | integer   | YES
```

### 2. 서버 로그 확인
```bash
railway logs --tail 50
```

에러가 사라졌는지 확인

### 3. 웹사이트 테스트
- 🔗 https://bountiful-nurturing-production-cd5c.up.railway.app/molds/new
- 금형 등록 폼 작성
- 제작처/생산처 선택
- 등록 버튼 클릭
- QR 코드 생성 확인

---

## 📊 예상 소요 시간

- SQL 실행: **1분**
- 서버 재시작: **자동** (필요 없음)
- 테스트: **2-3분**

**총 소요 시간: 약 5분**

---

## 🆘 문제 발생 시

### SQL 실행 오류
```
ERROR: constraint "fk_mold_specifications_mold_id" already exists
```
→ **정상**: 이미 추가된 경우 (무시 가능)

### 외래 키 오류
```
ERROR: insert or update on table violates foreign key constraint
```
→ **해결**: 기존 데이터 정리 필요 (문의 필요)

### 권한 오류
```
ERROR: permission denied
```
→ **해결**: Railway 프로젝트 소유자 권한 확인

---

## 📞 연락처

문제 발생 시:
1. Railway 로그 캡처
2. 에러 메시지 복사
3. 개발팀에 문의

---

## 📚 관련 문서

- `DEPLOYMENT_INSTRUCTIONS.md` - 상세 배포 가이드
- `DATABASE_UPDATE_GUIDE.md` - DB 업데이트 가이드
- `server/sql/add-mold-id-column.sql` - 원본 SQL 스크립트

---

**작성 시간**: 2024-11-26 13:07 (KST)  
**우선순위**: 🔴 **최고 (긴급)**  
**예상 소요**: ⏱️ **5분**
