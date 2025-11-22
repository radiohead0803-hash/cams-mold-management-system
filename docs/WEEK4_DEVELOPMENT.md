# Week 4: 프론트엔드 및 UI/UX 완성

## 📋 목표
- React 프론트엔드 구축 (PC + 모바일 동시 개발)
- Apple Design System 적용
- PC 웹 대시보드 구현
- 모바일 QR 스캔 앱 구현
- 반응형 디자인 및 PWA
- 배포 준비

---

## 🎨 프론트엔드 설정

### 프로젝트 초기화
```bash
# Vite + React 프로젝트 생성
npm create vite@latest cams-frontend -- --template react
cd cams-frontend

# 필수 패키지 설치
npm install
npm install react-router-dom
npm install @tanstack/react-query
npm install axios
npm install lucide-react
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Tailwind CSS 설정 (Apple Design System)
```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0071e3',
          600: '#0077ed',
          700: '#005bb5',
        },
        neutral: {
          50: '#f5f5f7',
          100: '#e8e8ed',
          800: '#1d1d1f',
          900: '#000000',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        'apple': '0 4px 16px rgba(0, 0, 0, 0.12)',
      }
    },
  },
  plugins: [],
}
```

---

## 📱💻 개발 방식: PC 웹 + 모바일 동시 개발

### 개발 전략
```
┌─────────────────────────────────────────────────────────────┐
│  단일 React 프로젝트로 PC + 모바일 동시 개발                   │
│                                                               │
│  ■ 반응형 디자인 (Responsive Design)                          │
│  - Tailwind CSS 브레이크포인트 활용                            │
│  - 동일 컴포넌트, 다른 레이아웃                                │
│                                                               │
│  ■ 조건부 렌더링 (Conditional Rendering)                      │
│  - PC: 사이드바 + 넓은 테이블                                  │
│  - 모바일: 하단 네비게이션 + 카드형 UI                         │
│                                                               │
│  ■ 디바이스 감지                                              │
│  - useMediaQuery 훅 사용                                      │
│  - 화면 크기에 따라 자동 전환                                  │
└─────────────────────────────────────────────────────────────┘
```

### 폴더 구조
```
src/
├── components/
│   ├── pc/              # PC 전용 컴포넌트
│   │   ├── Sidebar.jsx
│   │   ├── DataTable.jsx
│   │   └── Dashboard.jsx
│   ├── mobile/          # 모바일 전용 컴포넌트
│   │   ├── BottomNav.jsx
│   │   ├── QRScanner.jsx
│   │   └── CardList.jsx
│   └── shared/          # 공통 컴포넌트
│       ├── Button.jsx
│       ├── Input.jsx
│       └── Modal.jsx
├── pages/
│   ├── Login.jsx        # 공통 로그인
│   ├── Dashboard.jsx    # PC 대시보드
│   ├── QRScan.jsx       # 모바일 QR 스캔
│   └── Inspection.jsx   # 공통 점검
└── hooks/
    ├── useMediaQuery.js # 디바이스 감지
    └── useQRScanner.js  # QR 스캔
```

### 디바이스 감지 훅
```javascript
// src/hooks/useMediaQuery.js
import { useState, useEffect } from 'react';

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
};

// 사용 예시
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsTablet = () => useMediaQuery('(max-width: 1024px)');
```

---

## 🖥️ PC 웹 화면 구현

### 1. PC 로그인 화면
```jsx
// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    // API 호출
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-apple p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-6">
          CAMS 금형관리 시스템
        </h1>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-neutral-100 mb-4"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-neutral-100 mb-6"
          />
          <button
            type="submit"
            className="w-full bg-primary-500 text-white py-3 rounded-2xl hover:bg-primary-600"
          >
            <LogIn className="inline mr-2" size={20} />
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
```

### 2. PC 대시보드 (관리자용)
```jsx
// src/pages/Dashboard.jsx
import { useQuery } from '@tanstack/react-query';
import { Package, AlertCircle, CheckCircle } from 'lucide-react';

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => fetch('/api/dashboard/stats').then(r => r.json())
  });

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <h1 className="text-3xl font-semibold mb-6">대시보드</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<Package />}
          title="전체 금형"
          value={stats?.totalMolds || 0}
          color="primary"
        />
        <StatCard
          icon={<CheckCircle />}
          title="양산 중"
          value={stats?.productionMolds || 0}
          color="green"
        />
        <StatCard
          icon={<AlertCircle />}
          title="수리 중"
          value={stats?.repairMolds || 0}
          color="red"
        />
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  return (
    <div className="bg-white rounded-3xl shadow-apple p-6">
      <div className={`text-${color}-500 mb-2`}>{icon}</div>
      <h3 className="text-neutral-600 text-sm">{title}</h3>
      <p className="text-3xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

export default Dashboard;
```

---

## 📱 모바일 화면 구현

### 1. 모바일 QR 스캔 화면
```jsx
// src/pages/QRScan.jsx
import { useState } from 'react';
import { QrCode, MapPin } from 'lucide-react';

function QRScan() {
  const [qrCode, setQrCode] = useState('');
  const [moldData, setMoldData] = useState(null);

  const handleScan = async () => {
    const response = await fetch(`/api/qr/scan`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        qr_code: qrCode,
        gps_latitude: 37.5665,
        gps_longitude: 126.9780
      })
    });
    
    const data = await response.json();
    setMoldData(data);
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <h1 className="text-3xl font-semibold mb-6">QR 스캔</h1>
      
      <div className="bg-white rounded-3xl shadow-apple p-6">
        <div className="flex items-center gap-4 mb-4">
          <QrCode size={32} className="text-primary-500" />
          <input
            type="text"
            placeholder="QR 코드 입력"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            className="flex-1 px-4 py-3 rounded-2xl border"
          />
          <button
            onClick={handleScan}
            className="bg-primary-500 text-white px-6 py-3 rounded-2xl"
          >
            스캔
          </button>
        </div>
        
        {moldData && (
          <div className="mt-6 p-4 bg-neutral-50 rounded-2xl">
            <h3 className="font-semibold mb-2">{moldData.mold_name}</h3>
            <p className="text-sm text-neutral-600">
              <MapPin size={16} className="inline mr-1" />
              {moldData.location_name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default QRScan;
```

### 2. 모바일 일상점검 화면
```jsx
// src/pages/mobile/DailyInspection.jsx
import { useState } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { Camera, MapPin, CheckCircle } from 'lucide-react';

function DailyInspection() {
  const isMobile = useIsMobile();
  const [checklist, setChecklist] = useState([
    { id: 1, item: '금형 외관 상태', checked: false },
    { id: 2, item: '기능부 작동', checked: false },
    { id: 3, item: '생산 품질', checked: false },
  ]);

  if (!isMobile) {
    return <div>PC에서는 대시보드를 이용하세요</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* 모바일 헤더 */}
      <div className="bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">일상점검</h1>
        <p className="text-sm text-neutral-600">금형: M2024-001</p>
      </div>

      {/* 체크리스트 */}
      <div className="p-4 space-y-3">
        {checklist.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center"
            onClick={() => {
              setChecklist(prev =>
                prev.map(i =>
                  i.id === item.id ? { ...i, checked: !i.checked } : i
                )
              );
            }}
          >
            <CheckCircle
              className={item.checked ? 'text-green-500' : 'text-neutral-300'}
              size={24}
            />
            <span className="ml-3 flex-1">{item.item}</span>
          </div>
        ))}
      </div>

      {/* 사진 촬영 버튼 */}
      <div className="fixed bottom-20 left-0 right-0 p-4">
        <button className="w-full bg-primary-500 text-white py-4 rounded-2xl flex items-center justify-center">
          <Camera className="mr-2" size={24} />
          사진 촬영
        </button>
      </div>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200">
      <div className="flex justify-around py-2">
        <button className="flex flex-col items-center p-2">
          <QrCode size={24} />
          <span className="text-xs mt-1">QR스캔</span>
        </button>
        <button className="flex flex-col items-center p-2">
          <CheckCircle size={24} />
          <span className="text-xs mt-1">점검</span>
        </button>
        <button className="flex flex-col items-center p-2">
          <MapPin size={24} />
          <span className="text-xs mt-1">위치</span>
        </button>
      </div>
    </div>
  );
}

export default DailyInspection;
```

### 3. 카메라 및 GPS 권한 처리
```javascript
// src/utils/permissions.js

// 카메라 권한 요청
export const requestCameraPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('카메라 권한 거부:', error);
    return false;
  }
};

// GPS 위치 권한 요청
export const requestLocationPermission = async () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS를 지원하지 않는 브라우저입니다.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
};

// 사용 예시
import { requestCameraPermission, requestLocationPermission } from './utils/permissions';

const handleQRScan = async () => {
  const cameraGranted = await requestCameraPermission();
  const location = await requestLocationPermission();
  
  if (cameraGranted && location) {
    // QR 스캔 진행
  }
};
```

---

## 📱 모바일 최적화

### 반응형 디자인
- Tailwind CSS 브레이크포인트 활용
- 모바일 우선 설계
- 터치 친화적 UI (최소 44x44px)

### PWA 설정
```javascript
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'CAMS 금형관리',
        short_name: 'CAMS',
        theme_color: '#0071e3',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ]
}
```

---

## 🚀 배포 준비

### Railway 배포
```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 초기화
railway init

# 배포
railway up
```

### 환경 변수 설정
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
NODE_ENV=production
```

---

## ✅ Week 4 체크리스트

### 프론트엔드 기본 설정
- [ ] React 프로젝트 설정
- [ ] Tailwind CSS 설정
- [ ] 디바이스 감지 훅 구현
- [ ] 폴더 구조 설정 (pc/mobile/shared)

### PC 웹 화면
- [ ] PC 로그인 화면
- [ ] PC 대시보드 (사이드바 + 테이블)
- [ ] 금형 정보 관리 화면
- [ ] 사용자 관리 화면
- [ ] 통계 및 리포트 화면
- [ ] GPS 위치 추적 맵

### 모바일 화면
- [ ] 모바일 QR 스캔 화면
- [ ] 모바일 일상점검 화면 (카드형 UI)
- [ ] 모바일 생산수량 입력
- [ ] 모바일 수리 요청 (사진 촬영)
- [ ] 하단 네비게이션 바
- [ ] 카메라 권한 처리
- [ ] GPS 위치 권한 처리

### UI/UX
- [ ] Apple Design System 적용
- [ ] 반응형 디자인 (PC ↔ 모바일 자동 전환)
- [ ] 터치 친화적 UI (최소 44x44px)
- [ ] 애니메이션 효과
- [ ] 로딩 상태 처리
- [ ] 에러 처리

### PWA 및 모바일 최적화
- [ ] PWA 설정 (manifest.json)
- [ ] 오프라인 지원
- [ ] 홈 화면 추가 기능
- [ ] 푸시 알림 설정

### 배포
- [ ] Railway 배포
- [ ] 환경 변수 설정
- [ ] HTTPS 설정
- [ ] 도메인 연결
- [ ] PC/모바일 접속 테스트

---

**프로젝트 완료!** 🎉
