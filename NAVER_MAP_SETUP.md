# 🗺️ 네이버 지도 API 설정 가이드

## 1. 네이버 클라우드 플랫폼 가입

### 1-1. 회원가입
```
https://www.ncloud.com/
→ 회원가입
→ 본인인증 (휴대폰 또는 아이핀)
```

### 1-2. 결제 수단 등록
```
마이페이지 → 결제 관리 → 결제 수단 등록
- 신용카드 또는 체크카드
- 무료 크레딧: 월 30만원 (3개월)
```

---

## 2. Maps API 신청

### 2-1. Console 접속
```
https://console.ncloud.com/
→ Services → AI·NAVER API → Maps
```

### 2-2. Application 등록
```
1. Application 이름: CAMS 금형관리 시스템
2. Service 선택:
   ✅ Web Dynamic Map
   ✅ Geocoding
   
3. 서비스 환경 등록:
   - 개발: http://localhost:5173
   - 프로덕션: https://your-domain.up.railway.app
```

### 2-3. Client ID 발급
```
Application 등록 완료 후
→ Client ID 복사
→ 예: abc123def456ghi789
```

---

## 3. 프로젝트에 적용

### 3-1. Client ID 설정

#### 방법 1: index.html 직접 수정 (간단)
```html
<!-- client/index.html -->
<script type="text/javascript" src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=YOUR_CLIENT_ID"></script>
```

**YOUR_CLIENT_ID**를 실제 발급받은 Client ID로 교체

#### 방법 2: 환경 변수 사용 (권장)
```bash
# client/.env
VITE_NAVER_MAP_CLIENT_ID=your_actual_client_id
```

```html
<!-- client/index.html -->
<script type="text/javascript" src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=%VITE_NAVER_MAP_CLIENT_ID%"></script>
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
   - Name: VITE_NAVER_MAP_CLIENT_ID
   - Value: your_actual_client_id
6. Deploy
```

### 4-2. 서비스 URL 등록
```
네이버 클라우드 Console
→ Application 설정
→ 서비스 환경 추가
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
✅ Naver Map initialized
✅ 10 markers added to map
```

### 5-2. 프로덕션 테스트
```
https://your-app.up.railway.app/dashboard/admin
→ "GPS 지도 보기" 클릭
→ 네이버 지도 로딩 확인
```

---

## 6. 요금 안내

### 무료 크레딧
```
신규 가입: 월 30만원 × 3개월
Maps API: 월 30만 건까지 무료
```

### 사용량 계산
```
1일 사용자: 100명
1인당 지도 조회: 10회
월 사용량: 100 × 10 × 30 = 30,000건

→ 무료 범위 내 ✅
```

### 초과 시 요금
```
Web Dynamic Map: 1,000건당 3원
예상 비용: 거의 무료 수준
```

---

## 7. 트러블슈팅

### 문제 1: 지도가 로딩되지 않음
```
원인: Client ID 미설정 또는 잘못된 ID
해결: 
1. 브라우저 콘솔 확인
2. Client ID 재확인
3. 서비스 URL 등록 확인
```

### 문제 2: "Invalid Client ID" 에러
```
원인: 서비스 URL 미등록
해결:
1. 네이버 클라우드 Console
2. Application 설정
3. 서비스 환경에 현재 URL 추가
```

### 문제 3: CORS 에러
```
원인: 허용되지 않은 도메인
해결:
1. 네이버 클라우드 Console
2. Application 설정
3. Web Service URL에 도메인 추가
```

---

## 8. 고급 기능

### 8-1. 마커 클러스터링
```javascript
// 많은 마커를 그룹화
const markerClustering = new MarkerClustering({
  minClusterSize: 2,
  maxZoom: 13,
  map: map,
  markers: markers,
});
```

### 8-2. 경로 표시
```javascript
// 금형 이동 경로 표시
const polyline = new naver.maps.Polyline({
  path: [
    new naver.maps.LatLng(37.5665, 126.9780),
    new naver.maps.LatLng(35.5384, 129.3114),
  ],
  strokeColor: '#5347AA',
  strokeWeight: 3,
  map: map,
});
```

### 8-3. 지오코딩 (주소 → 좌표)
```javascript
// 주소로 좌표 찾기
naver.maps.Service.geocode({
  query: '서울특별시 강남구 테헤란로 152'
}, function(status, response) {
  if (status === naver.maps.Service.Status.OK) {
    const result = response.v2.addresses[0];
    const lat = result.y;
    const lng = result.x;
  }
});
```

---

## 9. 참고 자료

### 공식 문서
```
네이버 클라우드 Maps API
https://www.ncloud.com/product/applicationService/maps

API 가이드
https://api.ncloud-docs.com/docs/ai-naver-mapsgeocoding

예제 코드
https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html
```

### 샘플 코드
```
GitHub
https://github.com/navermaps/maps.js.ncp
```

---

## 10. 체크리스트

### 설정 완료 확인
- [ ] 네이버 클라우드 플랫폼 가입
- [ ] Maps API Application 등록
- [ ] Client ID 발급
- [ ] index.html에 Client ID 설정
- [ ] 로컬 테스트 성공
- [ ] Railway 환경 변수 설정
- [ ] 서비스 URL 등록
- [ ] 프로덕션 테스트 성공

---

## 🎉 완료!

네이버 지도 API가 성공적으로 연동되었습니다!

**다음 단계**:
1. Client ID 발급
2. index.html 수정
3. 재배포
4. 지도 확인

**예상 소요 시간**: 10-15분
