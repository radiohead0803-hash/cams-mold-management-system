# 테스트 시드 데이터 가이드

## 📋 개요

개발 및 테스트 환경에서 사용할 수 있는 시드 데이터를 제공합니다.

---

## 🗄️ 포함된 데이터

### 1️⃣ 금형 (3개)
- **M2024-001** - 테스트 금형 A (active, 15,000샷)
- **M2024-002** - 테스트 금형 B (active, 25,000샷)
- **M2024-003** - 테스트 금형 C (maintenance, 8,000샷)

### 2️⃣ 체크리스트 인스턴스 (2개)
- M2024-001 일상점검 (2시간 전 제출, NG 2건)
- M2024-002 정기점검 (1일 전 제출, NG 1건)

### 3️⃣ 체크리스트 답변 (8개)
- 일상점검 4개 답변 (NG 2건)
- 정기점검 4개 답변 (NG 1건)

### 4️⃣ 수리요청 (4개)
- **요청 상태** - M2024-001 일상점검 NG (2시간 전)
- **접수 상태** - M2024-002 정기점검 NG (1일 전)
- **진행중 상태** - M2024-002 예방정비 (3일 전)
- **완료 상태** - M2024-003 수리 완료 (5일 전)

### 5️⃣ 수리요청 항목 (3개)
- 코어/캐비티 이물 및 오염 여부 (NG)
- 냉각라인 누수/막힘 여부 (NG)
- 가이드핀/부시 마모 상태 점검 (NG)

---

## 🚀 실행 방법

### Railway PostgreSQL에서 실행

1. **Railway Dashboard 접속**
   ```
   Railway → Backend Service → PostgreSQL Database → Query
   ```

2. **Migration 순서대로 실행**
   
   **필수 Migration (순서대로):**
   ```sql
   -- 1. 체크리스트 템플릿 테이블 생성
   -- server/migrations/004_create_checklist_templates.sql
   
   -- 2. 수리요청 테이블 생성
   -- server/migrations/005_create_repair_requests.sql
   
   -- 3. 테스트 시드 데이터 삽입
   -- server/migrations/006_seed_test_data.sql
   ```

3. **각 파일 내용을 복사하여 Query 창에 붙여넣기**

4. **Execute 클릭**

---

## ✅ 데이터 확인

### 전체 데이터 개수 확인
```sql
SELECT 
  '금형' as 구분,
  COUNT(*) as 개수
FROM molds
WHERE mold_code LIKE 'M2024-%'

UNION ALL

SELECT 
  '체크리스트 인스턴스',
  COUNT(*)
FROM checklist_instances

UNION ALL

SELECT 
  '체크리스트 답변',
  COUNT(*)
FROM checklist_answers

UNION ALL

SELECT 
  '수리요청',
  COUNT(*)
FROM repair_requests

UNION ALL

SELECT 
  '수리요청 항목',
  COUNT(*)
FROM repair_request_items;
```

**예상 결과:**
```
구분                  | 개수
---------------------|-----
금형                  | 3
체크리스트 인스턴스    | 2
체크리스트 답변        | 8
수리요청              | 4
수리요청 항목          | 3
```

---

### 금형 목록 확인
```sql
SELECT 
  mold_code,
  mold_name,
  status,
  shot_counter
FROM molds
WHERE mold_code LIKE 'M2024-%'
ORDER BY mold_code;
```

**예상 결과:**
```
mold_code  | mold_name      | status      | shot_counter
-----------|----------------|-------------|-------------
M2024-001  | 테스트 금형 A   | active      | 15000
M2024-002  | 테스트 금형 B   | active      | 25000
M2024-003  | 테스트 금형 C   | maintenance | 8000
```

---

### 수리요청 목록 확인
```sql
SELECT 
  rr.id,
  m.mold_code,
  rr.status,
  rr.priority,
  rr.request_type,
  rr.title,
  rr.created_at
FROM repair_requests rr
JOIN molds m ON rr.mold_id = m.id
ORDER BY rr.created_at DESC;
```

**예상 결과:**
```
id | mold_code  | status      | priority | request_type | title
---|------------|-------------|----------|--------------|------------------
1  | M2024-001  | requested   | normal   | ng_repair    | [NG] 금형 M2024-001...
2  | M2024-002  | accepted    | high     | ng_repair    | [NG] 금형 M2024-002...
3  | M2024-002  | in_progress | high     | preventive   | [예방정비] 금형...
4  | M2024-003  | done        | normal   | ng_repair    | [완료] 금형...
```

---

### NG 항목 상세 확인
```sql
SELECT 
  rr.id as request_id,
  rr.title,
  rri.item_section,
  rri.item_label,
  rri.value_bool,
  rri.is_ng
FROM repair_requests rr
JOIN repair_request_items rri ON rr.id = rri.repair_request_id
WHERE rr.status IN ('requested', 'accepted')
ORDER BY rr.id, rri.id;
```

**예상 결과:**
```
request_id | title           | item_section | item_label              | value_bool | is_ng
-----------|-----------------|--------------|-------------------------|------------|------
1          | [NG] 금형...    | 공통         | 코어/캐비티 이물...      | false      | true
1          | [NG] 금형...    | 냉각         | 냉각라인 누수...         | false      | true
2          | [NG] 금형...    | 가이드       | 가이드핀/부시 마모...    | false      | true
```

---

## 🧪 API 테스트

### 1️⃣ QR 스캔 API
```bash
curl "https://cams-mold-management-system-production-cb6e.up.railway.app/api/v1/mobile/qrcode/scan?code=M2024-001"
```

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "mold": {
      "id": 1,
      "code": "M2024-001",
      "name": "테스트 금형 A",
      "currentShot": 15000,
      "status": "active"
    },
    "templates": [...]
  }
}
```

---

### 2️⃣ 수리요청 목록 API
```bash
curl "https://cams-mold-management-system-production-cb6e.up.railway.app/api/v1/repair-requests"
```

**예상 응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "status": "requested",
      "priority": "normal",
      "title": "[NG] 금형 M2024-001 점검 결과 수리요청",
      "mold": {
        "mold_code": "M2024-001",
        "mold_name": "테스트 금형 A"
      }
    },
    ...
  ]
}
```

---

### 3️⃣ 수리요청 상세 API
```bash
curl "https://cams-mold-management-system-production-cb6e.up.railway.app/api/v1/repair-requests/1"
```

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "[NG] 금형 M2024-001 점검 결과 수리요청",
    "status": "requested",
    "items": [
      {
        "item_label": "코어/캐비티 이물 및 오염 여부",
        "item_section": "공통",
        "value_bool": false,
        "is_ng": true
      },
      {
        "item_label": "냉각라인 누수/막힘 여부",
        "item_section": "냉각",
        "value_bool": false,
        "is_ng": true
      }
    ]
  }
}
```

---

## 🎨 프론트엔드 테스트

### 1️⃣ QR 스캔 페이지
```
URL: /mobile/qr-scan
입력: M2024-001
결과: 금형 정보 + 템플릿 목록 표시
```

### 2️⃣ 수리요청 목록 페이지
```
URL: /plant/repairs
결과: 4건의 수리요청 표시
- 요청 (M2024-001)
- 접수 (M2024-002)
- 진행중 (M2024-002)
- 완료 (M2024-003)
```

### 3️⃣ 수리요청 상세 페이지
```
URL: /plant/repairs/1
결과: 
- 금형: M2024-001
- NG 항목 2건 표시
- 상태: 요청
```

---

## 🗑️ 데이터 삭제 (초기화)

테스트 데이터를 삭제하려면:

```sql
-- 역순으로 삭제 (외래키 제약 때문)
DELETE FROM repair_request_items;
DELETE FROM repair_requests;
DELETE FROM checklist_answers;
DELETE FROM checklist_instances;
DELETE FROM molds WHERE mold_code LIKE 'M2024-%';
```

---

## 📊 데이터 구조

### 관계도
```
molds (금형)
  ↓
checklist_instances (점검 인스턴스)
  ↓
checklist_answers (점검 답변)
  ↓ (NG 발생 시)
repair_requests (수리요청)
  ↓
repair_request_items (NG 항목 상세)
```

### 상태 흐름
```
체크리스트 제출 (submitted)
  ↓ (NG 발견)
수리요청 생성 (requested)
  ↓
접수 (accepted)
  ↓
진행중 (in_progress)
  ↓
완료 (done)
```

---

## ⚠️ 주의사항

1. **프로덕션 환경에서는 실행하지 마세요!**
   - 이 시드 데이터는 개발/테스트 전용입니다.

2. **Migration 순서 준수**
   - 004 → 005 → 006 순서로 실행해야 합니다.

3. **중복 실행 방지**
   - `ON CONFLICT DO NOTHING` 구문으로 중복 방지
   - 여러 번 실행해도 안전합니다.

4. **시간 기반 데이터**
   - `now() - interval` 사용으로 실행 시점 기준 생성
   - 재실행 시 시간이 갱신됩니다.

---

## 🎯 테스트 시나리오

### 시나리오 1: QR 스캔 → 체크리스트 작성
1. QR 스캔: `M2024-001`
2. 템플릿 선택: "생산처 일상점검"
3. 체크리스트 작성 및 제출
4. 수리요청 자동 생성 확인

### 시나리오 2: 수리요청 조회
1. 생산처 대시보드 로그인
2. "수리요청" 메뉴 클릭
3. 목록에서 4건 확인
4. 상세 페이지에서 NG 항목 확인

### 시나리오 3: 수리요청 상태 변경
1. 수리요청 상세 페이지
2. 상태 변경: requested → accepted
3. 목록에서 상태 업데이트 확인

---

## 📝 참고 자료

- [QR Checklist Flow Test Guide](./QR_CHECKLIST_FLOW_TEST_GUIDE.md)
- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT_TROUBLESHOOTING.md)
- Migration Files:
  - `004_create_checklist_templates.sql`
  - `005_create_repair_requests.sql`
  - `006_seed_test_data.sql`
