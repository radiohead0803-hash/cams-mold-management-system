# 🔌 API 연결 가이드 - 프론트엔드 ↔ 백엔드 매핑

## 🎯 목표

**더미 데이터 → 실제 API 호출로 전환**

- 프론트: 각 대시보드/페이지의 MOCK 데이터를 실제 API 호출로 교체
- 백엔드: 이미 정의된 라우트 그룹에 설계 문서의 업무 흐름을 맞춰서 구현

---

## 📁 프로젝트 구조

```
cams-mold-management-system/
├── server/                    # Node/Express 백엔드
│   ├── src/
│   │   ├── routes/           # API 라우트 그룹
│   │   │   ├── auth.ts       # 인증/권한
│   │   │   ├── dashboard.ts  # 대시보드 KPI
│   │   │   ├── molds.ts      # 금형 관리
│   │   │   ├── inspections.ts # 점검
│   │   │   ├── repairs.ts    # 수리
│   │   │   ├── alerts.ts     # 알림
│   │   │   └── qr.ts         # QR 세션
│   │   ├── controllers/      # 비즈니스 로직
│   │   └── models/           # Sequelize 모델
│   └── migrations/           # DB 마이그레이션
│
├── client/                   # React 프론트엔드
│   ├── src/
│   │   ├── pages/           # 페이지 컴포넌트
│   │   │   ├── LoginPage.tsx
│   │   │   ├── dashboard/   # 역할별 대시보드
│   │   │   │   ├── SystemAdminDashboard.tsx
│   │   │   │   ├── MoldDeveloperDashboard.tsx
│   │   │   │   ├── MakerDashboard.tsx
│   │   │   │   └── PlantDashboard.tsx
│   │   │   ├── mobile/      # 모바일/QR 화면
│   │   │   └── ...
│   │   ├── hooks/           # Custom Hooks
│   │   │   ├── useDashboardKpi.ts
│   │   │   ├── useAuth.ts
│   │   │   └── ...
│   │   ├── components/      # 재사용 컴포넌트
│   │   └── lib/
│   │       └── api.ts       # Axios 인스턴스
│   └── ...
│
└── docs/                    # 설계 문서
    ├── DASHBOARD_GUIDE.md
    ├── QR_REPAIR_FLOW_COMPLETE.md
    ├── MASS_PRODUCTION_REPAIR_SYSTEM_DESIGN.md
    └── ...
```

---

## 🔐 1. 로그인 → 역할별 대시보드 매핑

### 프론트엔드: LoginPage.tsx

**현재 상태 (더미):**
```typescript
// client/src/pages/LoginPage.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log('Login attempt:', formData);
  
  // TODO: Replace with actual API call
  // Mock login success
  navigate('/dashboard/system-admin');
};
```

**변경 후 (실제 API):**
```typescript
// client/src/pages/LoginPage.tsx
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  
  try {
    const res = await axios.post('/api/auth/login', {
      email: formData.email,
      password: formData.password
    });
    
    const { accessToken, refreshToken, user } = res.data;
    
    // 토큰 저장
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    // 역할별 대시보드로 라우팅
    const dashboardRoutes: Record<string, string> = {
      system_admin: '/dashboard/system-admin',
      mold_developer: '/dashboard/mold-developer',
      maker: '/dashboard/maker',
      plant: '/dashboard/plant',
    };
    
    const targetRoute = dashboardRoutes[user.user_type] ?? '/dashboard/system-admin';
    navigate(targetRoute);
    
  } catch (err: any) {
    setError(err.response?.data?.message || '로그인에 실패했습니다.');
  } finally {
    setLoading(false);
  }
};
```

### 백엔드: auth.ts

```typescript
// server/src/routes/auth.ts
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../models';

const router = express.Router();

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 사용자 조회
    const user = await User.findOne({ 
      where: { email },
      include: [{ model: Company, as: 'company' }]
    });
    
    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    
    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    
    // JWT 생성
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        user_type: user.user_type,
        company_id: user.company_id
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: user.user_type,
        company: user.company
      }
    });
    
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 현재 사용자 정보 조회
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Company, as: 'company' }]
    });
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router;
```

---

## 📊 2. 시스템 관리자 대시보드 (본사)

### 2-1. KPI 카드

**프론트엔드: useDashboardKpi.ts**

**현재 상태 (더미):**
```typescript
// client/src/hooks/useDashboardKpi.ts
export function useDashboardKpi() {
  const [data, setData] = useState({
    moldSummary: { total: 245, inProduction: 198, underRepair: 12 },
    alertsSummary: { critical: 3, major: 12, minor: 45 },
    // ... mock data
  });
  
  return { data, loading: false, error: null, refetch: () => {} };
}
```

**변경 후 (실제 API):**
```typescript
// client/src/hooks/useDashboardKpi.ts
import { useEffect, useState } from 'react';
import api from '../lib/api';

interface DashboardKpi {
  moldSummary: {
    total: number;
    inProduction: number;
    underRepair: number;
    inTransit: number;
  };
  alertsSummary: {
    critical: number;
    major: number;
    minor: number;
  };
  gpsSummary: {
    registeredLocations: number;
    outOfArea: number;
  };
  systemStatus: {
    activeUsers: number;
    todayQrScans: number;
    dbStatus: string;
    gpsServiceStatus: string;
  };
  recentAlerts: Array<{
    id: number;
    type: string;
    severity: string;
    message: string;
    timestamp: string;
  }>;
}

export function useDashboardKpi() {
  const [data, setData] = useState<DashboardKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get<DashboardKpi>('/api/dashboard/system-admin/kpis');
      setData(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load KPIs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}
```

**프론트엔드: SystemAdminDashboard.tsx**

**변경 전:**
```typescript
const { data: stats, loading, error, refetch } = useDashboardKpi();

// Mock system status
const systemStatus = {
  dbStatus: 'healthy',
  gpsServiceStatus: 'warning'
};

// Mock recent activities
const recentActivities = [
  { id: 1, type: 'qr_scan', message: '...' }
];
```

**변경 후:**
```typescript
const { data: stats, loading, error, refetch } = useDashboardKpi();

// API에서 가져온 데이터 사용
const systemStatus = stats?.systemStatus ?? {
  dbStatus: 'unknown',
  gpsServiceStatus: 'unknown',
  activeUsers: 0,
  todayQrScans: 0
};

const recentActivities = stats?.recentAlerts ?? [];
```

### 백엔드: dashboard.ts

```typescript
// server/src/routes/dashboard.ts
import express from 'express';
import { Op } from 'sequelize';
import { Mold, QrScanAlert, User, QrSession } from '../models';

const router = express.Router();

// 시스템 관리자 대시보드 KPI
router.get('/system-admin/kpis', authenticateToken, async (req, res) => {
  try {
    // 1. 금형 현황 요약
    const moldSummary = {
      total: await Mold.count(),
      inProduction: await Mold.count({ where: { status: 'production' } }),
      underRepair: await Mold.count({ where: { status: 'under_repair' } }),
      inTransit: await Mold.count({ where: { status: 'in_transit' } })
    };
    
    // 2. 알람 요약 (최근 24시간)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const alertsSummary = {
      critical: await QrScanAlert.count({ 
        where: { 
          severity: 'critical',
          created_at: { [Op.gte]: yesterday }
        } 
      }),
      major: await QrScanAlert.count({ 
        where: { 
          severity: 'major',
          created_at: { [Op.gte]: yesterday }
        } 
      }),
      minor: await QrScanAlert.count({ 
        where: { 
          severity: 'minor',
          created_at: { [Op.gte]: yesterday }
        } 
      })
    };
    
    // 3. GPS 요약
    const gpsSummary = {
      registeredLocations: await Mold.count({ 
        where: { 
          latitude: { [Op.ne]: null },
          longitude: { [Op.ne]: null }
        } 
      }),
      outOfArea: await Mold.count({ where: { is_out_of_area: true } })
    };
    
    // 4. 시스템 상태
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const systemStatus = {
      activeUsers: await User.count({ where: { is_active: true } }),
      todayQrScans: await QrSession.count({ 
        where: { created_at: { [Op.gte]: today } } 
      }),
      dbStatus: 'healthy',
      gpsServiceStatus: 'healthy'
    };
    
    // 5. 최근 알람 (최근 20개)
    const recentAlerts = await QrScanAlert.findAll({
      limit: 20,
      order: [['created_at', 'DESC']],
      include: [
        { model: Mold, as: 'mold', attributes: ['code', 'name'] },
        { model: User, as: 'user', attributes: ['name'] }
      ]
    });
    
    res.json({
      moldSummary,
      alertsSummary,
      gpsSummary,
      systemStatus,
      recentAlerts: recentAlerts.map(alert => ({
        id: alert.id,
        type: alert.alert_type,
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.created_at,
        mold: alert.mold,
        user: alert.user
      }))
    });
    
  } catch (error) {
    console.error('대시보드 KPI 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router;
```

### 2-2. GPS 위치 맵

**프론트엔드: MoldLocationMap.tsx**

**변경 전:**
```typescript
// Mock data
const molds = [
  { id: 1, code: 'M2024-001', lat: 35.1234, lng: 129.1234, status: 'production' }
];
```

**변경 후:**
```typescript
// client/src/components/MoldLocationMap.tsx
import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function MoldLocationMap({ statusFilter }: { statusFilter?: string }) {
  const [molds, setMolds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const params = statusFilter ? { status: statusFilter } : {};
        const res = await api.get('/api/molds/locations', { params });
        setMolds(res.data);
      } catch (error) {
        console.error('위치 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [statusFilter]);

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="map-container">
      {/* 지도 렌더링 */}
      {molds.map(mold => (
        <Marker key={mold.id} position={[mold.lat, mold.lng]} />
      ))}
    </div>
  );
}
```

**백엔드: molds.ts**

```typescript
// server/src/routes/molds.ts

// 금형 위치 조회
router.get('/locations', authenticateToken, async (req, res) => {
  try {
    const { status, plantId } = req.query;
    
    const whereClause: any = {
      latitude: { [Op.ne]: null },
      longitude: { [Op.ne]: null }
    };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (plantId) {
      whereClause.current_location_id = plantId;
    }
    
    const molds = await Mold.findAll({
      where: whereClause,
      include: [
        { model: Location, as: 'currentLocation', attributes: ['name', 'type'] }
      ],
      attributes: [
        'id', 'code', 'name', 'status', 
        'latitude', 'longitude', 'is_out_of_area'
      ]
    });
    
    res.json(molds.map(mold => ({
      moldId: mold.id,
      moldCode: mold.code,
      name: mold.name,
      status: mold.status,
      latitude: mold.latitude,
      longitude: mold.longitude,
      locationType: mold.currentLocation?.type,
      locationName: mold.currentLocation?.name,
      isOutOfArea: mold.is_out_of_area
    })));
    
  } catch (error) {
    console.error('위치 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});
```

---

## 📋 3. 역할별 대시보드 API 매핑표

### 3-1. 시스템 관리자 (본사) 대시보드

| 화면 블록 | 프론트엔드 | 백엔드 API | 주요 테이블 |
|---------|----------|-----------|-----------|
| 금형 현황 요약 | `useDashboardKpi()` | `GET /api/dashboard/system-admin/kpis` | `molds`, `mold_status_history` |
| 실시간 알람 피드 | `useAlerts()` | `GET /api/alerts/recent` | `qr_scan_alerts`, `inspections`, `repairs` |
| GPS 위치 맵 | `MoldLocationMap` | `GET /api/molds/locations` | `molds`, `locations`, `qr_sessions` |
| 시스템 상태 | `useDashboardKpi()` | `GET /api/dashboard/system-admin/system-status` | `users`, `qr_sessions` |
| 점검표 마스터 | `ChecklistTemplates` | `GET/POST /api/checklist-templates` | `checklist_master_templates` |
| 권한/사용자 관리 | `UserManagement` | `GET/POST /api/users` | `users`, `roles`, `user_roles` |

### 3-2. 금형개발 담당 대시보드

| 기능 | 프론트엔드 | 백엔드 API | 비고 |
|-----|----------|-----------|------|
| 단계별 금형 현황 | `useMoldSummary()` | `GET /api/molds/summary?owner=developer` | 상태코드 매핑 |
| 승인 대기 목록 | `usePendingApprovals()` | `GET /api/molds/pending-approvals` | 필터: type=design/tryout/liability |
| 금형 등록/수정 | `MoldForm` | `POST /api/molds`, `PUT /api/molds/:id` | QR 코드 자동 생성 |
| 제작처 진행률 | `MakerProgress` | `GET /api/molds/:id/progress` | `mold_progress`, `manufacturers` |

### 3-3. 제작처(Maker) 대시보드

| 기능 | 프론트엔드 | 백엔드 API | 비고 |
|-----|----------|-----------|------|
| 제작/수리 작업 현황 | `useMakerJobs()` | `GET /api/maker/jobs?status=in_progress` | 제작 + 수리 조합 |
| QR 코드 생성/부착 | `QrCodeManagement` | `POST /api/molds/:id/qrcode` | 부착 확인 체크리스트 |
| 시운전 결과 입력 | `TryoutForm` | `POST /api/tryout-results` | PASS/FAIL + 사진 |
| 수리 작업 관리 | `RepairList` | `GET /api/repairs?assignedTo=maker` | 귀책 협의 포함 |

### 3-4. 생산처(Plant) 대시보드

| 기능 | 프론트엔드 | 백엔드 API | 비고 |
|-----|----------|-----------|------|
| 금형 현황/점검 일정 | `usePlantKpi()` | `GET /api/dashboard/plant/kpis` | 일상/정기 점검 스케줄 |
| QR 스캔 후 작업 선택 | `QrScanPage` | `POST /api/qr-sessions/start` | QR 세션 생성 |
| 일상점검 + 생산수량 | `DailyCheckForm` | `POST /api/inspections/daily` | 타수 업데이트 |
| 정기점검 | `PeriodicCheckForm` | `POST /api/inspections/periodic` | 주기별 템플릿 로드 |
| 수리 요청 생성 | `RepairRequestForm` | `POST /api/repairs` | NG 유형·긴급도·사진 |
| 이관 요청 | `TransferForm` | `POST /api/transfers` | GPS·4M 체크리스트 |

---

## 🔧 4. QR 스캔 → 작업 선택 흐름

### 프론트엔드: QrScanPage.tsx

```typescript
// client/src/pages/mobile/QrScanPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function QrScanPage() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);

  const handleScan = async (qrCode: string) => {
    try {
      setScanning(true);
      
      // 1. QR 세션 시작
      const res = await api.post('/api/qr-sessions/start', {
        qr_code: qrCode
      });
      
      const { session, mold, availableActions } = res.data;
      
      // 2. 작업 선택 화면으로 이동 (금형 정보 + 가능한 작업 목록 전달)
      navigate('/mobile/mold-actions', {
        state: {
          sessionId: session.id,
          mold,
          availableActions
        }
      });
      
    } catch (error: any) {
      alert(error.response?.data?.message || 'QR 스캔 오류');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="qr-scan-page">
      <QrScanner onScan={handleScan} />
      {scanning && <div>처리 중...</div>}
    </div>
  );
}
```

### 백엔드: qr.ts

```typescript
// server/src/routes/qr.ts
import express from 'express';
import { QrSession, Mold, User } from '../models';

const router = express.Router();

// QR 세션 시작
router.post('/sessions/start', authenticateToken, async (req, res) => {
  try {
    const { qr_code } = req.body;
    const userId = req.user.id;
    
    // 1. QR 코드로 금형 조회
    const mold = await Mold.findOne({ 
      where: { qr_code },
      include: [
        { model: Location, as: 'currentLocation' },
        { model: Company, as: 'manufacturer' }
      ]
    });
    
    if (!mold) {
      return res.status(404).json({ message: '금형을 찾을 수 없습니다.' });
    }
    
    // 2. QR 세션 생성
    const session = await QrSession.create({
      user_id: userId,
      mold_id: mold.id,
      qr_code,
      scan_location_lat: req.body.latitude,
      scan_location_lng: req.body.longitude,
      status: 'active'
    });
    
    // 3. 사용자 역할 및 금형 상태에 따라 가능한 작업 결정
    const user = await User.findByPk(userId);
    const availableActions = determineAvailableActions(user.user_type, mold.status);
    
    res.json({
      session: {
        id: session.id,
        created_at: session.created_at
      },
      mold: {
        id: mold.id,
        code: mold.code,
        name: mold.name,
        status: mold.status,
        current_shot: mold.current_shot,
        location: mold.currentLocation,
        manufacturer: mold.manufacturer
      },
      availableActions
    });
    
  } catch (error) {
    console.error('QR 세션 시작 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 가능한 작업 결정 로직
function determineAvailableActions(userType: string, moldStatus: string): string[] {
  const actions: string[] = [];
  
  if (userType === 'plant') {
    actions.push('daily_check', 'production_quantity', 'repair_request');
    
    if (moldStatus === 'production') {
      actions.push('periodic_check', 'transfer_request');
    }
  }
  
  if (userType === 'maker') {
    actions.push('tryout', 'repair_work', 'qr_attach_confirm');
  }
  
  return actions;
}

export default router;
```

---

## 📝 5. 일상점검 입력

### 프론트엔드: DailyCheckForm.tsx

```typescript
// client/src/pages/mobile/DailyCheckForm.tsx
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function DailyCheckForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, mold } = location.state;
  
  const [formData, setFormData] = useState({
    production_quantity: '',
    ng_quantity: '',
    checklist_items: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.post('/api/inspections/daily', {
        session_id: sessionId,
        mold_id: mold.id,
        ...formData
      });
      
      alert('일상점검이 완료되었습니다.');
      navigate('/mobile/dashboard');
      
    } catch (error: any) {
      alert(error.response?.data?.message || '점검 제출 오류');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>일상점검 - {mold.code}</h2>
      
      <div>
        <label>생산수량 (Shot)</label>
        <input
          type="number"
          value={formData.production_quantity}
          onChange={(e) => setFormData({ ...formData, production_quantity: e.target.value })}
          required
        />
      </div>
      
      <div>
        <label>NG 수량</label>
        <input
          type="number"
          value={formData.ng_quantity}
          onChange={(e) => setFormData({ ...formData, ng_quantity: e.target.value })}
        />
      </div>
      
      {/* 체크리스트 항목 */}
      <ChecklistItems 
        items={formData.checklist_items}
        onChange={(items) => setFormData({ ...formData, checklist_items: items })}
      />
      
      <button type="submit">제출</button>
    </form>
  );
}
```

### 백엔드: inspections.ts

```typescript
// server/src/routes/inspections.ts
import express from 'express';
import { DailyCheck, Mold, QrSession } from '../models';

const router = express.Router();

// 일상점검 제출
router.post('/daily', authenticateToken, async (req, res) => {
  try {
    const { session_id, mold_id, production_quantity, ng_quantity, checklist_items } = req.body;
    const userId = req.user.id;
    
    // 1. 일상점검 기록 생성
    const dailyCheck = await DailyCheck.create({
      mold_id,
      user_id: userId,
      session_id,
      production_quantity: parseInt(production_quantity),
      ng_quantity: parseInt(ng_quantity),
      status: 'completed'
    });
    
    // 2. 체크리스트 항목 저장
    for (const item of checklist_items) {
      await ChecklistAnswer.create({
        daily_check_id: dailyCheck.id,
        question_id: item.question_id,
        answer: item.answer,
        is_ng: item.is_ng
      });
    }
    
    // 3. 금형 타수 업데이트
    const mold = await Mold.findByPk(mold_id);
    await mold.update({
      current_shot: mold.current_shot + parseInt(production_quantity),
      last_daily_check_shot: mold.current_shot + parseInt(production_quantity),
      last_daily_check_date: new Date()
    });
    
    // 4. 다음 점검일 계산
    const nextCheckShot = mold.current_shot + mold.daily_check_interval;
    
    // 5. QR 세션 종료
    await QrSession.update(
      { status: 'completed', completed_at: new Date() },
      { where: { id: session_id } }
    );
    
    res.json({
      dailyCheck,
      mold: {
        current_shot: mold.current_shot,
        next_check_shot: nextCheckShot
      }
    });
    
  } catch (error) {
    console.error('일상점검 제출 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router;
```

---

## 🔧 6. 수리요청 생성

### 프론트엔드: RepairRequestForm.tsx

```typescript
// client/src/pages/mobile/RepairRequestForm.tsx
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function RepairRequestForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mold } = location.state;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ng_type: '',
    urgency: 'normal',
    photos: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('mold_id', mold.id);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('ng_type', formData.ng_type);
      formDataToSend.append('urgency', formData.urgency);
      
      formData.photos.forEach((photo, index) => {
        formDataToSend.append(`photos`, photo);
      });
      
      await api.post('/api/repairs', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('수리요청이 접수되었습니다.');
      navigate('/mobile/dashboard');
      
    } catch (error: any) {
      alert(error.response?.data?.message || '수리요청 제출 오류');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>수리요청 - {mold.code}</h2>
      
      <div>
        <label>제목</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      
      <div>
        <label>NG 유형</label>
        <select
          value={formData.ng_type}
          onChange={(e) => setFormData({ ...formData, ng_type: e.target.value })}
          required
        >
          <option value="">선택</option>
          <option value="gas_vent">가스배기 불량</option>
          <option value="cooling">냉각 불량</option>
          <option value="slide_wear">슬라이드 마모</option>
          <option value="gate">게이트 불량</option>
        </select>
      </div>
      
      <div>
        <label>긴급도</label>
        <select
          value={formData.urgency}
          onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
        >
          <option value="low">낮음</option>
          <option value="normal">보통</option>
          <option value="high">높음</option>
          <option value="urgent">긴급</option>
        </select>
      </div>
      
      <div>
        <label>상세 설명</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
        />
      </div>
      
      <div>
        <label>사진 첨부</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFormData({ ...formData, photos: Array.from(e.target.files || []) })}
        />
      </div>
      
      <button type="submit">수리요청 제출</button>
    </form>
  );
}
```

### 백엔드: repairs.ts

```typescript
// server/src/routes/repairs.ts
import express from 'express';
import multer from 'multer';
import { RepairRequest, Mold, User } from '../models';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// 수리요청 생성
router.post('/', authenticateToken, upload.array('photos', 5), async (req, res) => {
  try {
    const { mold_id, title, description, ng_type, urgency } = req.body;
    const userId = req.user.id;
    const files = req.files as Express.Multer.File[];
    
    // 1. 수리요청 생성
    const repairRequest = await RepairRequest.create({
      mold_id,
      requester_id: userId,
      title,
      description,
      ng_type,
      urgency,
      status: 'requested',
      requested_at: new Date()
    });
    
    // 2. 사진 첨부 파일 저장
    if (files && files.length > 0) {
      for (const file of files) {
        await RepairRequestFile.create({
          repair_request_id: repairRequest.id,
          file_path: file.path,
          file_name: file.originalname,
          file_type: 'photo'
        });
      }
    }
    
    // 3. 금형 상태 업데이트
    await Mold.update(
      { status: 'repair_requested' },
      { where: { id: mold_id } }
    );
    
    // 4. 알림 생성 (본사에게)
    await createNotification({
      type: 'repair_request',
      target_user_type: 'mold_developer',
      message: `새로운 수리요청: ${title}`,
      related_id: repairRequest.id
    });
    
    res.json({ repairRequest });
    
  } catch (error) {
    console.error('수리요청 생성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router;
```

---

## 🚀 7. 구현 우선순위

### Phase 1: 인증 및 기본 대시보드 (1주)
- [x] 로그인 API 연결
- [x] 역할별 라우팅
- [ ] 시스템 관리자 대시보드 KPI API
- [ ] GPS 위치 맵 API

### Phase 2: QR 스캔 및 점검 (2주)
- [ ] QR 세션 시작 API
- [ ] 일상점검 제출 API
- [ ] 정기점검 제출 API
- [ ] 생산수량 업데이트 로직

### Phase 3: 수리요청 시스템 (2주)
- [ ] 수리요청 생성 API
- [ ] 수리요청 승인/반려 API
- [ ] 수리 진행 상태 업데이트 API
- [ ] 귀책 협의 API

### Phase 4: 알림 및 실시간 업데이트 (1주)
- [ ] 실시간 알림 API
- [ ] WebSocket 연결
- [ ] 푸시 알림

### Phase 5: 통계 및 리포트 (1주)
- [ ] 대시보드 통계 API
- [ ] NG TOP 분석 API
- [ ] 귀책 통계 API

---

**이제 프론트엔드와 백엔드를 연결하는 완전한 가이드가 완성되었습니다!** 🎉

**각 페이지/컴포넌트에서 어떤 API를 호출해야 하는지 명확하게 정의되었습니다!** 🔌✨
