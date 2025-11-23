# 회사 관리 API (제작처/생산처 통합)

## 개요

제작처(Maker)와 생산처(Plant)를 통합 관리하는 API입니다. `company_type` 필드로 구분합니다.

- **제작처 (maker)**: 금형을 제작하는 협력사
- **생산처 (plant)**: 금형을 사용하여 제품을 생산하는 공장

---

## 데이터베이스 스키마

### companies 테이블

```sql
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  company_code VARCHAR(50) UNIQUE NOT NULL,        -- 회사 코드 (MKR-001, PLT-001)
  company_name VARCHAR(200) NOT NULL,              -- 회사명
  company_type VARCHAR(20) NOT NULL,               -- 'maker' 또는 'plant'
  
  -- 기본 정보
  business_number VARCHAR(50),                     -- 사업자등록번호
  representative VARCHAR(100),                     -- 대표자명
  
  -- 연락처
  phone VARCHAR(20),
  fax VARCHAR(20),
  email VARCHAR(100),
  
  -- 주소
  address VARCHAR(500),
  address_detail VARCHAR(200),
  postal_code VARCHAR(20),
  
  -- GPS 위치
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- 담당자
  manager_name VARCHAR(100),
  manager_phone VARCHAR(20),
  manager_email VARCHAR(100),
  
  -- 계약 정보
  contract_start_date DATE,
  contract_end_date DATE,
  contract_status VARCHAR(20) DEFAULT 'active',    -- active, expired, suspended
  
  -- 평가 정보
  rating DECIMAL(3, 2),                            -- 0.00 ~ 5.00
  quality_score DECIMAL(5, 2),                     -- 0 ~ 100
  delivery_score DECIMAL(5, 2),                    -- 0 ~ 100
  
  -- 능력 정보 (제작처 전용)
  production_capacity INTEGER,                     -- 월간 금형 제작 수
  equipment_list JSONB,                            -- 보유 장비 목록
  certifications JSONB,                            -- 인증 목록
  specialties JSONB,                               -- 전문 분야
  
  -- 생산 정보 (생산처 전용)
  production_lines INTEGER,                        -- 생산 라인 수
  injection_machines JSONB,                        -- 사출기 목록
  daily_capacity INTEGER,                          -- 일일 생산 능력
  
  -- 통계
  total_molds INTEGER DEFAULT 0,
  active_molds INTEGER DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  
  -- 기타
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  registered_by INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## API 엔드포인트

### 1. 회사 목록 조회

**GET** `/api/v1/companies`

회사 목록을 조회합니다. 제작처와 생산처를 필터링할 수 있습니다.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| company_type | string | No | 회사 유형 필터 (`maker`, `plant`) |
| is_active | boolean | No | 활성 상태 필터 |
| contract_status | string | No | 계약 상태 필터 (`active`, `expired`, `suspended`) |
| search | string | No | 회사명 또는 회사코드 검색 |
| limit | integer | No | 페이지당 항목 수 (기본값: 50) |
| offset | integer | No | 시작 위치 (기본값: 0) |

#### Response

```json
{
  "success": true,
  "data": {
    "total": 6,
    "items": [
      {
        "id": 1,
        "company_code": "MKR-001",
        "company_name": "대한금형제작소",
        "company_type": "maker",
        "phone": "02-1234-5678",
        "email": "contact@daehan-mold.com",
        "address": "경기도 평택시 산업단지로 123",
        "manager_name": "이영희",
        "manager_phone": "010-1234-5678",
        "contract_status": "active",
        "rating": 4.5,
        "quality_score": 92.5,
        "delivery_score": 88.0,
        "production_capacity": 15,
        "total_molds": 45,
        "active_molds": 38,
        "is_active": true,
        "users": [
          {
            "id": 10,
            "username": "maker01",
            "name": "김제작",
            "email": "maker01@daehan-mold.com",
            "user_type": "maker",
            "is_active": true
          }
        ]
      }
    ],
    "limit": 50,
    "offset": 0
  }
}
```

#### 예제

```bash
# 모든 회사 조회
GET /api/v1/companies

# 제작처만 조회
GET /api/v1/companies?company_type=maker

# 생산처만 조회
GET /api/v1/companies?company_type=plant

# 활성 회사만 조회
GET /api/v1/companies?is_active=true

# 회사명 검색
GET /api/v1/companies?search=대한
```

---

### 2. 회사 상세 조회

**GET** `/api/v1/companies/:id`

특정 회사의 상세 정보를 조회합니다.

#### Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "company_code": "MKR-001",
    "company_name": "대한금형제작소",
    "company_type": "maker",
    "business_number": "123-45-67890",
    "representative": "김철수",
    "phone": "02-1234-5678",
    "fax": "02-1234-5679",
    "email": "contact@daehan-mold.com",
    "address": "경기도 평택시 산업단지로 123",
    "address_detail": "1동 101호",
    "postal_code": "17700",
    "latitude": 37.0000,
    "longitude": 127.0000,
    "manager_name": "이영희",
    "manager_phone": "010-1234-5678",
    "manager_email": "manager@daehan-mold.com",
    "contract_start_date": "2023-01-01",
    "contract_end_date": "2025-12-31",
    "contract_status": "active",
    "rating": 4.5,
    "quality_score": 92.5,
    "delivery_score": 88.0,
    "production_capacity": 15,
    "equipment_list": [
      { "name": "CNC 머시닝센터", "count": 5 },
      { "name": "EDM 방전가공기", "count": 3 },
      { "name": "와이어컷", "count": 2 }
    ],
    "certifications": ["ISO 9001", "ISO 14001"],
    "specialties": ["사출금형", "프레스금형"],
    "total_molds": 45,
    "active_molds": 38,
    "completed_projects": 120,
    "notes": "20년 경력의 우수 협력사",
    "is_active": true,
    "users": [...],
    "makerMolds": [...],
    "plantMolds": []
  }
}
```

---

### 3. 회사 등록

**POST** `/api/v1/companies`

새로운 회사를 등록합니다.

**권한**: `system_admin`, `mold_developer`

#### Request Body

```json
{
  "company_code": "MKR-004",
  "company_name": "신규금형제작소",
  "company_type": "maker",
  "business_number": "456-78-90123",
  "representative": "홍길동",
  "phone": "02-9876-5432",
  "email": "contact@new-mold.com",
  "address": "서울시 구로구 디지털로 999",
  "address_detail": "2동 201호",
  "postal_code": "08300",
  "latitude": 37.4850,
  "longitude": 126.8970,
  "manager_name": "김담당",
  "manager_phone": "010-9876-5432",
  "manager_email": "manager@new-mold.com",
  "contract_start_date": "2024-01-01",
  "contract_end_date": "2026-12-31",
  "production_capacity": 10,
  "equipment_list": [
    { "name": "CNC 머시닝센터", "count": 3 }
  ],
  "certifications": ["ISO 9001"],
  "specialties": ["사출금형"],
  "notes": "신규 협력사"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": 7,
    "company_code": "MKR-004",
    "company_name": "신규금형제작소",
    "company_type": "maker",
    ...
  }
}
```

---

### 4. 회사 정보 수정

**PATCH** `/api/v1/companies/:id`

회사 정보를 수정합니다.

**권한**: `system_admin`, `mold_developer`

**참고**: `company_code`와 `company_type`은 수정할 수 없습니다.

#### Request Body

```json
{
  "phone": "02-9999-8888",
  "manager_name": "이신규",
  "manager_phone": "010-9999-8888",
  "rating": 4.8,
  "quality_score": 95.0,
  "notes": "품질 개선 확인됨"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "company_code": "MKR-001",
    "company_name": "대한금형제작소",
    ...
  }
}
```

---

### 5. 회사 비활성화

**DELETE** `/api/v1/companies/:id`

회사를 비활성화합니다 (소프트 삭제).

**권한**: `system_admin`

**참고**: 활성 금형이 있는 경우 비활성화할 수 없습니다.

#### Response

```json
{
  "success": true,
  "data": {
    "message": "회사가 비활성화되었습니다"
  }
}
```

#### Error Response (활성 금형 존재)

```json
{
  "success": false,
  "error": {
    "message": "활성 금형이 있어 비활성화할 수 없습니다",
    "active_molds": 15
  }
}
```

---

### 6. 회사 통계 조회

**GET** `/api/v1/companies/:id/stats`

회사의 통계 정보를 조회합니다.

#### Response (제작처)

```json
{
  "success": true,
  "data": {
    "company_info": {
      "id": 1,
      "company_code": "MKR-001",
      "company_name": "대한금형제작소",
      "company_type": "maker"
    },
    "stats": {
      "total_molds": 45,
      "active_molds": 38,
      "repair_molds": 5,
      "total_specifications": 50,
      "in_production": 8,
      "completed": 42
    }
  }
}
```

#### Response (생산처)

```json
{
  "success": true,
  "data": {
    "company_info": {
      "id": 4,
      "company_code": "PLT-001",
      "company_name": "현대자동차 울산공장",
      "company_type": "plant"
    },
    "stats": {
      "total_molds": 150,
      "active_molds": 120,
      "in_production": 100,
      "maintenance": 15,
      "idle": 5
    }
  }
}
```

---

## 데이터 연동

### 기존 테이블과의 관계

#### 1. users 테이블

```sql
ALTER TABLE users ADD COLUMN company_id INTEGER REFERENCES companies(id);
```

사용자는 하나의 회사에 소속됩니다.

#### 2. molds 테이블

```sql
ALTER TABLE molds ADD COLUMN maker_company_id INTEGER REFERENCES companies(id);
ALTER TABLE molds ADD COLUMN plant_company_id INTEGER REFERENCES companies(id);
```

금형은 제작처와 생산처 정보를 모두 가집니다.

#### 3. mold_specifications 테이블

```sql
ALTER TABLE mold_specifications ADD COLUMN maker_company_id INTEGER REFERENCES companies(id);
ALTER TABLE mold_specifications ADD COLUMN plant_company_id INTEGER REFERENCES companies(id);
```

금형 사양서도 제작처와 생산처 정보를 가집니다.

---

## 사용 예제

### 제작처 등록 및 사용자 연결

```javascript
// 1. 제작처 등록
POST /api/v1/companies
{
  "company_code": "MKR-005",
  "company_name": "우수금형",
  "company_type": "maker",
  ...
}

// Response: { "id": 8, ... }

// 2. 제작처 사용자 등록
POST /api/v1/users
{
  "username": "maker05",
  "password": "password123",
  "name": "김제작",
  "user_type": "maker",
  "company_id": 8
}
```

### 생산처 등록 및 금형 연결

```javascript
// 1. 생산처 등록
POST /api/v1/companies
{
  "company_code": "PLT-004",
  "company_name": "삼성전자 수원공장",
  "company_type": "plant",
  ...
}

// Response: { "id": 9, ... }

// 2. 금형 사양서 생성 시 생산처 지정
POST /api/v1/mold-specifications
{
  "part_number": "ABC-12345",
  "part_name": "스마트폰 케이스",
  "maker_company_id": 8,
  "plant_company_id": 9,
  ...
}
```

---

## 에러 코드

| Status Code | Error Message | Description |
|-------------|---------------|-------------|
| 400 | 회사 코드, 회사명, 회사 유형은 필수입니다 | 필수 필드 누락 |
| 400 | 회사 유형은 maker 또는 plant여야 합니다 | 잘못된 company_type |
| 400 | 활성 금형이 있어 비활성화할 수 없습니다 | 비활성화 불가 |
| 404 | 회사를 찾을 수 없습니다 | 존재하지 않는 회사 ID |
| 409 | 이미 등록된 회사 코드 또는 회사명입니다 | 중복 등록 시도 |
| 500 | 회사 목록 조회 실패 | 서버 오류 |

---

## 마이그레이션 실행

```bash
# 마이그레이션 실행
npm run migrate

# 샘플 데이터 시딩
npm run seed
```

---

## 프론트엔드 통합 가이드

### 회사 선택 드롭다운

```javascript
// 제작처 목록 가져오기
const makers = await fetch('/api/v1/companies?company_type=maker&is_active=true')
  .then(res => res.json());

// 생산처 목록 가져오기
const plants = await fetch('/api/v1/companies?company_type=plant&is_active=true')
  .then(res => res.json());

// 드롭다운 렌더링
<select name="maker_company_id">
  {makers.data.items.map(maker => (
    <option value={maker.id}>{maker.company_name}</option>
  ))}
</select>
```

### 회사 정보 표시

```javascript
// 회사 상세 정보 가져오기
const company = await fetch(`/api/v1/companies/${companyId}`)
  .then(res => res.json());

// 회사 유형에 따라 다른 정보 표시
if (company.data.company_type === 'maker') {
  // 제작처 정보: 생산능력, 장비, 인증
  console.log('생산능력:', company.data.production_capacity);
  console.log('보유장비:', company.data.equipment_list);
} else {
  // 생산처 정보: 생산라인, 사출기, 일일생산능력
  console.log('생산라인:', company.data.production_lines);
  console.log('사출기:', company.data.injection_machines);
}
```

---

## 권한 관리

| 사용자 유형 | 조회 | 등록 | 수정 | 삭제 |
|-----------|------|------|------|------|
| system_admin | ✅ | ✅ | ✅ | ✅ |
| mold_developer | ✅ | ✅ | ✅ | ❌ |
| maker | ✅ | ❌ | ❌ | ❌ |
| plant | ✅ | ❌ | ❌ | ❌ |

---

## 참고 사항

1. **회사 코드 규칙**
   - 제작처: `MKR-XXX` (예: MKR-001, MKR-002)
   - 생산처: `PLT-XXX` (예: PLT-001, PLT-002)

2. **GPS 좌표**
   - 공장 위치를 GPS 좌표로 저장하여 지도에 표시 가능
   - 금형 이동 추적 시 활용

3. **평가 시스템**
   - `rating`: 전체 평가 (0.00 ~ 5.00)
   - `quality_score`: 품질 점수 (0 ~ 100)
   - `delivery_score`: 납기 점수 (0 ~ 100)

4. **통계 자동 업데이트**
   - `total_molds`, `active_molds`, `completed_projects`는 금형 생성/수정 시 자동 업데이트
