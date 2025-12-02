# 역할별 QR 로그인 설정 가이드

## 📋 개요

역할별로 구분된 QR 로그인 시스템을 통해 생산처, 제작처, 본사 담당자가 각각의 QR 코드로 빠르게 로그인할 수 있습니다.

---

## 🎯 역할별 QR URL

### 생산처 (Production)
```
https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/qr-login?role=production
```

**기능:**
- QR 스캔으로 금형 점검
- 일상/정기 점검 체크리스트 작성
- 수리요청 조회 및 관리
- 생산 현황 모니터링

---

### 제작처 (Maker)
```
https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/qr-login?role=maker
```

**기능:**
- 수리요청 접수 및 처리
- 금형 수리 이력 관리
- 작업 진행 상황 업데이트
- 완료 보고서 작성

---

### 본사 (HQ)
```
https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/qr-login?role=hq
```

**기능:**
- 전체 금형 현황 모니터링
- 수리요청 통합 관리
- 통계 및 리포트 조회
- 시스템 설정 관리

---

### 일반 로그인
```
https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/qr-login
```

**특징:**
- 모든 역할 사용 가능
- 로그인 후 역할별 대시보드로 자동 이동
- 범용 QR 코드

---

## 🎨 QR 코드 생성

### 1️⃣ 자동 생성 스크립트 사용

```bash
cd server
npm run qr:generate
```

**생성 결과:**
- `qr-codes/qr-login-production.png` - 생산처 QR
- `qr-codes/qr-login-maker.png` - 제작처 QR
- `qr-codes/qr-login-hq.png` - 본사 QR
- `qr-codes/qr-login-general.png` - 일반 QR
- `qr-codes/index.html` - 미리보기 페이지

### 2️⃣ 미리보기 확인

```bash
# qr-codes/index.html 파일을 브라우저로 열기
open qr-codes/index.html  # Mac
start qr-codes/index.html # Windows
```

### 3️⃣ 온라인 생성기 사용

**추천 사이트:**
- https://www.qr-code-generator.com/
- https://www.qrcode-monkey.com/
- https://goqr.me/

**생성 단계:**
1. 사이트 접속
2. "URL" 선택
3. 위의 역할별 URL 입력
4. QR 코드 생성
5. 이미지 다운로드 (PNG, 400x400px 이상 권장)

---

## 🚀 빠른 로그인 (개발용)

개발 환경에서는 빠른 로그인 버튼이 자동으로 표시됩니다.

### 테스트 계정

| 역할 | 아이디 | 비밀번호 | 설명 |
|------|--------|----------|------|
| 생산처 | `plant1` | `plant123` | 생산공장1 |
| 제작처 | `maker1` | `maker123` | A제작소 |
| 본사 | `developer` | `dev123` | 금형개발 담당자 |

### 빠른 로그인 표시 조건

```typescript
// 개발 환경에서만 표시
{process.env.NODE_ENV === 'development' && (
  <div className="quick-login">
    {/* 빠른 로그인 버튼들 */}
  </div>
)}
```

**프로덕션 배포 시:**
- 자동으로 숨겨짐
- `NODE_ENV=production`일 때 비활성화

---

## 📱 사용 방법

### 1️⃣ QR 코드 배포

**생산처:**
- 생산 현장 입구에 부착
- 작업자 휴게실에 게시
- 모바일 공지사항으로 전송

**제작처:**
- 수리 작업장 입구에 부착
- 작업 지시서에 인쇄
- 담당자 모바일로 전송

**본사:**
- 사무실 입구에 부착
- 관리자 모바일로 전송
- 인트라넷에 게시

### 2️⃣ 로그인 프로세스

```
1. QR 코드 스캔
   ↓
2. 역할별 로그인 페이지 열림
   ↓
3. 아이디/비밀번호 입력
   ↓
4. 로그인 성공
   ↓
5. QR 스캔 페이지로 이동
```

### 3️⃣ 역할별 화면 흐름

**생산처:**
```
QR 로그인 → QR 스캔 → 금형 선택 → 체크리스트 작성 → 제출
```

**제작처:**
```
QR 로그인 → 수리요청 목록 → 상세 조회 → 상태 변경 → 완료
```

**본사:**
```
QR 로그인 → 대시보드 → 통합 현황 → 리포트 조회
```

---

## 🔧 커스터마이징

### URL 변경

```javascript
// scripts/generate-qr-codes.js
const FRONTEND_URL = 'https://your-domain.com';

const qrUrls = {
  production: {
    url: `${FRONTEND_URL}/mobile/qr-login?role=production`,
    // ...
  }
};
```

### 역할 추가

```typescript
// client/src/pages/mobile/QrLoginPage.tsx
const roleInfo = {
  production: { /* ... */ },
  maker: { /* ... */ },
  hq: { /* ... */ },
  // 새 역할 추가
  supervisor: {
    title: '감독자 로그인',
    icon: <Shield className="w-12 h-12 text-orange-600" />,
    color: 'orange',
    defaultUser: 'supervisor1',
    defaultPass: 'super123'
  }
};
```

### 스타일 변경

```typescript
// 역할별 색상 변경
const roleInfo = {
  production: {
    color: 'blue',  // blue-600, blue-700 등
    // ...
  }
};
```

---

## ✅ 체크리스트

### QR 코드 생성 전
- [ ] 프론트엔드 도메인 확인
- [ ] 역할별 URL 확인
- [ ] QR 생성 스크립트 테스트

### QR 코드 생성 후
- [ ] 각 QR 코드 스캔 테스트
- [ ] 올바른 페이지로 이동 확인
- [ ] 역할별 UI 표시 확인

### 배포 전
- [ ] 개발용 빠른 로그인 숨김 확인
- [ ] 프로덕션 URL로 QR 재생성
- [ ] 모든 역할 로그인 테스트

---

## 🐛 문제 해결

### QR 스캔 후 페이지가 열리지 않음

**원인:**
- QR에 localhost 주소가 들어있음
- 잘못된 도메인

**해결:**
```bash
# QR 코드 재생성
cd server
npm run qr:generate
```

### 역할별 UI가 표시되지 않음

**원인:**
- URL에 role 파라미터 누락

**확인:**
```
✅ https://...app/mobile/qr-login?role=production
❌ https://...app/mobile/qr-login
```

### 빠른 로그인이 프로덕션에서 보임

**원인:**
- NODE_ENV가 production으로 설정되지 않음

**해결:**
```bash
# Railway 환경 변수 확인
NODE_ENV=production
```

---

## 📊 QR 코드 사양

### 권장 사양
- **크기:** 400x400px 이상
- **포맷:** PNG (투명 배경 가능)
- **에러 수정 레벨:** H (High, 30%)
- **여백:** 2 모듈

### 인쇄 사양
- **최소 크기:** 3cm x 3cm
- **권장 크기:** 5cm x 5cm
- **해상도:** 300 DPI 이상
- **용지:** 코팅지 또는 라미네이팅

---

## 📝 예제

### 역할별 로그인 플로우

**생산처 담당자:**
```
1. 생산 현장 QR 스캔
2. "생산처 로그인" 페이지 열림
3. plant1 / plant123 입력
4. QR 스캔 페이지로 이동
5. 금형 QR 스캔하여 점검 시작
```

**제작처 담당자:**
```
1. 작업장 QR 스캔
2. "제작처 로그인" 페이지 열림
3. maker1 / maker123 입력
4. 수리요청 목록 페이지로 이동
5. 수리 작업 진행
```

**본사 담당자:**
```
1. 사무실 QR 스캔
2. "본사 로그인" 페이지 열림
3. developer / dev123 입력
4. 통합 대시보드로 이동
5. 전체 현황 모니터링
```

---

## 🔐 보안 고려사항

### QR 코드 보안
- QR 코드는 공개 URL이므로 누구나 스캔 가능
- 실제 보안은 로그인 인증으로 처리
- 비밀번호는 반드시 안전하게 관리

### 권장 사항
- 정기적인 비밀번호 변경
- 강력한 비밀번호 정책 적용
- 로그인 시도 횟수 제한
- 세션 타임아웃 설정

---

## 📚 참고 자료

- [QR Login Troubleshooting Guide](./QR_LOGIN_TROUBLESHOOTING.md)
- [QR Checklist Flow Test Guide](./QR_CHECKLIST_FLOW_TEST_GUIDE.md)
- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT_TROUBLESHOOTING.md)

---

## 🆘 지원

문제가 발생하면:
1. [QR Login Troubleshooting Guide](./QR_LOGIN_TROUBLESHOOTING.md) 참고
2. 브라우저 개발자 도구로 에러 확인
3. Railway 로그 확인
4. 이슈 등록

---

**마지막 업데이트:** 2024-12-02
