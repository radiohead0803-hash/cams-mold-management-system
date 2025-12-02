# 프론트엔드 실행 가이드

## ⚠️ 중요: MIME Type 에러 해결

### 문제 상황
```
Failed to load module script: Expected a JavaScript module script 
but the server responded with a MIME type of "text/plain"
```

이 에러는 **Vite 개발 서버 없이 직접 HTML 파일을 열거나, 백엔드 서버에서 .jsx 파일을 직접 서빙할 때** 발생합니다.

### ❌ 잘못된 방법
```bash
# 이렇게 하면 안 됩니다!
1. file:///C:/Users/.../client/index.html 직접 열기
2. 백엔드 서버(http://localhost:3000)에서 React 앱 접근
3. HTML에서 <script type="module" src="/main.jsx"></script> 직접 로드
```

### ✅ 올바른 방법

---

## 🚀 개발 환경 실행

### 1. 프론트엔드 개발 서버 실행

```bash
# client 폴더로 이동
cd client

# 의존성 설치 (처음 한 번만)
npm install

# 개발 서버 실행
npm run dev
```

**브라우저에서 접속:**
```
http://localhost:5173
```

이 주소에서만 React 앱이 정상 작동합니다!

### 2. 백엔드 API 서버 실행 (별도 터미널)

```bash
# server 폴더로 이동
cd server

# 의존성 설치 (처음 한 번만)
npm install

# 개발 서버 실행
npm run dev
```

**API 서버 주소:**
```
http://localhost:3000
```

---

## 🔧 개발 환경 구조

### 포트 구성
- **프론트엔드 (Vite)**: `http://localhost:5173`
- **백엔드 (Express)**: `http://localhost:3000`

### API 프록시 설정
`vite.config.js`에 이미 설정되어 있습니다:

```javascript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',  // 백엔드 주소
      changeOrigin: true,
    },
  },
}
```

프론트엔드에서 `/api/v1/auth/login`을 호출하면 자동으로 `http://localhost:3001/api/v1/auth/login`으로 프록시됩니다.

---

## 📝 환경 변수 설정

### client/.env (선택사항)
```env
# API 서버 주소 (프록시 사용 시 필요 없음)
VITE_API_URL=http://localhost:3001

# 기타 환경 변수
VITE_APP_NAME=CAMS
```

---

## 🏗️ 빌드 및 배포

### 1. 프로덕션 빌드

```bash
cd client
npm run build
```

빌드 결과물이 `client/dist/` 폴더에 생성됩니다:
```
dist/
├── index.html
├── assets/
│   ├── main-xxxxx.js
│   ├── vendor-xxxxx.js
│   └── index-xxxxx.css
└── vite.svg
```

### 2. 빌드 결과 미리보기

```bash
npm run preview
```

`http://localhost:4173`에서 확인 가능합니다.

### 3. 백엔드에서 정적 파일 서빙

**server/src/app.js에 추가:**

```javascript
const path = require('path');

// 프론트엔드 빌드 파일 서빙
app.use(express.static(path.join(__dirname, '../../client/dist')));

// SPA 라우팅 처리 (모든 요청을 index.html로)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});
```

이제 `http://localhost:3000`에서 프론트엔드와 백엔드가 함께 동작합니다.

---

## 🐛 문제 해결

### 문제 1: "Failed to load module script" 에러

**원인:**
- Vite 개발 서버 없이 HTML 파일을 직접 열었거나
- 백엔드 서버에서 .jsx 파일을 직접 서빙하고 있음

**해결:**
```bash
# 반드시 Vite 개발 서버로 실행
cd client
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

### 문제 2: API 호출 실패 (CORS 에러)

**원인:**
- 백엔드 서버가 실행되지 않았거나
- CORS 설정이 잘못됨

**해결:**
```bash
# 1. 백엔드 서버 실행 확인
cd server
npm run dev

# 2. server/src/app.js에서 CORS 설정 확인
const allowedOrigins = [
  'http://localhost:5173',  // 이 줄이 있어야 함
  // ...
];
```

### 문제 3: 모듈을 찾을 수 없음

**원인:**
- node_modules가 설치되지 않음

**해결:**
```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

### 문제 4: 포트가 이미 사용 중

**원인:**
- 5173 포트가 다른 프로세스에서 사용 중

**해결:**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9

# 또는 다른 포트 사용
npm run dev -- --port 5174
```

---

## 📦 패키지 구조

### 주요 의존성
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "axios": "^1.6.2",
  "zustand": "^4.4.7",
  "lucide-react": "^0.294.0",
  "tailwindcss": "^3.3.6"
}
```

### 개발 의존성
```json
{
  "vite": "^5.0.7",
  "@vitejs/plugin-react": "^4.2.1",
  "eslint": "^8.55.0",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.32"
}
```

---

## 🎯 개발 워크플로우

### 일반적인 개발 흐름

1. **백엔드 서버 시작**
```bash
cd server
npm run dev
# http://localhost:3000에서 실행
```

2. **프론트엔드 개발 서버 시작**
```bash
cd client
npm run dev
# http://localhost:5173에서 실행
```

3. **브라우저에서 개발**
```
http://localhost:5173 접속
코드 수정 → 자동 새로고침 (HMR)
```

4. **API 테스트**
```javascript
// 프론트엔드 코드에서
import axios from 'axios'

// /api로 시작하면 자동으로 백엔드로 프록시됨
const response = await axios.post('/api/v1/auth/login', {
  username: 'plant_user',
  password: 'password123'
})
```

---

## 🔍 디버깅 팁

### 1. 네트워크 탭 확인
브라우저 개발자 도구 → Network 탭에서:
- `main.jsx`의 Content-Type이 `application/javascript`인지 확인
- API 요청이 올바른 주소로 가는지 확인

### 2. Vite 서버 로그 확인
```bash
npm run dev
# 출력 예시:
# VITE v5.0.7  ready in 500 ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

### 3. 빌드 테스트
```bash
npm run build
npm run preview
# http://localhost:4173에서 확인
```

---

## 📚 추가 리소스

### Vite 공식 문서
- https://vitejs.dev/

### React 공식 문서
- https://react.dev/

### 프로젝트 문서
- **API 문서**: `API_IMPLEMENTATION_SUMMARY.md`
- **백엔드 README**: `BACKEND_README.md`
- **API 통합 가이드**: `API_INTEGRATION_GUIDE.md`

---

## ✅ 체크리스트

### 개발 시작 전
- [ ] Node.js 18+ 설치 확인
- [ ] PostgreSQL 실행 중
- [ ] 백엔드 `.env` 파일 설정
- [ ] 백엔드 의존성 설치 (`cd server && npm install`)
- [ ] 프론트엔드 의존성 설치 (`cd client && npm install`)

### 개발 중
- [ ] 백엔드 서버 실행 중 (`http://localhost:3000`)
- [ ] 프론트엔드 개발 서버 실행 중 (`http://localhost:5173`)
- [ ] 브라우저에서 `http://localhost:5173` 접속
- [ ] 네트워크 탭에서 API 호출 확인

### 배포 전
- [ ] `npm run build` 성공
- [ ] `npm run preview`로 빌드 결과 확인
- [ ] 백엔드에서 정적 파일 서빙 설정
- [ ] 환경 변수 프로덕션 설정

---

## 🎓 핵심 요약

### ✅ 해야 할 것
1. **개발**: `npm run dev`로 Vite 서버 실행 → `http://localhost:5173` 접속
2. **배포**: `npm run build` → `dist/` 폴더를 백엔드에서 서빙
3. **API 호출**: `/api/v1/...` 경로 사용 (자동 프록시)

### ❌ 하지 말아야 할 것
1. HTML 파일을 직접 열기 (`file:///...`)
2. 백엔드 서버에서 React 앱 접근 (개발 중)
3. `.jsx` 파일을 `<script>`로 직접 로드
4. Vite 없이 React 앱 실행

---

**마지막 업데이트**: 2025-12-02
**상태**: ✅ 설정 완료
