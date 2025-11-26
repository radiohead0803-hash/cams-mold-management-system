# 🎯 마지막 단계 - Railway 데이터베이스 업데이트

## ✅ 완료된 작업

- [x] 코드 수정 완료
- [x] Git 커밋 및 푸시 완료
- [x] Railway 자동 재배포 완료
- [x] CLI 스크립트 생성 완료

## ⚠️ 남은 작업 (1개만!)

**Railway PostgreSQL에 SQL 실행** - 약 2분 소요

---

## 🚀 실행 방법

### 📍 Railway 웹 대시보드 (가장 확실한 방법)

1. **Railway 대시보드 접속**
   ```
   https://railway.app
   ```

2. **프로젝트 선택**
   - `abundant-freedom` 클릭

3. **PostgreSQL 서비스 선택**
   - 좌측 메뉴에서 "Postgres" 클릭

4. **Query 탭 선택**
   - 상단 탭에서 "Query" 클릭

5. **SQL 복사 & 실행**
   - 아래 SQL 전체 복사
   - Query 창에 붙여넣기
   - "Execute" 또는 "Run" 버튼 클릭

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
    'mold_id 컬럼 추가 완료' as status,
    COUNT(*) as total_specs,
    COUNT(mold_id) as specs_with_mold_id,
    COUNT(*) - COUNT(mold_id) as specs_without_mold_id
FROM mold_specifications;
```

6. **결과 확인**
   - 마지막 SELECT 쿼리 결과 확인
   - `specs_with_mold_id` 숫자가 표시되면 성공!

---

## ✅ 완료 후 확인

### 1. Railway 로그 확인

```bash
railway logs --tail 50
```

**확인 사항**:
- ❌ `ERROR: column "mold_id" does not exist` → 사라져야 함
- ✅ 에러 없이 정상 작동

### 2. 웹사이트 테스트

**URL**: https://bountiful-nurturing-production-cd5c.up.railway.app/molds/new

**테스트 순서**:
1. 금형 등록 페이지 접속
2. 기본 정보 입력
   - 부품번호: `TEST-001`
   - 부품명: `테스트 부품`
   - 차종: `K5`
3. 제작처 선택
4. 생산처 선택
5. 등록 버튼 클릭
6. ✅ **QR 코드 자동 생성 확인**
7. ✅ **성공 메시지 확인**

---

## 📊 예상 결과

### SQL 실행 성공 시

```
ALTER TABLE
DO
CREATE INDEX
COMMENT
UPDATE 10
```

### 확인 쿼리 결과

```
status                    | total_specs | specs_with_mold_id | specs_without_mold_id
--------------------------+-------------+--------------------+----------------------
mold_id 컬럼 추가 완료    | 10          | 10                 | 0
```

---

## 🆘 문제 발생 시

### 에러: constraint already exists

```sql
ERROR: constraint "fk_mold_specifications_mold_id" already exists
```

**해결**: 정상입니다. 이미 추가된 경우이므로 무시하세요.

### 에러: column already exists

```sql
ERROR: column "mold_id" already exists
```

**해결**: 정상입니다. 이미 추가된 경우이므로 무시하세요.

### 에러: permission denied

```sql
ERROR: permission denied for table mold_specifications
```

**해결**: Railway 프로젝트 소유자 권한이 필요합니다. 프로젝트 소유자에게 문의하세요.

---

## 📞 추가 도움말

### 관련 문서
- `QUICK_START.md` - 빠른 시작 가이드
- `DATABASE_UPDATE_GUIDE.md` - 상세 DB 업데이트 가이드
- `CHANGELOG-20241126.md` - 변경 이력
- `server/update.sql` - SQL 스크립트 파일

### CLI 스크립트 (대안)
```bash
cd server
npm run db:update
```

**주의**: Railway CLI 연결 문제로 작동하지 않을 수 있습니다.

---

## 🎉 완료 후

모든 작업이 완료되면:

1. ✅ 금형 등록 페이지 정상 작동
2. ✅ QR 코드 자동 생성
3. ✅ 제작처/생산처 정보 저장
4. ✅ 데이터베이스 양방향 참조 완성

---

**작성**: 2024-11-26  
**예상 소요**: 2분  
**난이도**: ⭐ 매우 쉬움 (복사 & 붙여넣기)
