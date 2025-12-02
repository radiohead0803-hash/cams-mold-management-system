# API Implementation Summary

## 📊 구현 완료 현황

**전체 진행률: 100%** (3개 Phase 완료)

- ✅ Phase 1: 인증 및 기본 대시보드 (100%)
- ✅ Phase 2: QR 스캔 및 점검 시스템 (100%)
- ✅ Phase 3: 수리요청 시스템 (100%)

**총 구현 API: 18개**

---

## 🔐 Phase 1: 인증 및 기본 대시보드

### 1-1. 인증 API

#### POST /api/v1/auth/login
로그인 및 JWT 토큰 발급

**Request:**
```json
{
  "username": "plant_user",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "plant_user",
      "name": "생산담당자",
      "email": "plant@example.com",
      "user_type": "plant",
      "company_id": 3,
      "company_name": "현대자동차 울산공장"
    }
  }
}
```

#### GET /api/v1/auth/me
현재 로그인한 사용자 정보 조회

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "plant_user",
    "name": "생산담당자",
    "user_type": "plant",
    "company_id": 3
  }
}
```

---

### 1-2. 대시보드 KPI API

#### GET /api/v1/dashboard/system-admin/kpis
시스템 관리자 대시보드 KPI

**Response:**
```json
{
  "success": true,
  "data": {
    "moldSummary": {
      "total": 150,
      "inProduction": 120,
      "underRepair": 15,
      "inTransit": 5
    },
    "alertsSummary": {
      "critical": 3,
      "major": 8,
      "minor": 12
    },
    "gpsSummary": {
      "registeredLocations": 145,
      "outOfArea": 2
    },
    "systemStatus": {
      "activeUsers": 45,
      "todayQrScans": 230,
      "dbStatus": "healthy",
      "gpsServiceStatus": "active"
    },
    "recentAlerts": [...]
  }
}
```

#### GET /api/v1/dashboard/plant/kpis
생산처 대시보드 KPI

**Response:**
```json
{
  "success": true,
  "data": {
    "todayCheckCount": 25,
    "openRepairCount": 3,
    "recentNgMoldCount": 2,
    "activeMoldCount": 45,
    "todayChecks": [...],
    "repairs": [...],
    "recentNg": [...],
    "locations": [...]
  }
}
```

#### GET /api/v1/dashboard/maker/kpis
제작처 대시보드 KPI

**Response:**
```json
{
  "success": true,
  "data": {
    "devMoldCount": 12,
    "pendingDevPlanCount": 5,
    "pendingHardnessTryoutCount": 3,
    "makerBlamePercentage": 15.5,
    "devMolds": [...],
    "assignedRepairs": [...],
    "blameStats": {
      "totalBlameCount": 8,
      "blamePercentage": 15.5
    }
  }
}
```

#### GET /api/v1/dashboard/developer/kpis
금형개발 담당 대시보드 KPI

**Response:**
```json
{
  "success": true,
  "data": {
    "moldSummary": {
      "design": 5,
      "manufacturing": 8,
      "trial": 3,
      "production": 120,
      "retired": 10
    },
    "pendingApprovals": {
      "design": 2,
      "tryout": 1,
      "liability": 3
    },
    "recentMolds": [...]
  }
}
```

---

### 1-3. GPS 위치 API

#### GET /api/v1/molds/locations
전체 금형 위치 조회

**Query Parameters:**
- `status`: 금형 상태 필터 (optional)
- `plantId`: 공장 ID 필터 (optional)
- `companyId`: 회사 ID 필터 (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "moldId": 1,
      "moldCode": "M-2024-001",
      "moldName": "도어 패널 금형",
      "status": "production",
      "latitude": 35.5384,
      "longitude": 129.3114,
      "isOutOfArea": false,
      "locationName": "현대자동차 울산공장",
      "locationCompanyId": 3,
      "updatedAt": "2025-12-02T14:30:00Z"
    }
  ]
}
```

#### GET /api/v1/molds/:id/location
특정 금형 위치 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "moldId": 1,
    "moldCode": "M-2024-001",
    "moldName": "도어 패널 금형",
    "latitude": 35.5384,
    "longitude": 129.3114,
    "isOutOfArea": false,
    "locationName": "현대자동차 울산공장",
    "locationCompanyId": 3,
    "updatedAt": "2025-12-02T14:30:00Z"
  }
}
```

#### POST /api/v1/molds/:id/location
금형 위치 업데이트

**Request:**
```json
{
  "latitude": 35.5384,
  "longitude": 129.3114,
  "location_name": "현대자동차 울산공장",
  "company_id": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "moldId": 1,
    "moldCode": "M-2024-001",
    "latitude": 35.5384,
    "longitude": 129.3114,
    "locationName": "현대자동차 울산공장",
    "updatedAt": "2025-12-02T14:30:00Z"
  }
}
```

---

## 📱 Phase 2: QR 스캔 및 점검 시스템

### 2-1. QR 세션 시작 API

#### POST /api/v1/qr/scan
QR 코드 스캔 및 세션 생성

**Request:**
```json
{
  "qr_code": "MOLD-M-2024-001-QR123",
  "location": {
    "latitude": 35.5384,
    "longitude": 129.3114
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "token": "uuid-session-token",
      "expires_at": "2025-12-02T22:30:00Z",
      "created_at": "2025-12-02T14:30:00Z"
    },
    "mold": {
      "id": 1,
      "mold_code": "M-2024-001",
      "mold_name": "도어 패널 금형",
      "car_model": "SONATA",
      "part_name": "도어 패널",
      "cavity": 2,
      "current_shots": 10000,
      "target_shots": 1000000,
      "status": "production",
      "location": "현대자동차 울산공장"
    },
    "user": {
      "id": 1,
      "name": "생산담당자",
      "user_type": "plant",
      "company_name": "현대자동차 울산공장"
    },
    "availableActions": [
      {
        "id": "daily_check",
        "label": "일상점검",
        "description": "금형 일상점검 수행",
        "icon": "clipboard-check",
        "route": "/mobile/molds/1/check/daily"
      },
      {
        "id": "production_quantity",
        "label": "생산수량 입력",
        "description": "생산 Shot 수 기록",
        "icon": "hash",
        "route": "/mobile/molds/1/production"
      }
    ],
    "permissions": {...},
    "gps_alert_id": null
  }
}
```

---

### 2-2. 일상점검 제출 API

#### POST /api/v1/inspections/daily
일상점검 제출

**Request:**
```json
{
  "session_id": "uuid-session-token",
  "mold_id": 1,
  "production_quantity": 500,
  "ng_quantity": 2,
  "checklist_items": [
    {
      "question_id": 1,
      "answer": "정상",
      "answer_type": "text",
      "is_ng": false
    },
    {
      "question_id": 2,
      "answer": "불량",
      "answer_type": "text",
      "is_ng": true,
      "ng_reason": "가스배기 불량",
      "photo_url": "/uploads/ng_photo_123.jpg"
    }
  ],
  "notes": "가스배기 부분 확인 필요"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dailyCheck": {
      "id": 123,
      "mold_id": 1,
      "production_quantity": 500,
      "ng_quantity": 2,
      "has_ng": true,
      "checked_at": "2025-12-02T14:35:00Z"
    },
    "mold": {
      "current_shot": 10500,
      "next_daily_check_shot": 11000,
      "next_periodic_check_shot": 20000
    },
    "ng_items": [
      {
        "question_id": 2,
        "answer_id": 456,
        "ng_reason": "가스배기 불량"
      }
    ]
  }
}
```

---

### 2-3. 정기점검 제출 API

#### POST /api/v1/inspections/periodic
정기점검 제출

**Request:**
```json
{
  "session_id": "uuid-session-token",
  "mold_id": 1,
  "inspection_type": "100K",
  "checklist_items": [
    {
      "question_id": 10,
      "answer": "45.2",
      "answer_type": "number",
      "measured_value": 45.2,
      "spec_min": 45.0,
      "spec_max": 46.0,
      "is_ng": false
    },
    {
      "question_id": 11,
      "answer": "불량",
      "answer_type": "text",
      "is_ng": true,
      "is_critical": true,
      "ng_reason": "코어 핀 파손",
      "photo_url": "/uploads/critical_ng_789.jpg"
    }
  ],
  "inspector_name": "점검담당자",
  "inspection_duration": 120,
  "notes": "코어 핀 교체 필요"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "periodicInspection": {
      "id": 789,
      "mold_id": 1,
      "inspection_type": "100K",
      "has_ng": true,
      "has_critical_ng": true,
      "inspected_at": "2025-12-02T15:00:00Z",
      "inspector_name": "점검담당자",
      "inspection_duration": 120
    },
    "mold": {
      "current_shot": 100000,
      "status": "inspection_ng",
      "needs_repair": true,
      "next_periodic_check_shot": 200000
    },
    "ng_items": [
      {
        "question_id": 11,
        "answer_id": 890,
        "ng_reason": "코어 핀 파손",
        "is_critical": true
      }
    ],
    "critical_items": [
      {
        "question_id": 11,
        "ng_reason": "코어 핀 파손"
      }
    ]
  }
}
```

---

## 🔧 Phase 3: 수리요청 시스템

### 3-1. 수리요청 생성 API

#### POST /api/v1/repair-requests
수리요청 생성 (파일 업로드 포함)

**Request (multipart/form-data):**
```
mold_id: 1
title: "코어 핀 파손 수리 요청"
description: "100K 정기점검 중 코어 핀 파손 발견"
ng_type: "core_pin_broken"
urgency: "high"
session_id: "uuid-session-token"
photos: [File, File, File]  // 최대 5장
```

**Response:**
```json
{
  "success": true,
  "data": {
    "repairRequest": {
      "id": 456,
      "request_number": "RR-20251202-001",
      "mold_id": 1,
      "title": "코어 핀 파손 수리 요청",
      "status": "requested",
      "urgency": "high",
      "requested_at": "2025-12-02T15:05:00Z"
    },
    "mold": {
      "id": 1,
      "mold_code": "M-2024-001",
      "status": "repair_requested"
    },
    "files_count": 3
  }
}
```

---

### 3-2. 수리요청 승인 API

#### POST /api/v1/repair-requests/:id/approve
수리요청 승인

**Request:**
```json
{
  "notes": "승인합니다. 긴급 수리 진행 바랍니다."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "repairRequest": {
      "id": 456,
      "status": "approved",
      "approved_at": "2025-12-02T15:10:00Z"
    }
  }
}
```

---

### 3-3. 수리요청 반려 API

#### POST /api/v1/repair-requests/:id/reject
수리요청 반려

**Request:**
```json
{
  "reason": "점검 결과 정상 범위 내입니다. 재확인 후 재요청 바랍니다."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "repairRequest": {
      "id": 456,
      "status": "rejected",
      "rejected_at": "2025-12-02T15:10:00Z",
      "rejection_reason": "점검 결과 정상 범위 내입니다. 재확인 후 재요청 바랍니다."
    }
  }
}
```

---

### 3-4. 제작처 배정 API

#### POST /api/v1/repair-requests/:id/assign
제작처 배정

**Request:**
```json
{
  "assigned_to_company_id": 2,
  "notes": "ABC 금형제작소에 배정합니다."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "repairRequest": {
      "id": 456,
      "status": "assigned",
      "assigned_to_company_id": 2,
      "assigned_at": "2025-12-02T15:15:00Z"
    }
  }
}
```

---

### 3-5. 수리 진행 상태 업데이트 API

#### PATCH /api/v1/repair-requests/:id/progress
수리 진행 상태 업데이트

**Request:**
```json
{
  "status": "in_progress",
  "progress_notes": "코어 핀 교체 작업 시작",
  "estimated_completion_date": "2025-12-05"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "repairRequest": {
      "id": 456,
      "status": "in_progress",
      "started_at": "2025-12-02T15:20:00Z",
      "completed_at": null,
      "confirmed_at": null,
      "closed_at": null
    }
  }
}
```

**상태 흐름:**
- `assigned` → `in_progress` → `done` → `confirmed` → `closed`

---

### 3-6. 귀책 협의 API

#### PATCH /api/v1/repair-requests/:id/blame
귀책 당사자 결정

**Request:**
```json
{
  "blame_party": "maker",
  "blame_percentage": 100,
  "blame_reason": "코어 핀 재질 불량으로 인한 조기 파손"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "repairRequest": {
      "id": 456,
      "blame_party": "maker",
      "blame_percentage": 100,
      "blame_confirmed": true,
      "blame_confirmed_at": "2025-12-05T10:00:00Z"
    }
  }
}
```

**귀책 당사자:**
- `maker`: 제작처 귀책
- `plant`: 생산처 귀책
- `hq`: 본사 귀책
- `shared`: 공유 부담
- `other`: 기타

---

## 🔒 인증 및 권한

### JWT 토큰 사용
모든 API (로그인 제외)는 JWT 토큰이 필요합니다.

**Header:**
```
Authorization: Bearer {token}
```

### 역할별 권한
- `system_admin`: 모든 API 접근 가능
- `mold_developer`: 본사 관련 API 접근
- `maker`: 제작처 관련 API 접근
- `plant`: 생산처 관련 API 접근

---

## 📝 에러 응답 형식

```json
{
  "success": false,
  "error": {
    "message": "에러 메시지",
    "details": "상세 에러 정보 (개발 모드에서만)"
  }
}
```

**HTTP 상태 코드:**
- `200`: 성공
- `400`: 잘못된 요청
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스 없음
- `500`: 서버 에러

---

## 🧪 테스트 가이드

### 1. 로그인 테스트
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"plant_user","password":"password123"}'
```

### 2. 대시보드 KPI 조회
```bash
curl -X GET http://localhost:3000/api/v1/dashboard/plant/kpis \
  -H "Authorization: Bearer {token}"
```

### 3. QR 스캔
```bash
curl -X POST http://localhost:3000/api/v1/qr/scan \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"qr_code":"MOLD-M-2024-001-QR123","location":{"latitude":35.5384,"longitude":129.3114}}'
```

### 4. 일상점검 제출
```bash
curl -X POST http://localhost:3000/api/v1/inspections/daily \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"mold_id":1,"production_quantity":500,"ng_quantity":0,"checklist_items":[]}'
```

### 5. 수리요청 생성
```bash
curl -X POST http://localhost:3000/api/v1/repair-requests \
  -H "Authorization: Bearer {token}" \
  -F "mold_id=1" \
  -F "title=수리요청" \
  -F "description=NG 발생" \
  -F "urgency=high" \
  -F "photos=@photo1.jpg"
```

---

## 📚 추가 리소스

- **API 통합 가이드**: `API_INTEGRATION_GUIDE.md`
- **체크리스트 시스템 설계**: `CHECKLIST_FORMS_SYSTEM_DESIGN.md`
- **대시보드 시스템 설계**: `DASHBOARD_SYSTEM_DESIGN.md`
- **수리 시스템 설계**: `MASS_PRODUCTION_REPAIR_SYSTEM_DESIGN.md`

---

## 🎯 프론트엔드 통합 체크리스트

### Phase 1
- [ ] 로그인 페이지 API 연결
- [ ] 역할별 대시보드 KPI 연결
- [ ] GPS 지도 컴포넌트 연결

### Phase 2
- [ ] QR 스캔 페이지 연결
- [ ] 일상점검 폼 연결
- [ ] 정기점검 폼 연결

### Phase 3
- [ ] 수리요청 생성 폼 연결
- [ ] 수리요청 목록 페이지 연결
- [ ] 수리요청 상세 페이지 연결
- [ ] 승인/반려/배정 기능 연결
- [ ] 진행 상태 업데이트 연결
- [ ] 귀책 협의 기능 연결

---

**구현 완료일**: 2025-12-02
**버전**: 1.0.0
**상태**: Production Ready ✅
