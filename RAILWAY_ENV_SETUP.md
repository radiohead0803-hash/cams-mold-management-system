# 🚂 Railway 환경 변수 설정 가이드

## 문제 상황
프론트엔드에서 백엔드 API 호출 시 404 에러 발생

## 원인
Railway에서 프론트엔드와 백엔드가 별도 서비스로 배포되어 있지만, 프론트엔드가 백엔드 URL을 모르고 있음

---

## 해결 방법

### 1. Railway 대시보드 접속
```
https://railway.app
→ 프로젝트 선택
→ cams-mold-management-system
```

### 2. 백엔드 서비스 URL 확인
```
1. 백엔드 서비스 클릭 (server)
2. Settings → Domains
3. 생성된 URL 복사
   예: https://cams-backend-production.up.railway.app
```

### 3. 프론트엔드 환경 변수 설정
```
1. 프론트엔드 서비스 클릭 (client)
2. Variables 탭
3. New Variable 클릭
4. 다음 변수 추가:

변수명: VITE_API_URL
값: https://cams-backend-production.up.railway.app
```

### 4. 프론트엔드 재배포
```
1. Deployments 탭
2. 최신 배포 클릭
3. Redeploy 버튼 클릭
```

---

## 대안: 단일 서비스 배포

현재는 프론트엔드와 백엔드가 분리되어 있지만, 단일 서비스로 통합할 수도 있습니다.

### 방법 1: 백엔드에서 프론트엔드 정적 파일 서빙

#### server/src/app.js 수정
```javascript
const path = require('path');
const express = require('express');

// ... 기존 코드 ...

// 프로덕션 환경에서 프론트엔드 정적 파일 서빙
if (process.env.NODE_ENV === 'production') {
  // 빌드된 프론트엔드 파일 경로
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  
  // 정적 파일 서빙
  app.use(express.static(clientBuildPath));
  
  // SPA를 위한 fallback
  app.get('*', (req, res) => {
    // API 요청이 아닌 경우에만 index.html 반환
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
  });
}
```

#### package.json 수정
```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build && cd ..",
    "start": "node server/src/index.js"
  }
}
```

#### Railway 설정
```
1. 단일 서비스만 유지 (server)
2. Build Command: npm run build
3. Start Command: npm start
4. Root Directory: / (프로젝트 루트)
```

---

## 현재 권장 방법

**방법 2: 프록시 설정 (가장 간단)**

### client/vite.config.js 수정
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

### Railway 환경 변수
```
프론트엔드 서비스:
VITE_API_URL=https://백엔드URL
```

---

## 빠른 해결 (임시)

### 하드코딩 (개발/테스트용)

#### client/src/lib/api.js 수정
```javascript
// 임시: Railway 백엔드 URL 하드코딩
const API_URL = 'https://cams-mold-management-system-production.up.railway.app'

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})
```

⚠️ **주의**: 이 방법은 임시 해결책이며, 환경 변수를 사용하는 것이 좋습니다.

---

## 확인 방법

### 1. 환경 변수 확인
```javascript
// 브라우저 콘솔에서
console.log(import.meta.env.VITE_API_URL)
```

### 2. API 호출 확인
```javascript
// 브라우저 개발자 도구 → Network 탭
// API 요청 URL 확인
```

### 3. 백엔드 헬스 체크
```bash
curl https://백엔드URL/health
```

---

## 트러블슈팅

### 문제: 환경 변수가 적용되지 않음
**해결**: 프론트엔드 재배포 필요 (빌드 시점에 환경 변수가 주입됨)

### 문제: CORS 에러
**해결**: 백엔드에서 CORS 설정 확인
```javascript
// server/src/app.js
const cors = require('cors');
app.use(cors({
  origin: [
    'https://프론트엔드URL',
    'http://localhost:5173'
  ],
  credentials: true
}));
```

### 문제: 404 Not Found
**해결**: 
1. 백엔드 URL 확인
2. API 경로 확인 (/api/v1/...)
3. 라우터 설정 확인

---

## 최종 체크리스트

- [ ] 백엔드 URL 확인
- [ ] 프론트엔드 환경 변수 설정 (VITE_API_URL)
- [ ] 프론트엔드 재배포
- [ ] 브라우저 캐시 클리어
- [ ] API 호출 테스트
- [ ] CORS 설정 확인

---

## 참고 자료

- [Railway 환경 변수 문서](https://docs.railway.app/develop/variables)
- [Vite 환경 변수 문서](https://vitejs.dev/guide/env-and-mode.html)
- [CORS 설정 가이드](https://expressjs.com/en/resources/middleware/cors.html)
