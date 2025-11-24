# 금형 신규 등록 API 가이드

## 📋 개요

금형개발 담당자가 최초로 금형 정보를 등록하는 API입니다.
- **엔드포인트**: `POST /api/v1/mold-specifications`
- **권한**: `mold_developer`, `system_admin`
- **기능**: 금형 기본 정보 등록 + QR 코드 자동 생성

---

## 🔐 인증

```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

---

## 📤 요청 (Request)

### 필수 필드
- `part_number` (string): 부품번호
- `part_name` (string): 부품명
- `car_model` (string): 차종

### 선택 필드

#### 기본 정보
- `car_year` (string): 연식 (예: "2024")
- `mold_type` (string): 금형 타입 (예: "사출금형", "프레스금형")
- `cavity_count` (integer): 캐비티 수
- `material` (string): 재질 (예: "NAK80")
- `tonnage` (integer): 톤수

#### 제작 정보
- `maker_company_id` (integer): 제작처 회사 ID
- `plant_company_id` (integer): 생산처 회사 ID
- `development_stage` (string): 개발 단계 ("개발", "양산")
- `production_stage` (string): 생산 단계 ("시제", "양산")

#### 일정 및 예산
- `order_date` (date): 발주일 (YYYY-MM-DD)
- `target_delivery_date` (date): 목표 납기일 (YYYY-MM-DD)
- `estimated_cost` (decimal): 예상 비용

#### 기타
- `notes` (text): 비고

---

## 📥 응답 (Response)

### 성공 (201 Created)

```json
{
  "success": true,
  "data": {
    "specification": {
      "id": 1,
      "part_number": "P-2024-001",
      "part_name": "범퍼 커버 LH",
      "car_model": "K5",
      "car_year": "2024",
      "mold_type": "사출금형",
      "cavity_count": 2,
      "material": "NAK80",
      "tonnage": 350,
      "maker_company_id": 5,
      "plant_company_id": 3,
      "development_stage": "개발",
      "production_stage": "시제",
      "status": "draft",
      "mold_id": 1,
      "created_by": 2,
      "created_at": "2024-11-24T09:55:00.000Z",
      "updated_at": "2024-11-24T09:55:00.000Z"
    },
    "mold": {
      "id": 1,
      "mold_code": "M-2024-001",
      "qr_token": "CAMS-P-2024-001-A1B2C3D4"
    },
    "message": "QR 코드가 자동으로 생성되었습니다"
  }
}
```

### 실패 (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "message": "부품번호, 부품명, 차종은 필수입니다"
  }
}
```

### 중복 (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "message": "이미 등록된 부품번호입니다"
  }
}
```

### 권한 없음 (403 Forbidden)

```json
{
  "success": false,
  "error": {
    "message": "Forbidden - Insufficient permissions"
  }
}
```

---

## 📝 요청 예시

### cURL

```bash
curl -X POST https://your-api-url.com/api/v1/mold-specifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "part_number": "P-2024-001",
    "part_name": "범퍼 커버 LH",
    "car_model": "K5",
    "car_year": "2024",
    "mold_type": "사출금형",
    "cavity_count": 2,
    "material": "NAK80",
    "tonnage": 350,
    "maker_company_id": 5,
    "plant_company_id": 3,
    "development_stage": "개발",
    "production_stage": "시제",
    "order_date": "2024-11-24",
    "target_delivery_date": "2025-02-28",
    "estimated_cost": 50000000,
    "notes": "초도 금형 제작"
  }'
```

### JavaScript (Axios)

```javascript
const axios = require('axios');

const createMold = async () => {
  try {
    const response = await axios.post(
      'https://your-api-url.com/api/v1/mold-specifications',
      {
        part_number: 'P-2024-001',
        part_name: '범퍼 커버 LH',
        car_model: 'K5',
        car_year: '2024',
        mold_type: '사출금형',
        cavity_count: 2,
        material: 'NAK80',
        tonnage: 350,
        maker_company_id: 5,
        plant_company_id: 3,
        development_stage: '개발',
        production_stage: '시제',
        order_date: '2024-11-24',
        target_delivery_date: '2025-02-28',
        estimated_cost: 50000000,
        notes: '초도 금형 제작'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('금형 등록 성공:', response.data);
    console.log('QR 코드:', response.data.data.mold.qr_token);
  } catch (error) {
    console.error('금형 등록 실패:', error.response?.data);
  }
};
```

---

## 🔄 자동 처리 사항

### 1. QR 코드 자동 생성
- 형식: `CAMS-{부품번호}-{랜덤8자리}`
- 예시: `CAMS-P-2024-001-A1B2C3D4`

### 2. 금형 코드 자동 생성
- 형식: `M-{연도}-{순번3자리}`
- 예시: `M-2024-001`

### 3. Mold 테이블 자동 생성
- `mold_specifications` 등록 시 `molds` 테이블에도 자동으로 기본 정보 생성
- 상태: `planning` (계획 단계)
- 위치: `본사`

### 4. 기본값 설정
- `development_stage`: "개발" (미입력 시)
- `production_stage`: "시제" (미입력 시)
- `order_date`: 현재 날짜 (미입력 시)
- `status`: "draft" (초안)

---

## 📊 데이터베이스 테이블

### mold_specifications
- 본사에서 1차 입력하는 금형 제작 사양
- QR 코드 및 금형 코드 자동 생성
- 제작처/생산처 회사 정보 연동

### molds
- 금형 마스터 테이블
- `mold_specifications`와 1:1 관계
- QR 토큰 저장

### companies
- 제작처(maker), 생산처(plant) 업체 정보
- `maker_company_id`, `plant_company_id`로 참조

---

## 🔗 관련 API

- `GET /api/v1/mold-specifications` - 금형 사양 목록 조회
- `GET /api/v1/mold-specifications/:id` - 금형 사양 상세 조회
- `PATCH /api/v1/mold-specifications/:id` - 금형 사양 수정
- `DELETE /api/v1/mold-specifications/:id` - 금형 사양 삭제 (소프트 삭제)
- `GET /api/v1/companies` - 업체 목록 조회

---

## ⚠️ 주의사항

1. **권한 확인**: 금형개발 담당자(`mold_developer`) 또는 시스템 관리자(`system_admin`)만 등록 가능
2. **부품번호 중복**: 동일한 `part_number`는 등록 불가
3. **업체 선택**: `maker_company_id`와 `plant_company_id`는 `companies` 테이블에 존재하는 ID여야 함
4. **QR 코드**: 자동 생성되므로 별도 입력 불필요
5. **금형 코드**: 자동 생성되므로 별도 입력 불필요

---

## 📱 프론트엔드 통합

### 페이지 경로
- `/molds/new` - 금형 신규 등록 페이지

### 컴포넌트
- `MoldNew.jsx` - 금형 등록 폼 컴포넌트

### 주요 기능
1. 업체 목록 자동 로드 (`companies` API)
2. 제작처/생산처 드롭다운 선택
3. 필수 필드 유효성 검사
4. 성공 시 QR 코드 표시
5. 3초 후 자동으로 목록 페이지로 이동

---

## 🧪 테스트 시나리오

### 1. 정상 등록
- 필수 필드 입력
- 제작처/생산처 선택
- 등록 성공 확인
- QR 코드 생성 확인

### 2. 필수 필드 누락
- 부품번호, 부품명, 차종 중 하나 누락
- 400 에러 응답 확인

### 3. 중복 등록
- 이미 존재하는 부품번호로 등록 시도
- 400 에러 응답 확인

### 4. 권한 없음
- 제작처 또는 생산처 사용자로 등록 시도
- 403 에러 응답 확인

---

## 📞 문의

문제가 발생하거나 추가 기능이 필요한 경우 개발팀에 문의하세요.
