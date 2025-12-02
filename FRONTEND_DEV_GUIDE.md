# 프론트엔드 개발 환경 가이드

**작성일**: 2025-12-02
**대상**: 개발자

---

## 🚨 중요: MIME 타입 에러 해결

### 문제 증상
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/plain"
```

### 원인
- ❌ `index.html`에서 `.jsx` 파일을 직접 로드
- ❌ Vite 개발 서버 없이 파일 직접 열기 (`file:///...`)
- ❌ 백엔드 서버에서 빌드하지 않은 프론트 파일 서빙

### 해결 방법

#### ✅ 개발 환경 (권장)
```bash
# 1. 프론트엔드 폴더로 이동
cd client

# 2. 의존성 설치 (최초 1회)
npm install

# 3. 개발 서버 실행
npm run dev

# 4. 브라우저 접속
# http://localhost:5173
```

#### ✅ 운영 환경 (배포)
```bash
# 1. 프론트엔드 빌드
cd client
npm run build
# → dist/ 폴더 생성

# 2. 백엔드에서 dist 폴더 서빙
# (server/src/app.js 참고)
```

---

## 📁 프로젝트 구조

```
cams-mold-management-system/
├── client/                    # 프론트엔드
│   ├── src/
│   │   ├── main.jsx          # 진입점
│   │   ├── App.jsx           # 라우터
│   │   ├── api/              # API 클라이언트
│   │   ├── pages/            # 페이지 컴포넌트
│   │   ├── components/       # 공통 컴포넌트
│   │   └── stores/           # 상태 관리
│   ├── index.html            # HTML 템플릿
│   ├── vite.config.js        # Vite 설정
│   └── package.json
└── server/                    # 백엔드
    ├── src/
    └── package.json
```

---

## 🚀 개발 서버 실행

### 1. 프론트엔드 개발 서버

```bash
cd client
npm run dev
```

**접속**: `http://localhost:5173`

**특징**:
- ✅ Hot Module Replacement (HMR)
- ✅ 자동 리로드
- ✅ JSX/TypeScript 자동 변환
- ✅ MIME 타입 자동 처리
- ✅ API 프록시 (`/api` → `http://localhost:3001`)

### 2. 백엔드 개발 서버

```bash
cd server
npm run dev
```

**접속**: `http://localhost:3001`

**특징**:
- ✅ Nodemon 자동 재시작
- ✅ API 엔드포인트 제공
- ✅ 데이터베이스 연결

### 3. 동시 실행 (권장)

**터미널 1**:
```bash
cd server
npm run dev
```

**터미널 2**:
```bash
cd client
npm run dev
```

**브라우저**: `http://localhost:5173`

---

## 🔧 Vite 설정 설명

### vite.config.js

```javascript
export default defineConfig({
  plugins: [react()],
  
  // 경로 별칭
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // 개발 서버
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',  // 백엔드 주소
        changeOrigin: true,
      },
    },
  },
  
  // 빌드 설정
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
```

### 주요 기능

#### 1. API 프록시
```javascript
// 프론트엔드에서
axios.get('/api/v1/auth/login')

// 실제 요청
// http://localhost:5173/api/v1/auth/login
// ↓ 프록시
// http://localhost:3001/api/v1/auth/login
```

#### 2. 경로 별칭
```javascript
// Before
import Component from '../../../components/Component'

// After
import Component from '@/components/Component'
```

---

## 📦 빌드 및 배포

### 1. 로컬 빌드

```bash
cd client
npm run build
```

**결과**:
```
client/dist/
├── index.html
└── assets/
    ├── main-[hash].js
    ├── react-vendor-[hash].js
    └── index-[hash].css
```

### 2. 빌드 미리보기

```bash
npm run preview
```

**접속**: `http://localhost:4173`

### 3. 백엔드와 통합

**server/src/app.js**:
```javascript
import path from 'path';
import express from 'express';

const app = express();
const __dirname = path.resolve();

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../client/dist')));

// SPA 라우팅 (모든 경로를 index.html로)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

---

## 🐛 문제 해결

### 1. MIME 타입 에러

**증상**:
```
Expected a JavaScript module script but the server responded with a MIME type of "text/plain"
```

**해결**:
```bash
# ❌ 이렇게 하지 마세요
file:///C:/Users/.../client/index.html

# ✅ 이렇게 하세요
cd client
npm run dev
# http://localhost:5173
```

### 2. 모듈을 찾을 수 없음

**증상**:
```
Cannot find module 'react'
```

**해결**:
```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

### 3. 포트 충돌

**증상**:
```
Port 5173 is already in use
```

**해결**:
```bash
# 포트 변경
npm run dev -- --port 5174

# 또는 vite.config.js 수정
server: {
  port: 5174,
}
```

### 4. API 연결 실패

**증상**:
```
Network Error
ERR_CONNECTION_REFUSED
```

**체크리스트**:
- [ ] 백엔드 서버 실행 중인지 확인
- [ ] 백엔드 포트 확인 (3001)
- [ ] `.env` 파일 설정 확인
- [ ] CORS 설정 확인

**해결**:
```bash
# 백엔드 실행 확인
cd server
npm run dev

# 프론트엔드 프록시 확인
# vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  },
}
```

### 5. 빌드 실패

**증상**:
```
Build failed
```

**해결**:
```bash
# 캐시 삭제
rm -rf node_modules/.vite

# 재빌드
npm run build
```

---

## 🔍 개발 도구

### 1. React Developer Tools

**설치**: Chrome 확장 프로그램
- Components 탭: 컴포넌트 트리 확인
- Profiler 탭: 성능 분석

### 2. Network 탭

**Chrome DevTools → Network**
- API 요청/응답 확인
- 헤더 확인
- 타이밍 분석

### 3. Console 탭

**Chrome DevTools → Console**
- 에러 메시지 확인
- `console.log()` 출력
- 경고 확인

---

## 📝 환경 변수

### .env 파일

**client/.env**:
```bash
# API 기본 URL
VITE_API_BASE_URL=/api/v1

# 백엔드 URL (개발)
VITE_API_URL=http://localhost:3001

# 앱 정보
VITE_APP_NAME=CAMS
VITE_APP_VERSION=1.0.0

# 카카오 맵 API 키 (선택)
VITE_KAKAO_MAP_KEY=your_key_here
```

### 사용 방법

```javascript
// JavaScript/JSX
const apiUrl = import.meta.env.VITE_API_URL;
const appName = import.meta.env.VITE_APP_NAME;

// TypeScript
// vite-env.d.ts에 타입 정의 필요
```

---

## 🧪 테스트

### 1. 개발 서버 테스트

```bash
# 1. 서버 실행
cd client
npm run dev

# 2. 브라우저 접속
# http://localhost:5173

# 3. 체크리스트
- [ ] 페이지 로드 확인
- [ ] 로그인 화면 표시
- [ ] 네트워크 탭에서 API 요청 확인
- [ ] Console 에러 없음
```

### 2. 빌드 테스트

```bash
# 1. 빌드
npm run build

# 2. 미리보기
npm run preview

# 3. 브라우저 접속
# http://localhost:4173

# 4. 체크리스트
- [ ] 페이지 로드 확인
- [ ] 모든 기능 동작
- [ ] 번들 크기 확인 (dist/)
```

### 3. API 통합 테스트

```bash
# 1. 백엔드 실행
cd server
npm run dev

# 2. 프론트엔드 실행
cd client
npm run dev

# 3. 테스트 시나리오
- [ ] 로그인
- [ ] 대시보드 KPI 로드
- [ ] QR 스캔
- [ ] 점검 저장
```

---

## 📚 추가 문서

- **API 연동 가이드**: `FRONTEND_API_INTEGRATION_GUIDE.md`
- **QR 워크플로우**: `QR_INSPECTION_WORKFLOW_SUMMARY.md`
- **백엔드 README**: `BACKEND_README.md`
- **배포 가이드**: `RAILWAY_DEPLOYMENT_CHECKLIST.md`

---

## ✅ 체크리스트

### 개발 시작 전
- [ ] Node.js 18+ 설치
- [ ] npm 9+ 설치
- [ ] Git 설치
- [ ] 코드 에디터 (VS Code 권장)

### 최초 설정
- [ ] 저장소 클론
- [ ] `cd client && npm install`
- [ ] `cd server && npm install`
- [ ] `.env` 파일 설정
- [ ] 데이터베이스 연결 확인

### 개발 중
- [ ] 백엔드 서버 실행 (`server/`)
- [ ] 프론트엔드 서버 실행 (`client/`)
- [ ] 브라우저 DevTools 열기
- [ ] Network 탭 모니터링
- [ ] Console 에러 확인

### 커밋 전
- [ ] ESLint 에러 없음
- [ ] Console 에러 없음
- [ ] 빌드 성공 확인
- [ ] 기능 테스트 완료

---

## 🚀 빠른 시작

```bash
# 1. 저장소 클론 (이미 완료)
git clone <repository>
cd cams-mold-management-system

# 2. 백엔드 설정
cd server
npm install
cp .env.example .env
# .env 파일 수정 (DB 연결 정보)
npm run dev

# 3. 프론트엔드 설정 (새 터미널)
cd client
npm install
npm run dev

# 4. 브라우저 접속
# http://localhost:5173
```

---

## 💡 팁

### 1. 개발 효율성
- ✅ 두 개의 터미널 사용 (백엔드/프론트엔드)
- ✅ 브라우저 DevTools 항상 열기
- ✅ React Developer Tools 설치
- ✅ 자동 저장 활성화

### 2. 디버깅
- ✅ `console.log()` 적극 활용
- ✅ Network 탭에서 API 응답 확인
- ✅ React DevTools로 상태 확인
- ✅ Breakpoint 사용

### 3. 성능
- ✅ 불필요한 리렌더링 최소화
- ✅ 이미지 최적화
- ✅ 코드 스플리팅 활용
- ✅ 번들 크기 모니터링

---

**작성일**: 2025-12-02
**최종 업데이트**: 2025-12-02 17:12
**문의**: 개발팀
