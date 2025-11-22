# Week 1: 기반 구축 및 인증 시스템

## 📋 목표
- 프로젝트 초기 설정 및 개발 환경 구축
- 데이터베이스 스키마 구현
- 사용자 인증 시스템 구축
- 기본 API 구조 설계

---

## 🗄️ 데이터베이스 설정

### PostgreSQL 설치 및 설정
```bash
# PostgreSQL 14+ 설치
# Railway 또는 로컬 환경 설정

# 데이터베이스 생성
CREATE DATABASE cams_mold_system;
```

### 핵심 테이블 생성 (Week 1)

#### 1. 사용자 및 인증 관련
```sql
-- 사용자 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    
    user_type VARCHAR(20) NOT NULL, 
    -- 'system_admin', 'mold_developer', 'maker', 'plant'
    
    company_id INTEGER,
    company_name VARCHAR(100),
    
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 로그인 이력
CREATE TABLE login_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    login_time TIMESTAMP DEFAULT NOW(),
    logout_time TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(20),
    login_status VARCHAR(20),
    failure_reason TEXT
);

-- 권한 테이블
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    user_type VARCHAR(20),
    permission_name VARCHAR(50),
    can_view BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE
);
```

#### 2. 금형 기본 정보
```sql
-- 금형 마스터 테이블
CREATE TABLE molds (
    id SERIAL PRIMARY KEY,
    mold_code VARCHAR(50) UNIQUE NOT NULL,
    mold_name VARCHAR(100) NOT NULL,
    part_name VARCHAR(100),
    car_model VARCHAR(50),
    
    mold_type VARCHAR(50),
    cavity_count INTEGER,
    target_shots INTEGER,
    current_shots INTEGER DEFAULT 0,
    
    maker_id INTEGER,
    maker_name VARCHAR(100),
    plant_id INTEGER,
    plant_name VARCHAR(100),
    
    status VARCHAR(20) DEFAULT 'development',
    stage VARCHAR(20) DEFAULT 'development',
    
    qr_code VARCHAR(100) UNIQUE,
    
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 금형 상태 이력
CREATE TABLE mold_status_history (
    id SERIAL PRIMARY KEY,
    mold_id INTEGER REFERENCES molds(id),
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by INTEGER REFERENCES users(id),
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. QR 세션 관리
```sql
-- QR 스캔 세션
CREATE TABLE qr_sessions (
    id SERIAL PRIMARY KEY,
    session_id UUID UNIQUE NOT NULL,
    mold_id INTEGER REFERENCES molds(id),
    user_id INTEGER REFERENCES users(id),
    
    scanned_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    
    gps_latitude DECIMAL(10, 8),
    gps_longitude DECIMAL(11, 8),
    gps_accuracy DECIMAL(10, 2),
    location_name VARCHAR(100),
    
    session_status VARCHAR(20) DEFAULT 'active',
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 백엔드 API 구조

### 프로젝트 초기 설정
```bash
# 프로젝트 생성
mkdir cams-backend
cd cams-backend
npm init -y

# 필수 패키지 설치
npm install express sequelize pg pg-hstore
npm install jsonwebtoken bcrypt
npm install dotenv cors
npm install express-validator

# 개발 도구
npm install --save-dev nodemon
```

### 폴더 구조
```
cams-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── jwt.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Mold.js
│   │   └── QRSession.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── moldController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── molds.js
│   └── app.js
├── .env
└── package.json
```

### 환경 변수 설정 (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cams_mold_system
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=8h

# Server
PORT=3000
NODE_ENV=development
```

---

## 🔐 JWT 인증 시스템

### 1. JWT 설정 (config/jwt.js)
```javascript
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user.id,
      username: user.username,
      user_type: user.user_type,
      company_id: user.company_id
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
```

### 2. 인증 미들웨어 (middleware/auth.js)
```javascript
const { verifyToken } = require('../config/jwt');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
    
    const user = await User.findByPk(decoded.user_id);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  }
};

const authorize = (...allowedTypes) => {
  return (req, res, next) => {
    if (!allowedTypes.includes(req.user.user_type)) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
```

### 3. 로그인 컨트롤러 (controllers/authController.js)
```javascript
const bcrypt = require('bcrypt');
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const { generateToken } = require('../config/jwt');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 사용자 조회
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      await LoginHistory.create({
        username,
        login_status: 'failed',
        failure_reason: '사용자를 찾을 수 없습니다.',
        ip_address: req.ip
      });
      return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }
    
    // 계정 잠금 확인
    if (user.locked_until && new Date() < user.locked_until) {
      return res.status(403).json({ error: '계정이 잠겨있습니다. 잠시 후 다시 시도해주세요.' });
    }
    
    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      // 로그인 실패 횟수 증가
      user.failed_login_attempts += 1;
      
      if (user.failed_login_attempts >= 5) {
        user.locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15분 잠금
      }
      
      await user.save();
      
      await LoginHistory.create({
        user_id: user.id,
        login_status: 'failed',
        failure_reason: '비밀번호 불일치',
        ip_address: req.ip
      });
      
      return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }
    
    // 로그인 성공
    user.failed_login_attempts = 0;
    user.locked_until = null;
    user.last_login_at = new Date();
    user.last_login_ip = req.ip;
    await user.save();
    
    // JWT 토큰 생성
    const token = generateToken(user);
    
    // 로그인 이력 기록
    await LoginHistory.create({
      user_id: user.id,
      login_status: 'success',
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        user_type: user.user_type,
        company_name: user.company_name
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' });
  }
};

module.exports = { login };
```

---

## 📡 기본 API 엔드포인트

### 인증 API (routes/auth.js)
```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/refresh
router.post('/refresh', authController.refreshToken);

module.exports = router;
```

### 금형 기본 API (routes/molds.js)
```javascript
const express = require('express');
const router = express.Router();
const moldController = require('../controllers/moldController');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/molds - 금형 목록 조회
router.get('/', authenticate, moldController.getMolds);

// GET /api/molds/:id - 금형 상세 조회
router.get('/:id', authenticate, moldController.getMoldById);

// POST /api/molds - 금형 등록 (금형개발 담당만)
router.post('/', 
  authenticate, 
  authorize('system_admin', 'mold_developer'), 
  moldController.createMold
);

// PUT /api/molds/:id - 금형 수정
router.put('/:id', 
  authenticate, 
  authorize('system_admin', 'mold_developer'), 
  moldController.updateMold
);

module.exports = router;
```

---

## ✅ Week 1 체크리스트

### 환경 설정
- [ ] Node.js 18+ 설치
- [ ] PostgreSQL 14+ 설치
- [ ] 프로젝트 초기화
- [ ] 필수 패키지 설치
- [ ] 환경 변수 설정

### 데이터베이스
- [ ] 데이터베이스 생성
- [ ] users 테이블 생성
- [ ] login_history 테이블 생성
- [ ] permissions 테이블 생성
- [ ] molds 테이블 생성
- [ ] qr_sessions 테이블 생성
- [ ] 초기 데이터 입력 (관리자 계정)

### 백엔드 API
- [ ] Express 서버 설정
- [ ] Sequelize ORM 설정
- [ ] JWT 인증 구현
- [ ] 로그인 API 구현
- [ ] 로그아웃 API 구현
- [ ] 권한 미들웨어 구현
- [ ] 에러 핸들링 미들웨어

### 테스트
- [ ] Postman/Thunder Client로 API 테스트
- [ ] 로그인 성공/실패 테스트
- [ ] JWT 토큰 검증 테스트
- [ ] 권한 체크 테스트

---

**다음 주**: Week 2 - QR 스캔 및 점검 시스템 구현
