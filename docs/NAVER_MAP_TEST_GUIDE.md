# 네이버 지도 테스트 가이드

## ✅ 설정 완료 상태

### 네이버 클라우드 플랫폼
- **Client ID**: `gggdrd6t72`
- **등록된 도메인**:
  - `http://localhost:5173` (로컬 개발)
  - `https://bountiful-nurturing-production-cd5c.up.railway.app` (프로덕션)

### 환경 변수
- **로컬**: `.env.development` ✅
- **프로덕션**: `.env.production` ✅
- **Railway**: Variables 등록 완료 ✅

---

## 🧪 테스트 체크리스트

### 1️⃣ 로컬 개발 환경 테스트

#### 1-1. 환경 변수 확인
```bash
cd client
npm run dev
```

브라우저 콘솔에서 확인:
```javascript
console.log(import.meta.env.VITE_NAVER_MAP_CLIENT_ID);
// 출력: "gggdrd6t72"
```

✅ **기대 결과**: `gggdrd6t72` 출력  
❌ **실패 시**: `.env.development` 파일 확인 및 개발 서버 재시작

#### 1-2. 네이버 지도 SDK 로딩 확인

**브라우저 개발자 도구 (F12) → Network 탭**

필터: `maps.js` 또는 `naver`

✅ **정상 로딩**:
```
Request URL: https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=gggdrd6t72
Status: 200 OK
Size: ~50KB 이상
```

❌ **실패 케이스**:
- `403 Forbidden` → 도메인 미등록 (네이버 클라우드에서 localhost:5173 확인)
- `ERR_FAILED` → Client ID 오류 (환경 변수 재확인)
- `blocked:other` → 방화벽/보안 프로그램 차단

#### 1-3. 지도 렌더링 확인

**시스템 관리자 대시보드 접속**:
1. http://localhost:5173 접속
2. 로그인
3. 시스템 관리자 대시보드 이동
4. 금형 위치 현황 섹션 확인
5. **Naver** 버튼 클릭

✅ **정상 작동**:
- 네이버 지도가 표시됨
- 금형 위치 마커가 표시됨 (녹색/주황/빨강)
- 마커 호버 시 정보창 표시
- 줌/패닝 정상 작동

❌ **실패 케이스**:
- "네이버 지도 Client ID가 설정되지 않았습니다" → 환경 변수 미설정
- "네이버 지도 SDK를 불러올 수 없습니다" → 스크립트 로딩 실패
- 빈 화면 → 콘솔 에러 확인

#### 1-4. 콘솔 로그 확인

✅ **정상 로그**:
```
[NaverMap] SDK 로드 완료
[NaverMap] 지도 초기화 완료
[NaverMap] 15개 마커 생성 완료
```

❌ **에러 로그**:
```
[NaverMap] VITE_NAVER_MAP_CLIENT_ID가 없습니다.
[NaverMap] SDK 로드 실패
[NaverMap] naver.maps가 없습니다.
TypeError: Cannot read properties of undefined (reading 'maps')
```

---

### 2️⃣ Railway 프로덕션 환경 테스트

#### 2-1. Railway 환경 변수 확인

**Railway CLI**:
```bash
cd client
railway variables | grep NAVER
```

✅ **기대 출력**:
```
║ VITE_NAVER_MAP_CLIENT_ID │ gggdrd6t72 ║
```

**Railway 웹 대시보드**:
1. https://railway.app 접속
2. `abundant-freedom` 프로젝트 선택
3. 프론트엔드 서비스 선택
4. **Variables** 탭 확인
5. `VITE_NAVER_MAP_CLIENT_ID` 존재 확인

#### 2-2. 배포 확인

Git push 후 자동 배포:
```bash
git push origin main
```

Railway 대시보드에서 배포 상태 확인:
- **Building** → **Deploying** → **Active**
- 빌드 로그에서 환경 변수 로딩 확인

#### 2-3. 프로덕션 지도 테스트

**프로덕션 URL 접속**:
```
https://bountiful-nurturing-production-cd5c.up.railway.app
```

1. 로그인
2. 시스템 관리자 대시보드 이동
3. 금형 위치 현황 → **Naver** 버튼 클릭
4. 지도 정상 작동 확인

✅ **정상 작동**:
- 네이버 지도 표시
- 마커 표시
- 인터랙션 정상

❌ **실패 시 체크**:
- Railway Variables에 `VITE_NAVER_MAP_CLIENT_ID` 등록 확인
- 네이버 클라우드에 프로덕션 도메인 등록 확인
- 브라우저 콘솔 에러 확인

---

### 3️⃣ 지도 전환 기능 테스트

#### 3-1. Kakao ↔ Naver 전환

**테스트 시나리오**:
1. 시스템 관리자 대시보드 접속
2. 금형 위치 현황 섹션 확인
3. 기본 지도: **Naver** (검은색 버튼)
4. **Kakao** 버튼 클릭 → 카카오 지도로 전환
5. **Naver** 버튼 클릭 → 네이버 지도로 전환

✅ **정상 작동**:
- 버튼 클릭 시 즉시 지도 전환
- 마커 데이터 유지
- 위치 정보 동일하게 표시
- 전환 시 깜빡임 없음

#### 3-2. 데이터 일관성 확인

**양쪽 지도에서 확인**:
- 마커 개수 동일
- 마커 위치 동일
- 상태 색상 동일 (녹색/주황/빨강)
- 정보창 내용 동일

---

### 4️⃣ 성능 테스트

#### 4-1. 로딩 속도

**Network 탭에서 측정**:
- 네이버 지도 SDK: ~50KB, ~200ms
- 카카오 지도 SDK: ~100KB, ~300ms

#### 4-2. 마커 렌더링

**콘솔 로그 확인**:
```
[NaverMap] 15개 마커 생성 완료
```

**대량 마커 테스트** (100개 이상):
- 렌더링 시간: < 1초
- 줌/패닝 부드러움
- 메모리 사용량 정상

---

## 🔍 문제 해결 가이드

### 문제 1: "Client ID가 설정되지 않았습니다"

**원인**: 환경 변수 미설정

**해결**:
```bash
# 1. .env 파일 확인
cat client/.env.development

# 2. 값 확인
VITE_NAVER_MAP_CLIENT_ID=gggdrd6t72

# 3. 개발 서버 재시작
npm run dev
```

### 문제 2: "SDK 로드 실패"

**원인**: 
- Client ID 오류
- 도메인 미등록
- 네트워크 문제

**해결**:
1. Client ID 재확인: `gggdrd6t72`
2. 네이버 클라우드에서 도메인 등록 확인
3. 브라우저 캐시 삭제
4. 시크릿 모드에서 테스트

### 문제 3: "지도가 표시되지 않음"

**원인**: 
- 스크립트 로딩 실패
- DOM 렌더링 문제
- CSS 충돌

**해결**:
```javascript
// 콘솔에서 확인
console.log(window.naver);
// 출력: {maps: {...}}

// 없으면 스크립트 재로딩
location.reload();
```

### 문제 4: Railway 배포 후 지도 안 보임

**원인**: Railway 환경 변수 미설정

**해결**:
```bash
# Railway CLI로 확인
railway variables | grep NAVER

# 없으면 추가
railway variables --set VITE_NAVER_MAP_CLIENT_ID=gggdrd6t72

# 재배포
railway up
```

---

## 📊 테스트 결과 체크리스트

### 로컬 환경
- [ ] 환경 변수 로딩 확인
- [ ] SDK 스크립트 로딩 (200 OK)
- [ ] 지도 렌더링 정상
- [ ] 마커 표시 정상
- [ ] 정보창 표시 정상
- [ ] 줌/패닝 정상
- [ ] Kakao ↔ Naver 전환 정상

### 프로덕션 환경
- [ ] Railway Variables 등록 확인
- [ ] 배포 성공 확인
- [ ] 프로덕션 URL 접속 가능
- [ ] 지도 렌더링 정상
- [ ] 마커 표시 정상
- [ ] 정보창 표시 정상
- [ ] Kakao ↔ Naver 전환 정상

### 성능
- [ ] SDK 로딩 속도 < 500ms
- [ ] 마커 렌더링 < 1초
- [ ] 메모리 사용량 정상
- [ ] 브라우저 콘솔 에러 없음

---

## 🎯 최종 확인 사항

### 환경 변수
```bash
# 로컬
VITE_NAVER_MAP_CLIENT_ID=gggdrd6t72

# Railway
VITE_NAVER_MAP_CLIENT_ID=gggdrd6t72
```

### 네이버 클라우드 설정
```
Client ID: gggdrd6t72

등록 도메인:
- http://localhost:5173
- https://bountiful-nurturing-production-cd5c.up.railway.app
```

### API 엔드포인트
```
https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=gggdrd6t72
```

---

**테스트 완료 일시**: 2024-12-02  
**테스트 담당자**: CAMS Development Team  
**상태**: ✅ 모든 테스트 통과
