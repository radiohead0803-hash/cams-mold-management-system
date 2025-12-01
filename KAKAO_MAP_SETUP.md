# 🗺️ 카카오맵 API 설정 가이드

## 1. 카카오 개발자 센터 가입

### 1-1. 회원가입
```
https://developers.kakao.com/
→ 시작하기
→ 카카오 계정으로 로그인
```

### 1-2. 애플리케이션 추가
```
내 애플리케이션 → 애플리케이션 추가하기
- 앱 이름: CAMS 금형관리 시스템
- 사업자명: (선택사항)
```

---

## 2. JavaScript 키 발급

### 2-1. 앱 키 확인
```
내 애플리케이션 → 앱 선택
→ 앱 키 탭
→ JavaScript 키 복사
→ 예: 1234567890abcdef1234567890abcdef
```

### 2-2. 플랫폼 등록
```
내 애플리케이션 → 앱 선택
→ 플랫폼 탭
→ Web 플랫폼 등록

사이트 도메인:
- 개발: http://localhost:5173
- 프로덕션: https://your-domain.up.railway.app
```

---

## 3. 프로젝트에 적용

### 3-1. JavaScript 키 설정

#### 방법 1: index.html 직접 수정 (간단)
```html
<!-- client/index.html -->
<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_APP_KEY"></script>
```

**YOUR_APP_KEY**를 실제 발급받은 JavaScript 키로 교체

#### 방법 2: 환경 변수 사용 (권장)
```bash
# client/.env
VITE_KAKAO_MAP_APP_KEY=your_actual_app_key
```

```html
<!-- client/index.html -->
<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=%VITE_KAKAO_MAP_APP_KEY%"></script>
```

---

## 4. Railway 배포 설정

### 4-1. Railway 환경 변수 설정
```
1. Railway 대시보드 접속
2. 프로젝트 선택
3. 프론트엔드 서비스 클릭
4. Variables 탭
5. New Variable:
   - Name: VITE_KAKAO_MAP_APP_KEY
   - Value: your_actual_app_key
6. Deploy
```

### 4-2. 도메인 등록
```
카카오 개발자 센터
→ 내 애플리케이션
→ 플랫폼 설정
→ Web 플랫폼에 Railway URL 추가
→ https://your-app.up.railway.app
```

---

## 5. 테스트

### 5-1. 로컬 테스트
```bash
cd client
npm run dev
```

브라우저 콘솔 확인:
```
✅ Kakao Map initialized
✅ 10 markers added to Kakao Map
```

### 5-2. 프로덕션 테스트
```
https://your-app.up.railway.app/dashboard/admin
→ "GPS 지도 보기" 클릭
→ 카카오맵 로딩 확인
```

---

## 6. 요금 안내

### 무료 할당량
```
지도 API: 월 300,000건 무료
초과 시: 1,000건당 5원
```

### 사용량 계산
```
1일 사용자: 100명
1인당 지도 조회: 10회
월 사용량: 100 × 10 × 30 = 30,000건

→ 무료 범위 내 ✅
```

---

## 7. 트러블슈팅

### 문제 1: 지도가 로딩되지 않음
```
원인: JavaScript 키 미설정 또는 잘못된 키
해결: 
1. 브라우저 콘솔 확인
2. JavaScript 키 재확인
3. 플랫폼 도메인 등록 확인
```

### 문제 2: "Invalid appkey" 에러
```
원인: 플랫폼 도메인 미등록
해결:
1. 카카오 개발자 센터
2. 내 애플리케이션 → 플랫폼
3. Web 플랫폼에 현재 URL 추가
```

### 문제 3: CORS 에러
```
원인: 허용되지 않은 도메인
해결:
1. 카카오 개발자 센터
2. 플랫폼 설정
3. 사이트 도메인에 도메인 추가
```

---

## 8. 고급 기능

### 8-1. 마커 클러스터러
```javascript
// 많은 마커를 그룹화
const clusterer = new kakao.maps.MarkerClusterer({
  map: map,
  averageCenter: true,
  minLevel: 10
});

clusterer.addMarkers(markers);
```

### 8-2. 경로 표시
```javascript
// 금형 이동 경로 표시
const linePath = [
  new kakao.maps.LatLng(37.5665, 126.9780),
  new kakao.maps.LatLng(35.5384, 129.3114)
];

const polyline = new kakao.maps.Polyline({
  path: linePath,
  strokeWeight: 3,
  strokeColor: '#5347AA',
  strokeOpacity: 0.7,
  strokeStyle: 'solid'
});

polyline.setMap(map);
```

### 8-3. 주소 검색 (Geocoding)
```javascript
// 주소로 좌표 찾기
const geocoder = new kakao.maps.services.Geocoder();

geocoder.addressSearch('서울특별시 강남구 테헤란로 152', function(result, status) {
  if (status === kakao.maps.services.Status.OK) {
    const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
    // 마커 표시
  }
});
```

---

## 9. 카카오맵 vs 네이버 지도

### 카카오맵 장점
```
✅ 무료 할당량이 많음 (월 30만건)
✅ 간단한 API 키 발급
✅ 신용카드 등록 불필요
✅ 모바일 최적화
✅ 한국 지도 정확도 높음
```

### 네이버 지도 장점
```
✅ 더 상세한 지도 정보
✅ 실시간 교통 정보
✅ 거리뷰 지원
✅ 기업용 기능 풍부
```

### 선택 기준
```
소규모/스타트업: 카카오맵 추천 ✅
대규모/기업: 네이버 지도 추천
```

---

## 10. 참고 자료

### 공식 문서
```
카카오맵 API
https://apis.map.kakao.com/

JavaScript API 가이드
https://apis.map.kakao.com/web/guide/

샘플 코드
https://apis.map.kakao.com/web/sample/
```

### 유용한 링크
```
개발자 센터
https://developers.kakao.com/

API 문서
https://developers.kakao.com/docs/latest/ko/local/dev-guide

FAQ
https://devtalk.kakao.com/
```

---

## 11. 체크리스트

### 설정 완료 확인
- [ ] 카카오 개발자 센터 가입
- [ ] 애플리케이션 추가
- [ ] JavaScript 키 발급
- [ ] Web 플랫폼 등록
- [ ] index.html에 JavaScript 키 설정
- [ ] 로컬 테스트 성공
- [ ] Railway 환경 변수 설정
- [ ] 프로덕션 도메인 등록
- [ ] 프로덕션 테스트 성공

---

## 🎉 완료!

카카오맵 API가 성공적으로 연동되었습니다!

**다음 단계**:
1. JavaScript 키 발급 (5분)
2. index.html 수정
3. 재배포
4. 지도 확인

**예상 소요 시간**: 5-10분

**장점**:
- ✅ 무료 할당량 충분
- ✅ 신용카드 불필요
- ✅ 간단한 설정
- ✅ 빠른 연동
