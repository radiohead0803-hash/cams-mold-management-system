# Railway 배포 문제 해결 가이드

## 🔴 문제: MIME Type 에러

### 에러 메시지
```
Failed to load module script: Expected a JavaScript module script 
but the server responded with a MIME type of "text/plain"
```

### 원인
브라우저가 빌드되지 않은 `.jsx` 원본 파일을 로드하려고 시도하고 있습니다.

---

## ✅ 해결 방법

### 1️⃣ Railway 빌드 설정 확인

**client/railway.json**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install --include=dev && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**client/package.json**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "start": "vite preview --host 0.0.0.0 --port $PORT"
  }
}
```

### 2️⃣ 빌드 프로세스 확인

Railway 빌드 로그에서 다음을 확인:

```bash
# 1. npm install이 성공했는지
✅ npm install --include=dev

# 2. vite build가 실행되었는지
✅ npm run build
   > vite build
   ✓ built in 5s

# 3. dist 폴더가 생성되었는지
✅ dist/
   ├── index.html
   ├── assets/
   │   ├── index-xxxxx.js
   │   └── index-xxxxx.css
```

### 3️⃣ dist/index.html 확인

빌드 후 `dist/index.html`은 자동으로 변환됩니다:

**빌드 전 (client/index.html)**
```html
<script type="module" src="/src/main.jsx"></script>
```

**빌드 후 (dist/index.html)**
```html
<script type="module" crossorigin src="/assets/index-xxxxx.js"></script>
```

### 4️⃣ vite preview 명령 확인

`npm start` → `vite preview`는:
- `dist` 폴더를 정적 파일로 서빙
- 빌드된 JS 파일을 올바른 MIME 타입으로 제공
- SPA 라우팅 지원

---

## 🔍 Railway 로그 확인 방법

### 빌드 로그
```
Railway Dashboard → Frontend Service → Deployments → 최신 배포 클릭 → Build Logs
```

확인 사항:
- ✅ `npm install` 성공
- ✅ `npm run build` 성공
- ✅ `vite build` 완료
- ✅ `dist` 폴더 생성

### 런타임 로그
```
Railway Dashboard → Frontend Service → Deployments → 최신 배포 클릭 → Deploy Logs
```

확인 사항:
- ✅ `npm start` 실행
- ✅ `vite preview` 시작
- ✅ 포트 바인딩 성공
- ✅ HTTP 서버 시작

---

## 🐛 문제 해결 체크리스트

### 1. Railway 환경 변수 확인
```
PORT=자동할당 (Railway가 자동 설정)
NODE_ENV=production (선택사항)
```

### 2. package.json 스크립트 확인
```json
{
  "start": "vite preview --host 0.0.0.0 --port $PORT"
}
```
- `--host 0.0.0.0`: 외부 접속 허용
- `--port $PORT`: Railway 포트 사용

### 3. .gitignore 확인
```
# dist 폴더는 커밋하지 않음 (Railway가 빌드)
dist/
node_modules/
```

### 4. Railway 재배포
```bash
# 로컬에서 변경사항 커밋
git add .
git commit -m "fix: Update Railway deployment config"
git push origin main

# Railway가 자동으로 재배포
```

---

## 🎯 정상 작동 확인

### 1. 브라우저 접속
```
https://your-frontend.up.railway.app
```

### 2. 개발자 도구 (F12) → Network 탭
```
✅ index.html → 200 OK
✅ /assets/index-xxxxx.js → 200 OK (application/javascript)
✅ /assets/index-xxxxx.css → 200 OK (text/css)
```

### 3. Console 탭
```
✅ 에러 없음
✅ React 앱 정상 로드
```

---

## 🚨 여전히 문제가 있다면

### 옵션 1: 빌드 명령 명시적으로 확인
```json
{
  "build": {
    "buildCommand": "cd client && npm ci && npm run build"
  }
}
```

### 옵션 2: 시작 명령 변경
```json
{
  "scripts": {
    "start": "npx vite preview --host 0.0.0.0 --port $PORT"
  }
}
```

### 옵션 3: Railway 서비스 재생성
1. Railway Dashboard에서 Frontend 서비스 삭제
2. 새로운 서비스 생성
3. GitHub 저장소 연결
4. Root Directory: `/client` 설정
5. 자동 배포 대기

---

## 📚 참고 자료

- [Vite 프로덕션 빌드](https://vitejs.dev/guide/build.html)
- [Vite Preview](https://vitejs.dev/guide/cli.html#vite-preview)
- [Railway 배포 가이드](https://docs.railway.app/deploy/deployments)

---

## ✅ 최종 확인 사항

- [ ] `client/railway.json` 설정 확인
- [ ] `client/package.json` scripts 확인
- [ ] Railway 빌드 로그 확인
- [ ] Railway 런타임 로그 확인
- [ ] 브라우저에서 정상 작동 확인
- [ ] Console 에러 없음 확인
