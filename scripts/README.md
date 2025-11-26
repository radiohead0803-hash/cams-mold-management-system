# 데이터베이스 관리 스크립트

Railway PostgreSQL 데이터베이스를 관리하기 위한 CLI 스크립트 모음입니다.

---

## 📋 스크립트 목록

### 1. `update-database.js`
mold_specifications 테이블에 mold_id 컬럼을 추가합니다.

### 2. `rollback-database.js`
mold_id 컬럼을 제거하고 이전 상태로 되돌립니다.

---

## 🚀 사용 방법

### 전제 조건

1. **Railway CLI 설치**
   ```bash
   npm install -g @railway/cli
   ```

2. **Railway 로그인**
   ```bash
   railway login
   ```

3. **프로젝트 연결**
   ```bash
   railway link
   ```

---

## 📝 데이터베이스 업데이트

### 방법 1: Railway CLI 사용 (권장)

```bash
# 프로젝트 루트에서 실행
railway run node scripts/update-database.js
```

### 방법 2: 로컬에서 실행 (DATABASE_URL 필요)

```bash
# .env 파일에 DATABASE_URL 설정 후
node scripts/update-database.js
```

### 실행 결과 예시

```
🚀 데이터베이스 업데이트 시작...

✅ 데이터베이스 연결 성공

📝 1. mold_id 컬럼 추가
   ✅ 완료

📝 2. 외래 키 제약 조건 추가
   ✅ 완료

📝 3. 인덱스 추가
   ✅ 완료

📝 4. 컬럼 코멘트 추가
   ✅ 완료

📝 5. 기존 데이터 업데이트
   ✅ 완료

📝 6. 결과 확인
   결과: { total_specs: '10', specs_with_mold_id: '10', specs_without_mold_id: '0' }

🎉 데이터베이스 업데이트 완료!

📊 최종 확인 쿼리 실행...
✅ mold_id 컬럼 확인: { column_name: 'mold_id', data_type: 'integer', is_nullable: 'YES' }

✅ 데이터베이스 연결 종료
```

---

## 🔄 데이터베이스 롤백

### 실행 방법

```bash
# Railway CLI 사용
railway run node scripts/rollback-database.js
```

### 확인 프롬프트

```
⚠️  데이터베이스 롤백 스크립트

이 스크립트는 다음 작업을 수행합니다:
- mold_specifications.mold_id 컬럼 제거
- 관련 인덱스 및 외래 키 제거

정말 롤백하시겠습니까? (yes/no): 
```

**주의**: `yes`를 입력해야만 롤백이 진행됩니다.

---

## 🛠️ 트러블슈팅

### 오류: DATABASE_URL 환경변수가 설정되지 않음

```bash
❌ DATABASE_URL 환경변수가 설정되지 않았습니다.
💡 Railway CLI로 실행하세요: railway run node scripts/update-database.js
```

**해결**: Railway CLI를 사용하여 실행하세요.

### 오류: 이미 존재하는 컬럼/제약조건

```bash
📝 2. 외래 키 제약 조건 추가
   ℹ️  이미 존재함 (스킵)
```

**해결**: 정상입니다. 이미 추가된 경우 자동으로 스킵됩니다.

### 오류: 연결 실패

```bash
❌ 데이터베이스 업데이트 실패: getaddrinfo ENOTFOUND
```

**해결**:
1. Railway 프로젝트가 올바르게 연결되었는지 확인
   ```bash
   railway status
   ```
2. PostgreSQL 서비스가 실행 중인지 확인

---

## 📊 수동 확인 쿼리

스크립트 실행 후 Railway 대시보드에서 직접 확인:

```sql
-- 컬럼 존재 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'mold_specifications'
AND column_name = 'mold_id';

-- 외래 키 확인
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'mold_specifications'
AND kcu.column_name = 'mold_id';

-- 데이터 연동 확인
SELECT 
    ms.id,
    ms.part_number,
    ms.mold_id,
    m.mold_code
FROM mold_specifications ms
LEFT JOIN molds m ON ms.mold_id = m.id
ORDER BY ms.id DESC
LIMIT 10;
```

---

## 🔐 보안 주의사항

1. **DATABASE_URL 노출 금지**
   - `.env` 파일은 절대 Git에 커밋하지 마세요
   - `.gitignore`에 `.env` 추가 확인

2. **프로덕션 데이터베이스 주의**
   - 프로덕션 환경에서는 반드시 백업 후 실행
   - 롤백 스크립트는 신중하게 사용

3. **Railway CLI 권한**
   - Railway 프로젝트 소유자 또는 관리자 권한 필요

---

## 📚 관련 문서

- `../DATABASE_UPDATE_GUIDE.md` - 상세 업데이트 가이드
- `../DEPLOYMENT_INSTRUCTIONS.md` - 배포 가이드
- `../URGENT_ACTION_REQUIRED.md` - 긴급 조치 가이드

---

**작성일**: 2024-11-26  
**버전**: 1.0
