# 네이버 지도 API 설정 가이드

## 📋 목차
1. [네이버 클라우드 플랫폼 설정](#1-네이버-클라우드-플랫폼-설정)
2. [환경 변수 설정](#2-환경-변수-설정)
3. [Railway 배포 설정](#3-railway-배포-설정)
4. [테스트 및 확인](#4-테스트-및-확인)
5. [문제 해결](#5-문제-해결)

---

## 1. 네이버 클라우드 플랫폼 설정

### 1-1. 네이버 클라우드 플랫폼 가입 및 로그인
1. https://www.ncloud.com 접속
2. 회원가입 또는 로그인
3. 콘솔 접속

### 1-2. Maps API 서비스 신청
1. 콘솔 메뉴에서 **AI·Application 서비스** → **Maps** 선택
   - 또는 **Application** → **Map** 선택
2. **이용 신청** 버튼 클릭
3. 약관 동의 후 신청 완료

### 1-3. Client ID 발급
1. Maps 서비스 페이지에서 **인증 정보** 탭 선택
2. **Client ID** 확인 (예: `g2psxxxxxx`)
3. 이 값을 복사해둡니다 (환경 변수에 사용)

### 1-4. 웹 서비스 환경 등록
1. **Web Dynamic Map** 선택
2. **서비스 환경 등록** 클릭
3. 아래 도메인들을 등록:
   ```
   http://localhost:5173
   http://localhost:3000
   https://bountiful-nurturing-production-cd5c.up.railway.app
   ```
4. 저장

> **중요**: 도메인이 정확히 등록되지 않으면 CORS 에러가 발생합니다!

---

## 2. 환경 변수 설정

### 2-1. 로컬 개발 환경

**파일**: `client/.env.development`

```env
VITE_KAKAO_MAP_KEY=75ad5fc91b82cb435e23430a7d3a3031
VITE_NAVER_MAP_CLIENT_ID=여기에_발급받은_ClientID_입력
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=CAMS
VITE_APP_VERSION=1.0.0
```

### 2-2. 프로덕션 환경

**파일**: `client/.env.production`

```env
VITE_API_URL=https://cams-mold-management-system-production-cb6e.up.railway.app
VITE_APP_NAME=CAMS
VITE_APP_VERSION=1.0.0
VITE_FRONTEND_URL=https://bountiful-nurturing-production-cd5c.up.railway.app
VITE_API_BASE_URL=https://cams-mold-management-system-production-cb6e.up.railway.app
VITE_KAKAO_MAP_KEY=75ad5fc91b82cb435e23430a7d3a3031
VITE_NAVER_MAP_CLIENT_ID=여기에_발급받은_ClientID_입력
```

---

## 3. Railway 배포 설정

### 3-1. Railway 환경 변수 추가

1. Railway 대시보드 접속
2. 프론트엔드 서비스 선택
3. **Variables** 탭 클릭
4. **New Variable** 클릭
5. 아래 변수 추가:
   ```
   Key: VITE_NAVER_MAP_CLIENT_ID
   Value: 발급받은_ClientID
   ```
6. **Save** 클릭

### 3-2. 재배포

환경 변수 추가 후 자동으로 재배포되거나, 수동으로 **Redeploy** 버튼 클릭

---

## 4. 테스트 및 확인

### 4-1. 로컬 개발 환경 테스트

```bash
# 프론트엔드 실행
cd client
npm run dev
```

브라우저에서 확인:
1. http://localhost:5173 접속
2. 시스템 관리자 대시보드 이동
3. 지도 영역에서 **Naver** 버튼 클릭
4. 네이버 지도가 정상적으로 표시되는지 확인

### 4-2. 콘솔 확인

**정상 로드 시**:
```
[NaverMap] SDK 로드 완료
[NaverMap] 지도 초기화 완료
[NaverMap] 15개 마커 생성 완료
```

**에러 발생 시**:
```
[NaverMap] VITE_NAVER_MAP_CLIENT_ID가 없습니다.
[NaverMap] SDK 로드 실패
[NaverMap] naver.maps가 없습니다.
```

### 4-3. 네트워크 탭 확인

1. 브라우저 개발자 도구 (F12) 열기
2. **Network** 탭 선택
3. 아래 요청 확인:
   ```
   https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=...
   ```
4. Status가 **200 OK**인지 확인

---

## 5. 문제 해결

### 문제 1: "네이버 지도 Client ID가 설정되지 않았습니다"

**원인**: 환경 변수가 설정되지 않음

**해결**:
1. `.env.development` 또는 `.env.production` 파일 확인
2. `VITE_NAVER_MAP_CLIENT_ID` 값이 올바른지 확인
3. 개발 서버 재시작 (`npm run dev`)

### 문제 2: "Failed to load script"

**원인**: 
- Client ID가 잘못됨
- 도메인이 네이버 클라우드에 등록되지 않음

**해결**:
1. 네이버 클라우드 플랫폼 → Maps → 인증 정보에서 Client ID 재확인
2. 서비스 환경에 현재 도메인이 등록되어 있는지 확인
3. CORS 에러인 경우 도메인 재등록

### 문제 3: "naver is not defined"

**원인**: 네이버 지도 SDK 스크립트가 로드되지 않음

**해결**:
1. 네트워크 탭에서 SDK 요청 확인
2. Client ID가 URL에 포함되어 있는지 확인
3. 브라우저 캐시 삭제 후 재시도

### 문제 4: Railway 배포 후 지도가 안 보임

**원인**: Railway 환경 변수 미설정

**해결**:
1. Railway → 프론트엔드 서비스 → Variables 확인
2. `VITE_NAVER_MAP_CLIENT_ID` 변수 추가
3. 서비스 재배포
4. Railway 프론트엔드 URL을 네이버 클라우드 서비스 환경에 등록

---

## 6. 지도 타입 전환 사용법

### 6-1. UI에서 전환

시스템 관리자 대시보드에서:
1. 금형 위치 현황 섹션 찾기
2. 우측 상단 **지도 타입** 버튼 확인
3. **Kakao** 또는 **Naver** 클릭하여 전환

### 6-2. 기본 지도 변경

**파일**: `client/src/pages/dashboards/SystemAdminDashboard.jsx`

```javascript
// 기본값을 카카오로 변경
const [mapType, setMapType] = useState('kakao');

// 기본값을 네이버로 변경 (현재 설정)
const [mapType, setMapType] = useState('naver');
```

---

## 7. API 비용 및 제한

### 네이버 지도 API 무료 사용량

- **Web Dynamic Map**: 월 300,000건 무료
- **Geocoding**: 월 100,000건 무료
- **Static Map**: 월 100,000건 무료

> 무료 사용량 초과 시 자동으로 과금됩니다. 사용량 모니터링을 권장합니다.

### 사용량 확인

1. 네이버 클라우드 플랫폼 콘솔
2. **이용 현황** 메뉴
3. Maps 서비스 사용량 확인

---

## 8. 참고 자료

- [네이버 클라우드 플랫폼 Maps API 문서](https://api.ncloud-docs.com/docs/ai-naver-mapswebdynamicmap)
- [네이버 지도 JavaScript API v3](https://navermaps.github.io/maps.js.ncp/)
- [CAMS 프로젝트 GitHub](https://github.com/radiohead0803-hash/cams-mold-management-system)

---

## 9. 체크리스트

설정 완료 확인:

- [ ] 네이버 클라우드 플랫폼 가입 완료
- [ ] Maps API 서비스 신청 완료
- [ ] Client ID 발급 완료
- [ ] 웹 서비스 환경 등록 완료 (localhost + Railway URL)
- [ ] `.env.development`에 Client ID 추가
- [ ] `.env.production`에 Client ID 추가
- [ ] Railway Variables에 Client ID 추가
- [ ] 로컬 환경에서 네이버 지도 정상 작동 확인
- [ ] Railway 배포 후 네이버 지도 정상 작동 확인
- [ ] 카카오 ↔ 네이버 지도 전환 정상 작동 확인

---

**작성일**: 2024-12-02  
**버전**: 1.0.0  
**작성자**: CAMS Development Team
