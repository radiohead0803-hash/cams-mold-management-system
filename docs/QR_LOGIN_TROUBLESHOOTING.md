# QR 로그인 문제 해결 가이드

## 🎯 목차
1. [QR URL 확인](#qr-url-확인)
2. [올바른 URL 형식](#올바른-url-형식)
3. [흔한 문제별 해결법](#흔한-문제별-해결법)
4. [체크리스트](#체크리스트)
5. [QR 코드 생성 방법](#qr-코드-생성-방법)

---

## 🔍 QR URL 확인

### 1️⃣ QR 코드에 들어있는 URL 확인하기

**방법 1: PC에서 QR 스캐너 사용**
- Chrome 확장 프로그램 또는 온라인 QR 리더 사용
- 스캔 결과로 나오는 URL 문자열 확인

**방법 2: 휴대폰에서 확인**
- 카메라 앱으로 QR 스캔
- 알림에 표시되는 URL 확인 (클릭하지 말고!)

---

## ✅ 올바른 URL 형식

### 현재 프로젝트 도메인

**프론트엔드:**
```
https://bountiful-nurturing-production-cd5c.up.railway.app
```

**백엔드:**
```
https://cams-mold-management-system-production-cb6e.up.railway.app
```

### QR 코드에 들어가야 하는 URL (정답)

**기본 QR 로그인:**
```
https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/qr-login
```

**역할별 QR 로그인 (선택):**
```
생산처: https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/qr-login?role=production
제작처: https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/qr-login?role=maker
본사:   https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/qr-login?role=hq
```

### ❌ 잘못된 URL 예시

```
❌ http://localhost:5173/mobile/qr-login
   → 로컬 개발 서버 주소 (외부 접속 불가)

❌ http://127.0.0.1:5173/mobile/qr-login
   → 로컬 IP 주소 (외부 접속 불가)

❌ https://cams-mold-management-system-production-cb6e.up.railway.app/mobile/qr-login
   → 백엔드 도메인 (프론트엔드 아님!)

❌ https://bountiful-nurturing-production-cd5c.up.railway.app
   → 경로 없음 (라우터 경로 필요)

❌ https://bountiful-nurturing-production-cd5c.up.railway.app/api/v1/auth/login
   → API 엔드포인트 (화면이 아님)
```

---

## 🔧 흔한 문제별 해결법

### 문제 1: "연결할 수 없음" / "사이트를 찾을 수 없음"

**증상:**
- QR 스캔 후 브라우저가 열리지만 "사이트에 연결할 수 없습니다" 메시지

**원인:**
- QR에 `localhost` 또는 내부망 주소가 들어있음

**해결:**
1. QR 코드의 URL 확인
2. 올바른 프론트엔드 도메인으로 새 QR 생성
   ```
   https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/qr-login
   ```

---

### 문제 2: 흰 화면 / 아무것도 안 나옴

**증상:**
- QR 스캔 후 페이지는 열리지만 흰 화면만 표시

**원인:**
1. 라우터 경로가 존재하지 않음
2. SPA fallback 설정 누락
3. 빌드 파일 문제

**해결:**

#### A. 라우터 경로 확인
```typescript
// client/src/App.tsx 또는 Router.tsx
<Route path="/mobile/qr-login" element={<QrLoginPage />} />
```

#### B. SPA Fallback 설정 (Vite)
```javascript
// client/vite.config.js
export default defineConfig({
  // ...
  preview: {
    port: 4173,
    strictPort: true,
  }
});
```

#### C. Express SPA 서빙 (백엔드에서 프론트 서빙하는 경우)
```javascript
// server/src/app.js
const path = require('path');

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../../client/dist')));

// SPA fallback - 모든 경로를 index.html로
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});
```

#### D. PC에서 직접 테스트
```
1. PC 브라우저에서 동일한 URL 접속
2. F12 → Console 탭 확인
3. 에러 메시지 확인:
   - "Failed to load module script" → main.jsx 직접 로드 문제
   - "404 Not Found" → 라우터 경로 없음
   - "CORS error" → CORS 설정 문제
```

---

### 문제 3: 로그인 화면은 나오는데 로그인이 안 됨

**증상:**
- QR 로그인 페이지는 정상 표시
- 로그인 버튼 클릭 시 반응 없음 또는 에러

**원인:**
1. CORS 에러
2. 백엔드 API 에러 (401, 500)
3. 프론트엔드 로직 에러

**해결:**

#### A. CORS 설정 확인
```javascript
// server/src/app.js
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5173',
  'https://bountiful-nurturing-production-cd5c.up.railway.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Railway 도메인 패턴 매칭
    if (origin.includes('.up.railway.app')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
```

#### B. PC에서 Network 탭 확인
```
1. PC 브라우저에서 QR 로그인 페이지 접속
2. F12 → Network 탭 열기
3. 로그인 버튼 클릭
4. POST /api/v1/auth/login 요청 확인:
   - 200 OK → 성공 (리다이렉트 로직 확인)
   - 401 Unauthorized → 인증 실패
   - 403 Forbidden → 권한 없음
   - 500 Internal Server Error → 백엔드 에러
   - CORS error → CORS 설정 확인
```

#### C. 백엔드 로그 확인
```
Railway Dashboard → Backend Service → Logs
로그인 시도 시 에러 메시지 확인
```

---

### 문제 4: 로그인 후 다음 페이지로 안 넘어감

**증상:**
- 로그인 API는 200 OK
- 하지만 QR 스캔 페이지로 이동하지 않음

**원인:**
- 프론트엔드 리다이렉트 로직 문제

**해결:**

#### A. 로그인 성공 후 리다이렉트 확인
```typescript
// QrLoginPage.tsx
const handleLogin = async (user) => {
  try {
    const res = await api.post('/api/v1/auth/login', {
      username: user.username,
      password: user.password
    });

    if (res.data.success) {
      // 토큰 저장
      localStorage.setItem('token', res.data.token);
      
      // QR 스캔 페이지로 리다이렉트
      navigate('/mobile/qr-scan');
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('로그인 실패');
  }
};
```

#### B. 라우터 경로 확인
```typescript
// App.tsx
<Route path="/mobile/qr-login" element={<QrLoginPage />} />
<Route path="/mobile/qr-scan" element={<QrScanPage />} />
```

---

## ✅ 체크리스트

### QR 코드 생성 전 확인사항

- [ ] 프론트엔드 도메인 확인
  ```
  https://bountiful-nurturing-production-cd5c.up.railway.app
  ```

- [ ] 라우터 경로 확인
  ```
  /mobile/qr-login
  ```

- [ ] 완전한 URL 조합
  ```
  https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/qr-login
  ```

- [ ] localhost 주소 사용 안 함
- [ ] 백엔드 도메인 사용 안 함
- [ ] API 엔드포인트 사용 안 함

### 테스트 체크리스트

- [ ] PC에서 URL 직접 접속 → 페이지 정상 표시
- [ ] PC에서 로그인 테스트 → 성공
- [ ] PC에서 QR 스캔 페이지 이동 → 정상
- [ ] 휴대폰에서 QR 스캔 → 페이지 열림
- [ ] 휴대폰에서 로그인 → 성공
- [ ] 휴대폰에서 QR 스캔 → 정상 작동

---

## 🎨 QR 코드 생성 방법

### 온라인 QR 생성기 사용

**추천 사이트:**
- https://www.qr-code-generator.com/
- https://www.qrcode-monkey.com/
- https://goqr.me/

**생성 단계:**
1. 사이트 접속
2. "URL" 또는 "Website" 선택
3. URL 입력:
   ```
   https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/qr-login
   ```
4. QR 코드 생성
5. 이미지 다운로드 (PNG, SVG)

### Node.js로 QR 생성 (선택)

```bash
npm install qrcode
```

```javascript
// scripts/generate-qr.js
const QRCode = require('qrcode');

const urls = {
  production: 'https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/qr-login?role=production',
  maker: 'https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/qr-login?role=maker',
  hq: 'https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/qr-login?role=hq'
};

Object.entries(urls).forEach(([role, url]) => {
  QRCode.toFile(`qr-${role}.png`, url, {
    width: 300,
    margin: 2
  }, (err) => {
    if (err) throw err;
    console.log(`QR code for ${role} generated!`);
  });
});
```

```bash
node scripts/generate-qr.js
```

---

## 🐛 디버깅 팁

### 1. 브라우저 개발자 도구 활용

**Console 탭:**
```javascript
// 현재 URL 확인
console.log(window.location.href);

// 로컬스토리지 확인
console.log(localStorage.getItem('token'));

// API 베이스 URL 확인
console.log(import.meta.env.VITE_API_URL);
```

**Network 탭:**
- All 필터 선택
- Preserve log 체크
- 로그인 버튼 클릭
- 요청/응답 확인

**Application 탭:**
- Local Storage 확인
- Session Storage 확인
- Cookies 확인

### 2. Railway 로그 확인

```
Railway Dashboard → Backend Service → Deployments → View Logs
```

**확인 사항:**
- 서버 시작 로그
- API 요청 로그
- 에러 로그

### 3. 모바일 디버깅

**Android:**
- Chrome 원격 디버깅
- `chrome://inspect` 접속
- 연결된 기기에서 페이지 선택

**iOS:**
- Safari 개발자 메뉴 활성화
- Mac에서 Safari → 개발 → 기기 선택

---

## 📝 문제 보고 템플릿

문제가 해결되지 않을 경우 아래 정보를 함께 제공해주세요:

```
### 환경
- 디바이스: (예: iPhone 13, Galaxy S21)
- OS: (예: iOS 16, Android 12)
- 브라우저: (예: Safari, Chrome)

### QR URL
- QR에 들어있는 URL: 

### 증상
- QR 스캔 후 어떤 일이 발생하는지:

### 에러 메시지
- Console 에러:
- Network 에러:

### 스크린샷
- (가능하면 첨부)
```

---

## 🎯 빠른 해결 플로우차트

```
QR 스캔
  ↓
페이지가 열리나요?
  ├─ NO → QR URL 확인 (localhost? 백엔드 도메인?)
  │        → 올바른 프론트 URL로 QR 재생성
  │
  └─ YES → 흰 화면인가요?
           ├─ YES → PC에서 동일 URL 접속
           │        → F12 Console 에러 확인
           │        → 라우터 경로 / SPA fallback 확인
           │
           └─ NO → 로그인 화면이 나오나요?
                    ├─ NO → 라우터 경로 확인
                    │
                    └─ YES → 로그인이 되나요?
                             ├─ NO → Network 탭 확인
                             │        → CORS / API 에러 확인
                             │
                             └─ YES → 다음 페이지로 이동하나요?
                                      ├─ NO → 리다이렉트 로직 확인
                                      │
                                      └─ YES → 성공! 🎉
```

---

## 📚 참고 자료

- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT_TROUBLESHOOTING.md)
- [QR Checklist Flow Test Guide](./QR_CHECKLIST_FLOW_TEST_GUIDE.md)
- [CORS Configuration](../server/src/app.js)
- [Frontend Router](../client/src/App.tsx)

---

## 🆘 추가 도움이 필요한 경우

1. **PC에서 먼저 테스트**
   - 동일한 URL을 PC 브라우저에서 열기
   - F12 개발자 도구로 에러 확인

2. **Railway 로그 확인**
   - 백엔드 서비스 로그
   - 프론트엔드 빌드 로그

3. **단계별 테스트**
   - 프론트엔드 도메인 접속 → OK?
   - /mobile/qr-login 경로 → OK?
   - 로그인 API → OK?
   - QR 스캔 페이지 → OK?

4. **문제 보고**
   - 위 템플릿 사용
   - 스크린샷 첨부
   - 에러 로그 첨부
