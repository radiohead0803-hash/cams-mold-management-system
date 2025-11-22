# Railway Database Setup Guide

## 🚀 Railway를 이용한 PostgreSQL 데이터베이스 구축

### 1. Railway 프로젝트 생성

1. [Railway.app](https://railway.app) 접속 및 로그인
2. "New Project" 클릭
3. "Provision PostgreSQL" 선택

### 2. 데이터베이스 연결 정보 확인

Railway 대시보드에서 PostgreSQL 서비스 클릭 후 "Connect" 탭에서 확인:

```
DATABASE_URL=postgresql://username:password@host:port/database
```

또는 개별 정보:
```
PGHOST=your-host.railway.app
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your-password
PGDATABASE=railway
```

### 3. 환경 변수 설정

#### 서버 `.env` 파일 생성

`server/.env` 파일 생성:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# 또는 개별 설정
DB_HOST=your-host.railway.app
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=your-password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://your-frontend-domain.com
```

### 4. 데이터베이스 마이그레이션 실행

#### 방법 1: Railway CLI 사용

```bash
# Railway CLI 설치
npm install -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 연결
railway link

# 마이그레이션 실행
railway run psql < server/migrations/001_initial_schema.sql
```

#### 방법 2: Railway 대시보드 사용

1. Railway 대시보드에서 PostgreSQL 서비스 선택
2. "Data" 탭 클릭
3. "Query" 버튼 클릭
4. `server/migrations/001_initial_schema.sql` 파일 내용 복사하여 붙여넣기
5. "Run Query" 실행

#### 방법 3: 로컬에서 psql 사용

```bash
# psql 설치 후
psql "postgresql://username:password@host:port/database" < server/migrations/001_initial_schema.sql
```

### 5. 서버 배포

#### Railway에 서버 배포

1. Railway 대시보드에서 "New Service" 클릭
2. "GitHub Repo" 선택하여 저장소 연결
3. Root Directory를 `server`로 설정
4. 환경 변수 추가:
   - `DATABASE_URL`: PostgreSQL 연결 문자열
   - `JWT_SECRET`: JWT 비밀키
   - `PORT`: 3000
   - `NODE_ENV`: production

5. Start Command 설정:
   ```
   npm start
   ```

### 6. 클라이언트 배포 (선택사항)

#### Vercel 또는 Netlify 사용

**환경 변수 설정:**
```env
VITE_API_URL=https://your-railway-server.railway.app
```

### 7. 데이터베이스 확인

마이그레이션 후 생성된 테이블 확인:

```sql
-- 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 사용자 확인
SELECT * FROM users;
```

### 8. 초기 데이터 생성

기본 관리자 계정이 자동으로 생성됩니다:
- Username: `admin`
- Password: 초기 설정 필요 (bcrypt 해시 생성)

#### 비밀번호 해시 생성 (Node.js)

```javascript
const bcrypt = require('bcryptjs');
const password = 'admin123'; // 원하는 비밀번호
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

생성된 해시를 SQL에서 업데이트:

```sql
UPDATE users 
SET password_hash = '$2b$10$your-generated-hash-here'
WHERE username = 'admin';
```

### 9. 데이터베이스 스키마 구조

생성되는 주요 테이블:

1. **users** - 사용자 및 권한
2. **mold_specifications** - 본사 금형제작사양
3. **maker_specifications** - 제작처 사양
4. **plant_molds** - 생산처 금형
5. **qr_sessions** - QR 세션
6. **daily_checklists** - 일상점검
7. **daily_checklist_items** - 일상점검 항목
8. **periodic_inspections** - 정기점검
9. **periodic_inspection_items** - 정기점검 항목
10. **production_quantities** - 생산수량
11. **ng_records** - NG 기록
12. **mold_repairs** - 금형 수리

### 10. 백업 및 복구

#### 백업

```bash
# Railway CLI 사용
railway run pg_dump > backup.sql

# 또는 psql 사용
pg_dump "postgresql://username:password@host:port/database" > backup.sql
```

#### 복구

```bash
railway run psql < backup.sql
```

### 11. 모니터링

Railway 대시보드에서 확인 가능:
- Database Metrics (CPU, Memory, Storage)
- Query Performance
- Connection Count
- Logs

### 12. 비용

Railway 무료 플랜:
- $5 무료 크레딧/월
- 512MB RAM
- 1GB Storage

프로덕션 사용 시 Hobby 플랜 권장:
- $5/월 + 사용량
- 8GB RAM
- 100GB Storage

### 13. 문제 해결

#### 연결 오류

```bash
# 연결 테스트
psql "postgresql://username:password@host:port/database"

# 또는
railway run psql
```

#### 마이그레이션 실패

1. Railway 대시보드에서 Logs 확인
2. 테이블이 이미 존재하는 경우 DROP 후 재실행
3. 권한 문제 확인

#### 성능 최적화

```sql
-- 인덱스 확인
SELECT * FROM pg_indexes WHERE schemaname = 'public';

-- 쿼리 성능 분석
EXPLAIN ANALYZE SELECT * FROM mold_specifications;
```

### 14. 보안 권장사항

1. ✅ 강력한 비밀번호 사용
2. ✅ JWT_SECRET 변경
3. ✅ DATABASE_URL 노출 금지
4. ✅ CORS 설정 확인
5. ✅ Rate Limiting 활성화
6. ✅ 정기적인 백업
7. ✅ SSL/TLS 연결 사용

### 15. 추가 리소스

- [Railway 문서](https://docs.railway.app/)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [Sequelize 문서](https://sequelize.org/)

---

## 🎉 완료!

데이터베이스가 성공적으로 구축되었습니다. 이제 서버를 시작하고 API를 테스트할 수 있습니다.

```bash
# 로컬 개발
cd server
npm install
npm run dev

# 프로덕션
npm start
```
