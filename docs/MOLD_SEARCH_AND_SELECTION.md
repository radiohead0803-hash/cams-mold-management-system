# 금형 검색 및 선택 기능 가이드

## 📋 개요

네이버 지도에 금형 검색, 선택, 상태별 마커 강조 기능이 추가되었습니다.

---

## ✅ 구현된 기능

### 1️⃣ 금형 검색
- 검색창에서 금형 코드, 금형명, 공장명으로 검색
- 실시간 필터링
- 검색 결과에 따라 지도 마커 및 통계 업데이트

### 2️⃣ 금형 선택
- 리스트에서 금형 클릭 시 선택
- 선택된 금형 하이라이트 표시
- 지도에서 해당 금형으로 자동 이동 및 줌
- 정보창 자동 표시

### 3️⃣ 상태별 마커 색상
- **정상 (normal)**: 🟢 초록색
- **위치 이탈 (moved)**: 🟠 주황색  
- **NG**: 🔴 빨간색

### 4️⃣ 마커 크기 변화
- 일반 마커: 18px
- 선택된 마커: 24px (강조)

---

## 🔧 구현 상세

### NaverMoldLocationMap 컴포넌트

**파일**: `client/src/components/NaverMoldLocationMap.jsx`

#### Props
```javascript
{
  locations: Array,        // 금형 위치 데이터 배열
  selectedMoldId: number   // 선택된 금형 ID (null 가능)
}
```

#### 주요 기능

**1. 상태별 마커 아이콘 생성**
```javascript
const getMarkerIcon = (status, selected) => {
  const color =
    status === 'ng' ? '#ef4444' :
    status === 'moved' ? '#f97316' :
    '#22c55e';
  
  const size = selected ? 24 : 18;
  
  // SVG 마커 생성
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encoded}`,
    size: new window.naver.maps.Size(size, size),
    anchor: new window.naver.maps.Point(size / 2, size / 2)
  };
};
```

**2. 선택된 금형으로 지도 이동**
```javascript
useEffect(() => {
  if (!selectedMoldId) return;
  
  const marker = markersRef.current[selectedMoldId];
  const infoWindow = infoWindowsRef.current[selectedMoldId];
  
  if (marker) {
    map.setCenter(marker.getPosition());
    map.setZoom(13);
    infoWindow.open(map, marker);
  }
}, [selectedMoldId]);
```

---

### SystemAdminDashboard 업데이트

**파일**: `client/src/pages/dashboards/SystemAdminDashboard.jsx`

#### 추가된 State
```javascript
const [selectedMoldId, setSelectedMoldId] = useState(null);
const [searchTerm, setSearchTerm] = useState('');
```

#### 검색 필터링
```javascript
const filteredLocations = locations.filter((loc) => {
  if (!searchTerm) return true;
  const keyword = searchTerm.toLowerCase();
  return (
    loc.moldCode.toLowerCase().includes(keyword) ||
    (loc.moldName || '').toLowerCase().includes(keyword) ||
    loc.plantName.toLowerCase().includes(keyword)
  );
});
```

#### 통계 계산
```javascript
const total = filteredLocations.length;
const moved = filteredLocations.filter((l) => l.hasDrift || l.status === 'moved').length;
const ng = filteredLocations.filter((l) => l.status === 'ng').length;
const normal = total - moved - ng;
```

#### 지도 컴포넌트에 Props 전달
```javascript
<NaverMoldLocationMap 
  locations={filteredLocations} 
  selectedMoldId={selectedMoldId}
/>
```

---

## 🎨 UI 구성

### 검색 입력창
```jsx
<input
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="금형코드 / 금형명 / 공장명 검색"
  className="w-full h-8 px-3 text-[11px] rounded-lg border"
/>
```

### 금형 리스트 아이템
```jsx
<button
  onClick={() => setSelectedMoldId(prev => prev === loc.id ? null : loc.id)}
  className={isSelected ? "bg-slate-900 text-white" : "hover:bg-slate-50"}
>
  <div>
    <div>{loc.moldCode}</div>
    <div>{loc.moldName} · {loc.plantName}</div>
  </div>
  <span className={statusBadgeClass}>
    {loc.status === 'ng' ? 'NG' : loc.status === 'moved' ? '이탈' : '정상'}
  </span>
</button>
```

---

## 🚀 사용 방법

### 1. 금형 검색
1. 검색창에 키워드 입력 (예: "M2024", "A공장", "금형1")
2. 실시간으로 리스트 및 지도 필터링
3. 통계 카드 자동 업데이트

### 2. 금형 선택
1. 리스트에서 금형 클릭
2. 리스트 항목 하이라이트 (검은색 배경)
3. 지도가 해당 금형으로 이동 및 줌
4. 마커 크기 증가 (18px → 24px)
5. 정보창 자동 표시

### 3. 선택 해제
- 선택된 금형을 다시 클릭하면 선택 해제

---

## 📊 상태별 마커 색상

| 상태 | 색상 | Hex Code | 설명 |
|------|------|----------|------|
| **정상** | 🟢 초록 | `#22c55e` | 기준 위치 내 (300m 이내) |
| **이탈** | 🟠 주황 | `#f97316` | 기준 위치 이탈 (300m 초과) |
| **NG** | 🔴 빨강 | `#ef4444` | NG 발생 |

---

## 🧪 테스트 시나리오

### 시나리오 1: 검색 기능
```
1. 검색창에 "M2024" 입력
2. 결과: M2024로 시작하는 금형만 표시
3. 통계: 필터된 금형 개수 표시
4. 지도: 필터된 마커만 표시
```

### 시나리오 2: 금형 선택
```
1. 리스트에서 "M2024-001" 클릭
2. 결과:
   - 리스트 항목 검은색 배경
   - 지도 중심 이동
   - 마커 크기 증가
   - 정보창 표시
```

### 시나리오 3: 상태별 필터링
```
1. 검색창 비움
2. 결과: 전체 금형 표시
3. 통계:
   - 정상: 초록 마커 개수
   - 이탈: 주황 마커 개수
   - NG: 빨강 마커 개수
```

---

## 🔍 문제 해결

### 문제 1: 마커가 표시되지 않음

**원인**: 위치 데이터 없음

**해결**:
```javascript
// locations 배열 확인
console.log(locations);

// 각 location에 lat, lng 있는지 확인
locations.forEach(loc => {
  console.log(loc.id, loc.lat, loc.lng);
});
```

### 문제 2: 선택 시 지도 이동 안 됨

**원인**: selectedMoldId가 전달되지 않음

**해결**:
```javascript
// Props 확인
<NaverMoldLocationMap 
  locations={filteredLocations} 
  selectedMoldId={selectedMoldId}  // ← 확인
/>
```

### 문제 3: 검색 결과 없음

**원인**: 대소문자 불일치

**해결**:
```javascript
// toLowerCase() 사용 확인
loc.moldCode.toLowerCase().includes(keyword.toLowerCase())
```

---

## 📝 코드 예시

### 완전한 검색 및 선택 로직
```javascript
// State
const [selectedMoldId, setSelectedMoldId] = useState(null);
const [searchTerm, setSearchTerm] = useState('');

// 필터링
const filteredLocations = locations.filter((loc) => {
  if (!searchTerm) return true;
  const keyword = searchTerm.toLowerCase();
  return (
    loc.moldCode.toLowerCase().includes(keyword) ||
    (loc.moldName || '').toLowerCase().includes(keyword) ||
    loc.plantName.toLowerCase().includes(keyword)
  );
});

// 통계
const total = filteredLocations.length;
const moved = filteredLocations.filter((l) => l.hasDrift).length;
const normal = total - moved;

// 렌더링
<input
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="검색..."
/>

{filteredLocations.map((loc) => (
  <button
    key={loc.id}
    onClick={() => setSelectedMoldId(loc.id)}
    className={loc.id === selectedMoldId ? 'selected' : ''}
  >
    {loc.moldCode}
  </button>
))}

<NaverMoldLocationMap 
  locations={filteredLocations} 
  selectedMoldId={selectedMoldId}
/>
```

---

## ✅ 완료 체크리스트

- [x] NaverMoldLocationMap에 selectedMoldId prop 추가
- [x] 상태별 마커 아이콘 생성 함수 구현
- [x] 선택된 금형으로 지도 이동 기능
- [x] SystemAdminDashboard에 검색 state 추가
- [x] 검색 필터링 로직 구현
- [x] 통계 계산 로직 업데이트
- [x] 금형 리스트 UI 업데이트
- [x] 선택 시 하이라이트 표시
- [x] 지도에 filteredLocations 전달

---

## 🎯 다음 단계

### 1. 고급 필터링
- 상태별 필터 (정상/이탈/NG)
- 공장별 필터
- 날짜 범위 필터

### 2. 정렬 기능
- 코드순
- 이름순
- 상태순
- 거리순

### 3. 일괄 작업
- 여러 금형 선택
- 일괄 상태 변경
- 일괄 알림 전송

---

**작성일**: 2024-12-02  
**버전**: 1.0.0  
**작성자**: CAMS Development Team
