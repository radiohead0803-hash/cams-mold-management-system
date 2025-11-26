# 🚀 빠른 시작 가이드

## ✅ Git 커밋 완료

코드 변경사항이 GitHub에 푸시되었고, Railway가 자동으로 재배포했습니다.

---

## ⚠️ 데이터베이스 업데이트 필요 (필수)

Railway 웹 대시보드에서 SQL을 실행해야 합니다.

### 📝 실행 방법

1. **Railway 대시보드 접속**
   - 🔗 https://railway.app
   - 프로젝트: `abundant-freedom` 선택

2. **PostgreSQL 서비스 → Query 탭**

3. **아래 SQL 복사 & 실행**

```sql
-- 1. 컬럼 추가
ALTER TABLE mold_specifications 
ADD COLUMN IF NOT EXISTS mold_id INTEGER;

-- 2. 외래 키 추가
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

-- 4. 기존 데이터 연동
UPDATE mold_specifications ms
SET mold_id = m.id
FROM molds m
WHERE m.specification_id = ms.id
AND ms.mold_id IS NULL;

-- 5. 확인
SELECT 
    COUNT(*) as total,
    COUNT(mold_id) as with_mold_id
FROM mold_specifications;
```

---

## 🎯 CLI 스크립트 사용 (대안)

### 방법 1: Railway CLI로 직접 실행

```bash
# server 폴더에서
cd server
railway run node update-database.js
```

### 방법 2: npm 스크립트 사용

```bash
# server 폴더에서
cd server
npm run db:update
```

### 롤백이 필요한 경우

```bash
cd server
railway run node rollback-database.js
# 또는
npm run db:rollback
```

---

## ✅ 완료 확인

### 1. Railway 로그 확인
```bash
railway logs --tail 50
```

에러 메시지가 사라졌는지 확인:
- ❌ `ERROR: column "mold_id" does not exist` → 사라져야 함

### 2. 웹사이트 테스트
- 🔗 https://bountiful-nurturing-production-cd5c.up.railway.app/molds/new
- 금형 등록 폼 작성
- 제작처/생산처 선택
- 등록 버튼 클릭
- ✅ QR 코드 자동 생성 확인

---

## 📁 생성된 파일

### 스크립트
- `server/update-database.js` - DB 업데이트 스크립트
- `server/rollback-database.js` - DB 롤백 스크립트

### 문서
- `CHANGELOG-20241126.md` - 상세 변경 이력
- `DATABASE_UPDATE_GUIDE.md` - DB 업데이트 가이드
- `DEPLOYMENT_INSTRUCTIONS.md` - 배포 안내
- `URGENT_ACTION_REQUIRED.md` - 긴급 조치 가이드
- `SUMMARY-20241126.md` - 작업 요약
- `QUICK_START.md` - 빠른 시작 가이드 (본 문서)

---

## 🆘 문제 해결

### Railway CLI 연결 오류
```
❌ getaddrinfo ENOTFOUND ...railway.app
```

**해결**: Railway 웹 대시보드에서 직접 SQL 실행 (위의 방법 참조)

### SQL 실행 오류
```
ERROR: constraint already exists
```

**해결**: 정상입니다. 이미 추가된 경우 무시됩니다.

---

## 📞 도움말

- **상세 가이드**: `DATABASE_UPDATE_GUIDE.md`
- **긴급 조치**: `URGENT_ACTION_REQUIRED.md`
- **변경 이력**: `CHANGELOG-20241126.md`

---

**작성**: 2024-11-26  
**예상 소요**: 5분
