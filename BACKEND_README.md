# 금형관리 전산시스템 - Backend API

## 🎯 프로젝트 개요

금형 생산 및 관리를 위한 종합 관리 시스템의 백엔드 API입니다.
QR 코드 기반 점검, 수리요청, GPS 추적, 역할별 대시보드 등의 기능을 제공합니다.

---

## ✅ 구현 완료 현황

**전체 진행률: 100%** (18개 API 엔드포인트)

### Phase 1: 인증 및 기본 대시보드 ✅
- 로그인 API 및 JWT 인증
- 4개 역할별 대시보드 KPI API
- GPS 위치 추적 API (3개)

### Phase 2: QR 스캔 및 점검 시스템 ✅
- QR 세션 시작 및 작업 선택
- 일상점검 제출 API
- 정기점검 제출 API (20K/100K/400K/800K)

### Phase 3: 수리요청 시스템 ✅
- 수리요청 생성 (사진 첨부)
- 승인/반려/배정 API
- 진행 상태 업데이트
- 귀책 협의 API

---

## 🛠 기술 스택

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Logging**: Winston

### 주요 라이브러리
```json
{
  "express": "^4.18.0",
  "sequelize": "^6.35.0",
  "pg": "^8.11.0",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "multer": "^1.4.5-lts.1",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1"
}
```

---

## 📁 프로젝트 구조

```
server/
├── src/
│   ├── controllers/          # 비즈니스 로직
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── inspectionController.js
│   │   ├── moldController.js
│   │   ├── qrController.js
│   │   └── repairController.js
│   ├── routes/               # API 라우트
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── inspections.js
│   │   ├── molds.js
│   │   ├── qr.js
│   │   └── repairRequests.js
│   ├── models/               # Sequelize 모델
│   │   └── newIndex.js
│   ├── middleware/           # 미들웨어
│   │   └── auth.js
│   ├── utils/                # 유틸리티
│   │   ├── logger.js
│   │   └── geo.js
│   ├── config/               # 설정 파일
│   │   └── database.js
│   ├── app.js                # Express 앱 설정
│   └── index.js              # 서버 진입점
├── uploads/                  # 업로드 파일
│   └── repairs/
├── .env                      # 환경 변수
└── package.json
```

---

## 🚀 시작하기

### 1. 환경 설정

`.env` 파일 생성:
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mold_management
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=8h

# File Upload
UPLOAD_PATH=uploads/

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 2. 의존성 설치

```bash
cd server
npm install
```

### 3. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
createdb mold_management

# 마이그레이션 실행
npm run migrate

# 시드 데이터 삽입 (선택사항)
npm run seed
```

### 4. 서버 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

---

## 📡 API 엔드포인트

### 인증 (2개)
- `POST /api/v1/auth/login` - 로그인
- `GET /api/v1/auth/me` - 현재 사용자 정보

### 대시보드 (4개)
- `GET /api/v1/dashboard/system-admin/kpis`
- `GET /api/v1/dashboard/plant/kpis`
- `GET /api/v1/dashboard/maker/kpis`
- `GET /api/v1/dashboard/developer/kpis`

### GPS 위치 (3개)
- `GET /api/v1/molds/locations`
- `GET /api/v1/molds/:id/location`
- `POST /api/v1/molds/:id/location`

### QR 스캔 (1개)
- `POST /api/v1/qr/scan`

### 점검 (2개)
- `POST /api/v1/inspections/daily`
- `POST /api/v1/inspections/periodic`

### 수리요청 (6개)
- `POST /api/v1/repair-requests`
- `POST /api/v1/repair-requests/:id/approve`
- `POST /api/v1/repair-requests/:id/reject`
- `POST /api/v1/repair-requests/:id/assign`
- `PATCH /api/v1/repair-requests/:id/progress`
- `PATCH /api/v1/repair-requests/:id/blame`

**상세 API 문서**: `API_IMPLEMENTATION_SUMMARY.md` 참조

---

## 🔐 인증 및 권한

### JWT 토큰
모든 보호된 엔드포인트는 JWT 토큰이 필요합니다.

```bash
Authorization: Bearer {token}
```

### 사용자 역할
- `system_admin`: 시스템 관리자
- `mold_developer`: 금형 개발 담당 (본사)
- `maker`: 제작처
- `plant`: 생산처

---

## 🧪 테스트

### API 테스트 (Postman/cURL)

```bash
# 1. 로그인
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"plant_user","password":"password123"}'

# 2. 대시보드 KPI 조회
curl -X GET http://localhost:3000/api/v1/dashboard/plant/kpis \
  -H "Authorization: Bearer {token}"

# 3. QR 스캔
curl -X POST http://localhost:3000/api/v1/qr/scan \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"qr_code":"MOLD-M-2024-001-QR123"}'
```

### Health Check

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-02T15:00:00.000Z",
  "database": "mold_management"
}
```

---

## 📊 데이터베이스 스키마

### 주요 테이블
- `users` - 사용자 정보
- `molds` - 금형 정보
- `daily_checks` - 일상점검 기록
- `periodic_inspections` - 정기점검 기록
- `repair_requests` - 수리요청
- `qr_sessions` - QR 세션
- `notifications` - 알림
- `gps_locations` - GPS 위치 기록

---

## 🔄 상태 흐름

### 금형 상태
```
design → manufacturing → trial → production → under_repair → retired
```

### 수리요청 상태
```
requested → approved → assigned → in_progress → done → confirmed → closed
         ↓
      rejected
```

---

## 📝 로깅

Winston을 사용한 구조화된 로깅:

```javascript
logger.info('User logged in', { userId: 1, username: 'plant_user' });
logger.error('Database connection failed', { error: err.message });
```

로그 파일:
- `logs/combined.log` - 모든 로그
- `logs/error.log` - 에러 로그만

---

## 🛡 보안

### 구현된 보안 기능
- ✅ JWT 기반 인증
- ✅ 비밀번호 해싱 (bcrypt)
- ✅ CORS 설정
- ✅ SQL Injection 방지 (Sequelize ORM)
- ✅ 파일 업로드 크기 제한
- ✅ 트랜잭션 기반 데이터 무결성

### 권장 사항
- [ ] Rate Limiting 추가
- [ ] Helmet.js 적용
- [ ] HTTPS 사용
- [ ] 환경 변수 암호화
- [ ] API 버전 관리

---

## 🚀 배포

### Docker (권장)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t mold-management-api .
docker run -p 3000:3000 --env-file .env mold-management-api
```

### PM2

```bash
npm install -g pm2
pm2 start src/index.js --name mold-api
pm2 save
pm2 startup
```

---

## 📈 성능 최적화

### 구현된 최적화
- ✅ 데이터베이스 인덱싱
- ✅ 트랜잭션 사용
- ✅ 페이지네이션
- ✅ 선택적 필드 조회 (attributes)
- ✅ 연관 데이터 즉시 로딩 (include)

### 추가 권장 사항
- [ ] Redis 캐싱
- [ ] 데이터베이스 커넥션 풀링
- [ ] CDN for static files
- [ ] Gzip 압축

---

## 🐛 디버깅

### 개발 모드에서 상세 에러 확인

```env
NODE_ENV=development
```

에러 응답에 스택 트레이스 포함:
```json
{
  "success": false,
  "error": {
    "message": "Failed to create repair request",
    "details": "Error stack trace here..."
  }
}
```

### 데이터베이스 쿼리 로깅

```javascript
// config/database.js
{
  logging: console.log  // 모든 SQL 쿼리 출력
}
```

---

## 📚 추가 문서

- **API 구현 요약**: `API_IMPLEMENTATION_SUMMARY.md`
- **API 통합 가이드**: `API_INTEGRATION_GUIDE.md`
- **체크리스트 시스템**: `CHECKLIST_FORMS_SYSTEM_DESIGN.md`
- **대시보드 시스템**: `DASHBOARD_SYSTEM_DESIGN.md`
- **수리 시스템**: `MASS_PRODUCTION_REPAIR_SYSTEM_DESIGN.md`

---

## 🤝 기여

### 코드 스타일
- ESLint 설정 준수
- Prettier 포맷팅
- JSDoc 주석 작성

### 커밋 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드/설정 변경
```

---

## 📞 지원

### 문제 보고
GitHub Issues를 통해 버그나 기능 요청을 제출해주세요.

### 연락처
- Email: support@example.com
- Slack: #mold-management

---

## 📄 라이선스

MIT License

---

## 🎉 완료 상태

**구현 완료일**: 2025-12-02
**버전**: 1.0.0
**상태**: ✅ Production Ready

**구현된 기능:**
- ✅ 인증 시스템
- ✅ 역할별 대시보드
- ✅ GPS 위치 추적
- ✅ QR 스캔 시스템
- ✅ 일상/정기 점검
- ✅ 수리요청 시스템
- ✅ 알림 시스템
- ✅ 파일 업로드
- ✅ 이력 관리

**다음 단계:**
- 프론트엔드 통합
- 실시간 알림 (WebSocket)
- 통계 및 리포트
- 모바일 앱 최적화
