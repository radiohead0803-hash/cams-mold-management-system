# CAMS Backend Server

Creative Auto Module System - Backend API Server

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 설정을 수정하세요.

```bash
cp .env.example .env
```

### 3. 데이터베이스 설정

PostgreSQL 데이터베이스를 생성하고 연결 정보를 `.env`에 설정하세요.

### 4. 서버 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

## 📡 API 엔드포인트

- `GET /health` - 서버 상태 확인
- `GET /api` - API 정보

## 🛠️ 기술 스택

- Node.js
- Express
- PostgreSQL
- Sequelize ORM
- JWT Authentication
