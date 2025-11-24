# 배포 노트 - 제작처/생산처 통합 관리 시스템

## 배포 일시
- **날짜**: 2024년 11월 24일
- **커밋**: c9fc622
- **브랜치**: main

## 배포 내용

### 1. 새로운 기능
- ✅ 제작처/생산처 통합 관리 시스템
- ✅ companies 테이블 및 API
- ✅ company_type 구분 (maker/plant)
- ✅ 회사 CRUD 작업
- ✅ 통계 조회 기능
- ✅ 샘플 데이터 시더

### 2. 데이터베이스 변경사항
```sql
-- 새 테이블
CREATE TABLE companies (...);

-- 기존 테이블 수정
ALTER TABLE users ADD COLUMN company_id INTEGER REFERENCES companies(id);
ALTER TABLE molds ADD COLUMN maker_company_id INTEGER REFERENCES companies(id);
ALTER TABLE molds ADD COLUMN plant_company_id INTEGER REFERENCES companies(id);
ALTER TABLE mold_specifications ADD COLUMN maker_company_id INTEGER REFERENCES companies(id);
ALTER TABLE mold_specifications ADD COLUMN plant_company_id INTEGER REFERENCES companies(id);
```

### 3. 새로운 API 엔드포인트
- `GET /api/v1/companies` - 회사 목록 조회
- `GET /api/v1/companies/:id` - 회사 상세 조회
- `POST /api/v1/companies` - 회사 등록
- `PATCH /api/v1/companies/:id` - 회사 정보 수정
- `DELETE /api/v1/companies/:id` - 회사 비활성화
- `GET /api/v1/companies/:id/stats` - 회사 통계 조회

## Railway 배포 후 작업

### 1. 마이그레이션 실행 (필수)
Railway 대시보드에서 다음 명령어를 실행해야 합니다:

```bash
npm run migrate
```

또는 Railway CLI 사용:
```bash
railway run npm run migrate
```

### 2. 샘플 데이터 시딩 (선택)
테스트용 샘플 데이터를 추가하려면:

```bash
npm run seed
```

### 3. 배포 확인
다음 엔드포인트로 배포 상태를 확인하세요:

```bash
# Health Check
curl https://your-railway-app.up.railway.app/health

# 회사 목록 조회 (인증 필요)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-railway-app.up.railway.app/api/v1/companies
```

## 배포 체크리스트

### Railway 대시보드에서 확인
- [ ] 빌드 성공 확인
- [ ] 배포 완료 확인
- [ ] 로그에서 에러 없는지 확인
- [ ] 마이그레이션 실행 완료
- [ ] 데이터베이스 연결 확인

### API 테스트
- [ ] GET /health 응답 확인
- [ ] GET /api/v1/companies 동작 확인
- [ ] POST /api/v1/companies 동작 확인
- [ ] 기존 API 정상 동작 확인

### 데이터베이스 확인
```sql
-- companies 테이블 생성 확인
SELECT * FROM companies LIMIT 5;

-- 컬럼 추가 확인
SELECT company_id FROM users LIMIT 1;
SELECT maker_company_id, plant_company_id FROM molds LIMIT 1;
```

## 롤백 방법 (문제 발생 시)

### 1. Git 롤백
```bash
git revert c9fc622
git push origin main
```

### 2. 데이터베이스 롤백
```bash
# Railway에서 실행
npm run migrate:undo
```

### 3. Railway 이전 버전으로 복구
Railway 대시보드에서 이전 배포 버전을 선택하여 복구할 수 있습니다.

## 주의사항

1. **마이그레이션 필수**: 배포 후 반드시 마이그레이션을 실행해야 합니다.
2. **기존 데이터 영향**: 기존 users, molds, mold_specifications 테이블에 새 컬럼이 추가됩니다.
3. **NULL 허용**: 새로 추가된 company_id 컬럼들은 NULL을 허용하므로 기존 데이터는 영향받지 않습니다.
4. **점진적 마이그레이션**: 기존 데이터를 새 구조로 점진적으로 이전할 수 있습니다.

## 다음 단계

1. **데이터 마이그레이션**: 기존 maker_id, plant_id 데이터를 company_id로 이전
2. **프론트엔드 통합**: 회사 관리 UI 구현
3. **테스트**: 통합 테스트 및 E2E 테스트
4. **모니터링**: 새 API 사용량 및 성능 모니터링

## 문제 해결

### 마이그레이션 실패 시
```bash
# 마이그레이션 상태 확인
npm run migrate:status

# 특정 마이그레이션만 실행
npx sequelize-cli db:migrate --to 20251124000000-create-companies-table.js
```

### API 오류 시
1. Railway 로그 확인
2. 데이터베이스 연결 확인
3. 환경 변수 확인 (DATABASE_URL)
4. 모델 로딩 확인

## 연락처
문제 발생 시 개발팀에 연락하세요.

---

**배포 완료**: ✅ Git 푸시 완료, Railway 자동 배포 진행 중
