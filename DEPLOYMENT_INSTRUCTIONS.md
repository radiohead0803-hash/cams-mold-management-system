# 🚀 Railway 배포 완료 안내

## ✅ Git 커밋 및 푸시 완료

```
커밋 ID: 5963cc9
브랜치: main
상태: ✅ 푸시 완료
```

**변경 파일**:
- `server/src/models/MoldSpecification.js`
- `server/src/controllers/moldSpecificationController.js`
- `server/src/migrations/20241126-add-mold-id-to-specifications.js`
- `server/sql/add-mold-id-column.sql`
- 문서 3개 (CHANGELOG, GUIDE, SUMMARY)

---

## 🗄️ Railway 데이터베이스 업데이트 필요

Railway가 코드를 자동으로 재배포하지만, **데이터베이스 스키마 변경은 수동으로 실행해야 합니다**.

### 방법 1: Railway 웹 대시보드 (권장) ⭐

1. **Railway 대시보드 접속**
   - https://railway.app 로그인
   - 프로젝트: `abundant-freedom` 선택

2. **PostgreSQL 서비스 선택**
   - 좌측 메뉴에서 "Postgres" 클릭

3. **Query 탭 선택**
   - 상단 탭에서 "Query" 선택

4. **아래 SQL 복사 & 실행**

```sql
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

-- 5. 기존 데이터 업데이트
UPDATE mold_specifications ms
SET mold_id = m.id
FROM molds m
WHERE m.specification_id = ms.id
AND ms.mold_id IS NULL;

-- 6. 확인 쿼리
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

5. **"Execute" 버튼 클릭**

6. **결과 확인**
   - 마지막 SELECT 쿼리 결과에서 `mold_id`가 제대로 연동되었는지 확인

---

### 방법 2: Railway CLI (대안)

```bash
# Railway 프로젝트 연결 확인
railway status

# PostgreSQL 서비스 선택
railway service

# SQL 파일 실행 (psql 설치 필요)
railway run psql < server/sql/add-mold-id-column.sql
```

---

## 🔍 배포 상태 확인

### 1. Railway 배포 로그 확인
```bash
railway logs
```

### 2. 서비스 상태 확인
- Railway 대시보드 → Deployments 탭
- 최신 배포가 "Success" 상태인지 확인

### 3. API 테스트
```bash
# 금형 등록 테스트
curl -X POST https://bountiful-nurturing-production-cd5c.up.railway.app/api/v1/mold-specifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "part_number": "TEST-001",
    "part_name": "테스트 부품",
    "car_model": "K5",
    "maker_company_id": 1,
    "plant_company_id": 2
  }'
```

---

## ✅ 완료 체크리스트

- [x] Git 커밋 완료
- [x] Git 푸시 완료
- [ ] **Railway DB SQL 실행** ⚠️ (필수)
- [ ] Railway 서버 재배포 확인
- [ ] 금형 등록 페이지 테스트
- [ ] QR 코드 생성 확인

---

## 🎯 다음 단계

1. **Railway 대시보드에서 SQL 실행** (위의 방법 1 참조)
2. **서버 재시작 확인** (Railway가 자동으로 재시작)
3. **금형 등록 테스트**
   - URL: https://bountiful-nurturing-production-cd5c.up.railway.app/molds/new
   - 제작처/생산처 선택
   - 금형 등록 및 QR 코드 생성 확인

---

## 📞 문제 발생 시

### SQL 실행 오류
- 외래 키 제약 조건 오류 → 기존 제약 조건 확인 필요
- 컬럼 중복 오류 → 이미 추가된 경우 (정상)

### 서버 오류
```bash
# Railway 로그 확인
railway logs --tail 100
```

### 롤백 필요 시
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

## 📚 참고 문서

- `DATABASE_UPDATE_GUIDE.md` - 상세 DB 업데이트 가이드
- `CHANGELOG-20241126.md` - 변경 이력
- `SUMMARY-20241126.md` - 작업 요약

---

**배포 날짜**: 2024-11-26  
**배포자**: Cascade AI  
**상태**: 🟡 DB 업데이트 대기 중
