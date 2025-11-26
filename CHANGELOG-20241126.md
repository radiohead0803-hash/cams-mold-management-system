# 금형정보 페이지 백엔드 DB 매칭 및 오류 수정

**작업 날짜**: 2024-11-26  
**작업자**: Cascade AI  
**관련 URL**: https://bountiful-nurturing-production-cd5c.up.railway.app/molds/new

---

## 📋 작업 요약

금형 신규 등록 페이지(`/molds/new`)와 백엔드 데이터베이스 간의 필드 매칭 오류를 수정하고, DATABASE_SCHEMA.md 문서와 실제 구현을 일치시켰습니다.

---

## 🔍 발견된 문제점

### 1. **MoldSpecification 모델 필드 누락**
- **문제**: `DATABASE_SCHEMA.md`에는 `mold_specifications.mold_id` 필드가 정의되어 있으나, 실제 모델에는 없음
- **영향**: 금형 사양과 금형 마스터 간의 양방향 참조 불가능

### 2. **target_maker_id 참조 불일치**
- **문제**: Controller에서 `target_maker_id`를 null로 설정
- **원인**: 주석에 "User ID가 필요하므로 null"이라고 되어 있었으나, 실제로는 Company ID를 참조해야 함
- **영향**: 제작처 정보가 제대로 저장되지 않음

### 3. **모델 관계 설정 누락**
- **문제**: `MoldSpecification`에서 `Mold`로의 관계가 정의되지 않음
- **영향**: Include 쿼리 시 관련 데이터를 가져올 수 없음

---

## ✅ 수정 내용

### 1. **MoldSpecification 모델 수정**
**파일**: `server/src/models/MoldSpecification.js`

#### 추가된 필드:
```javascript
mold_id: {
  type: DataTypes.INTEGER,
  references: {
    model: 'molds',
    key: 'id'
  },
  comment: '연동된 금형 마스터 ID'
}
```

#### 추가된 관계:
```javascript
this.hasOne(models.Mold, {
  foreignKey: 'specification_id',
  as: 'mold'
});
```

### 2. **Controller 로직 수정**
**파일**: `server/src/controllers/moldSpecificationController.js`

#### 변경 전:
```javascript
target_maker_id: null, // Company ID가 아닌 User ID가 필요하므로 null
```

#### 변경 후:
```javascript
target_maker_id: maker_company_id || null, // 제작처 회사 ID
```

#### 추가된 로직:
```javascript
// MoldSpecification에 mold_id 연동
await specification.update({
  mold_id: mold.id
});
```

### 3. **마이그레이션 파일 생성**
**파일**: `server/src/migrations/20241126-add-mold-id-to-specifications.js`

- `mold_specifications` 테이블에 `mold_id` 컬럼 추가
- 외래 키 제약 조건 설정
- 인덱스 추가

### 4. **SQL 스크립트 생성**
**파일**: `server/sql/add-mold-id-column.sql`

Railway 데이터베이스에 직접 실행할 SQL 스크립트:
- `mold_id` 컬럼 추가
- 외래 키 및 인덱스 설정
- 기존 데이터 업데이트

---

## 🗄️ 데이터베이스 스키마 변경

### mold_specifications 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| mold_id | INTEGER | FK → molds(id) | 연동된 금형 마스터 ID |

**인덱스**: `idx_mold_specifications_mold_id`

---

## 🔄 데이터 흐름

### 금형 등록 프로세스 (수정 후)

```
1. 프론트엔드 → POST /api/v1/mold-specifications
   ↓
2. MoldSpecification 생성
   - part_number, part_name, car_model 등 저장
   - target_maker_id = maker_company_id
   - status = 'draft'
   ↓
3. Mold 생성
   - mold_code 자동 생성 (M-YYYY-XXX)
   - qr_token 자동 생성 (CAMS-{part_number}-{random})
   - specification_id = specification.id
   ↓
4. MoldSpecification 업데이트
   - mold_id = mold.id (양방향 참조 완성)
   ↓
5. 응답 반환
   - specification 정보
   - mold_code, qr_token
```

---

## 📊 필드 매칭표

### 프론트엔드 → 백엔드

| 프론트엔드 필드 | 백엔드 필드 | 테이블 | 비고 |
|----------------|------------|--------|------|
| part_number | part_number | mold_specifications | 필수 |
| part_name | part_name | mold_specifications | 필수 |
| car_model | car_model | mold_specifications | 필수 |
| car_year | car_year | mold_specifications | |
| mold_type | mold_type | mold_specifications | |
| cavity_count | cavity_count | mold_specifications | |
| material | material | mold_specifications | |
| tonnage | tonnage | mold_specifications | |
| maker_company_id | maker_company_id | mold_specifications | 제작처 |
| maker_company_id | target_maker_id | mold_specifications | 동일 값 |
| plant_company_id | plant_company_id | mold_specifications | 생산처 |
| development_stage | development_stage | mold_specifications | |
| production_stage | production_stage | mold_specifications | |
| order_date | order_date | mold_specifications | |
| target_delivery_date | target_delivery_date | mold_specifications | |
| estimated_cost | estimated_cost | mold_specifications | |
| notes | notes | mold_specifications | |

### 자동 생성 필드

| 필드 | 생성 방식 | 예시 |
|------|----------|------|
| mold_code | M-{YYYY}-{XXX} | M-2024-001 |
| qr_token | CAMS-{part_number}-{random} | CAMS-P-2024-001-A1B2C3D4 |
| status | 'draft' (고정) | draft |
| created_by | req.user.id | 1 |

---

## 🚀 배포 가이드

### 1. Railway 데이터베이스 업데이트

```bash
# Railway CLI로 접속
railway login
railway link

# SQL 스크립트 실행
railway run psql < server/sql/add-mold-id-column.sql
```

또는 Railway 대시보드에서 직접 SQL 실행:
1. Railway 프로젝트 → PostgreSQL 서비스 선택
2. Query 탭 선택
3. `server/sql/add-mold-id-column.sql` 내용 복사 & 실행

### 2. 서버 재배포

```bash
# 변경사항 커밋
git add .
git commit -m "Fix: 금형정보 페이지 백엔드 DB 매칭 및 오류 수정"
git push

# Railway가 자동으로 재배포
```

### 3. 확인 사항

- [ ] 금형 신규 등록 페이지 접속 확인
- [ ] 제작처/생산처 선택 확인
- [ ] 금형 등록 성공 확인
- [ ] QR 코드 자동 생성 확인
- [ ] 데이터베이스에 정상 저장 확인

---

## 🧪 테스트 방법

### 1. 금형 등록 테스트

```bash
# API 테스트
curl -X POST https://bountiful-nurturing-production-cd5c.up.railway.app/api/v1/mold-specifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "part_number": "TEST-001",
    "part_name": "테스트 부품",
    "car_model": "K5",
    "maker_company_id": 1,
    "plant_company_id": 2
  }'
```

### 2. 데이터 확인

```sql
-- 최근 등록된 금형 확인
SELECT 
    ms.id,
    ms.part_number,
    ms.part_name,
    ms.target_maker_id,
    ms.maker_company_id,
    ms.plant_company_id,
    ms.mold_id,
    m.mold_code,
    m.qr_token
FROM mold_specifications ms
LEFT JOIN molds m ON ms.mold_id = m.id
ORDER BY ms.created_at DESC
LIMIT 5;
```

---

## 📝 참고 문서

- `docs/DATABASE_SCHEMA.md` - 데이터베이스 스키마 정의
- `docs/MOLD_LIFECYCLE_WORKFLOW.md` - 금형 생명주기 워크플로우
- `client/src/pages/MoldNew.jsx` - 금형 등록 페이지
- `server/src/controllers/moldSpecificationController.js` - 금형 사양 컨트롤러
- `server/src/models/MoldSpecification.js` - 금형 사양 모델

---

## ⚠️ 주의사항

1. **데이터 무결성**: 기존 데이터가 있는 경우 SQL 스크립트의 UPDATE 문이 자동으로 연동합니다.
2. **외래 키 제약**: `mold_id`는 nullable이므로 기존 데이터에 영향 없습니다.
3. **롤백**: 문제 발생 시 마이그레이션 down 함수로 롤백 가능합니다.

---

## 🎯 다음 단계

- [ ] 금형 수정 페이지 확인
- [ ] 금형 목록 페이지에서 관계 데이터 표시 확인
- [ ] 제작처/생산처 자동 연동 테스트
- [ ] QR 코드 스캔 기능 테스트

---

**작업 완료**: 2024-11-26  
**상태**: ✅ 코드 수정 완료, 데이터베이스 마이그레이션 대기 중
