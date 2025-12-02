# QR 스캔 → 체크리스트 작성/저장 흐름 테스트 가이드

## 📋 목차
1. [사전 준비](#사전-준비)
2. [DB Migration 실행](#db-migration-실행)
3. [백엔드 API 테스트](#백엔드-api-테스트)
4. [프론트엔드 흐름 테스트](#프론트엔드-흐름-테스트)
5. [DB 데이터 확인](#db-데이터-확인)
6. [문제 해결](#문제-해결)

---

## 🎯 사전 준비

### 1️⃣ Railway 배포 확인
```
Railway Dashboard → Backend Service → Deployments
```

**확인 사항:**
- ✅ 최신 커밋 배포 완료
- ✅ 서버 정상 실행 중
- ✅ 로그에 에러 없음

### 2️⃣ 필요한 URL
```
프론트엔드: https://bountiful-nurturing-production-cd5c.up.railway.app
백엔드: https://cams-mold-management-system-production-cb6e.up.railway.app
```

---

## 🗄️ DB Migration 실행

### Railway PostgreSQL 접속

1. **Railway Dashboard**
   ```
   Railway → Backend Service → PostgreSQL Database → Query
   ```

2. **Migration SQL 실행**
   ```sql
   -- server/migrations/004_create_checklist_templates.sql 전체 복사
   -- Query 창에 붙여넣기
   -- Execute 클릭
   ```

### 실행 결과 확인

```sql
-- 1. 테이블 생성 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'checklist%'
ORDER BY table_name;

-- 예상 결과:
-- checklist_answers
-- checklist_instances
-- checklist_template_items
-- checklist_templates

-- 2. 템플릿 데이터 확인
SELECT id, code, name, category, shot_interval 
FROM checklist_templates;

-- 예상 결과:
-- id | code        | name              | category | shot_interval
-- 1  | DAILY_MOLD  | 생산처 일상점검    | daily    | NULL
-- 2  | REG_20K     | 2만샷 정기점검     | regular  | 20000

-- 3. 템플릿 항목 확인
SELECT 
  t.name as template_name,
  i.order_no,
  i.section,
  i.label,
  i.field_type,
  i.required
FROM checklist_templates t
JOIN checklist_template_items i ON t.id = i.template_id
ORDER BY t.id, i.order_no;

-- 예상 결과: 총 8개 항목 (일상 4개 + 정기 4개)
```

---

## 🧪 백엔드 API 테스트

### 1️⃣ QR 스캔 API

**요청:**
```bash
curl -X GET "https://cams-mold-management-system-production-cb6e.up.railway.app/api/v1/mobile/qrcode/scan?code=M2024-001"
```

**예상 응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "mold": {
      "id": 1,
      "code": "M2024-001",
      "name": "금형명",
      "currentShot": 0,
      "status": "active"
    },
    "templates": [
      {
        "id": 1,
        "code": "DAILY_MOLD",
        "name": "생산처 일상점검",
        "category": "daily",
        "shot_interval": null
      },
      {
        "id": 2,
        "code": "REG_20K",
        "name": "2만샷 정기점검",
        "category": "regular",
        "shot_interval": 20000
      }
    ]
  }
}
```

**에러 시:**
- 404: 금형 코드가 DB에 없음 → 금형 데이터 먼저 생성 필요
- 500: 서버 에러 → Railway 로그 확인

---

### 2️⃣ 점검 시작 API

**요청:**
```bash
curl -X POST "https://cams-mold-management-system-production-cb6e.up.railway.app/api/v1/mobile/molds/1/checklists/start" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": 1,
    "siteType": "production"
  }'
```

**예상 응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "instanceId": 1,
    "mold": {
      "id": 1,
      "code": "M2024-001",
      "name": "금형명",
      "currentShot": 0
    },
    "template": {
      "id": 1,
      "code": "DAILY_MOLD",
      "name": "생산처 일상점검",
      "category": "daily",
      "items": [
        {
          "id": 1,
          "order_no": 1,
          "section": "공통",
          "label": "금형 외관 손상/파손 여부",
          "field_type": "boolean",
          "required": true,
          "ng_criteria": "NO면 NG"
        },
        {
          "id": 2,
          "order_no": 2,
          "section": "공통",
          "label": "코어/캐비티 이물 및 오염 여부",
          "field_type": "boolean",
          "required": true,
          "ng_criteria": "NO면 NG"
        },
        {
          "id": 3,
          "order_no": 3,
          "section": "냉각",
          "label": "냉각라인 누수/막힘 여부",
          "field_type": "boolean",
          "required": true,
          "ng_criteria": "NO면 NG"
        },
        {
          "id": 4,
          "order_no": 4,
          "section": "성형조건",
          "label": "현재 설정 성형조건과 표준조건 일치 여부",
          "field_type": "boolean",
          "required": true,
          "ng_criteria": "NO면 NG"
        }
      ]
    }
  }
}
```

---

### 3️⃣ 점검 제출 API

**요청:**
```bash
curl -X POST "https://cams-mold-management-system-production-cb6e.up.railway.app/api/v1/mobile/checklists/1/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "itemId": 1,
        "fieldType": "boolean",
        "value": true
      },
      {
        "itemId": 2,
        "fieldType": "boolean",
        "value": true
      },
      {
        "itemId": 3,
        "fieldType": "boolean",
        "value": false
      },
      {
        "itemId": 4,
        "fieldType": "boolean",
        "value": true
      }
    ]
  }'
```

**예상 응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "instanceId": 1,
    "ngCount": 1,
    "message": "점검 결과가 저장되었습니다."
  }
}
```

---

## 🖥️ 프론트엔드 흐름 테스트

### 1️⃣ QR 로그인

```
URL: https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/qr-login
```

**단계:**
1. 페이지 접속
2. 테스트 계정 선택 (생산처 또는 제작처)
3. 로그인 버튼 클릭
4. QR 스캔 페이지로 이동 확인

**확인 사항:**
- ✅ CORS 에러 없음 (F12 Console)
- ✅ 로그인 성공
- ✅ `/mobile/qr-scan` 페이지로 리다이렉트

---

### 2️⃣ QR 스캔

```
URL: https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/qr-scan
```

**단계:**
1. "수동 입력" 버튼 클릭
2. 금형 코드 입력: `M2024-001`
3. 확인 버튼 클릭

**확인 사항:**
- ✅ API 호출: `GET /api/v1/mobile/qrcode/scan?code=M2024-001`
- ✅ 응답 200 OK
- ✅ 템플릿 선택 페이지로 이동

**에러 시:**
- 404: 금형 코드 확인 또는 다른 코드 시도
- 500: Railway 로그 확인

---

### 3️⃣ 템플릿 선택

```
URL: https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/checklist-select
```

**단계:**
1. 금형 정보 표시 확인
2. 템플릿 목록 표시 확인
   - "생산처 일상점검"
   - "2만샷 정기점검"
3. "생산처 일상점검" 선택
4. 시작 버튼 클릭

**확인 사항:**
- ✅ API 호출: `POST /api/v1/mobile/molds/1/checklists/start`
- ✅ 응답 200 OK
- ✅ 체크리스트 폼 페이지로 이동

---

### 4️⃣ 체크리스트 작성

```
URL: https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/checklist-form
```

**단계:**
1. 템플릿 정보 표시 확인
2. 항목 목록 표시 확인 (4개 항목)
3. 각 항목에 답변 입력:
   - 금형 외관 손상/파손 여부: ✅ 정상
   - 코어/캐비티 이물 및 오염 여부: ✅ 정상
   - 냉각라인 누수/막힘 여부: ❌ 비정상
   - 성형조건 일치 여부: ✅ 정상
4. "제출" 버튼 클릭

**확인 사항:**
- ✅ API 호출: `POST /api/v1/mobile/checklists/1/submit`
- ✅ 응답 200 OK
- ✅ 완료 페이지로 이동

---

### 5️⃣ 완료 페이지

```
URL: https://bountiful-nurturing-production-cd5c.up.railway.app/mobile/checklist-complete
```

**단계:**
1. 성공 메시지 표시 확인
2. 자동으로 QR 스캔 페이지로 리다이렉트 (3초 후)

**확인 사항:**
- ✅ "점검이 완료되었습니다!" 메시지
- ✅ 자동 리다이렉트

---

## 🗄️ DB 데이터 확인

### Railway PostgreSQL Query

```sql
-- 1. 생성된 점검 인스턴스 확인
SELECT 
  id,
  template_id,
  mold_id,
  site_type,
  category,
  shot_counter,
  status,
  inspected_at,
  created_at
FROM checklist_instances
ORDER BY created_at DESC
LIMIT 10;

-- 예상 결과:
-- id | template_id | mold_id | site_type  | category | status    | inspected_at
-- 1  | 1           | 1       | production | daily    | submitted | 2024-12-02 11:30:00

-- 2. 저장된 답변 확인
SELECT 
  ca.id,
  ca.instance_id,
  cti.label,
  cti.field_type,
  ca.value_bool,
  ca.value_number,
  ca.value_text,
  ca.is_ng
FROM checklist_answers ca
JOIN checklist_template_items cti ON ca.item_id = cti.id
WHERE ca.instance_id = 1
ORDER BY cti.order_no;

-- 예상 결과:
-- instance_id | label                    | field_type | value_bool | is_ng
-- 1           | 금형 외관 손상/파손 여부  | boolean    | true       | false
-- 1           | 코어/캐비티 이물 및 오염  | boolean    | true       | false
-- 1           | 냉각라인 누수/막힘 여부   | boolean    | false      | true
-- 1           | 성형조건 일치 여부        | boolean    | true       | false

-- 3. NG 항목 통계
SELECT 
  ci.id as instance_id,
  ct.name as template_name,
  COUNT(*) FILTER (WHERE ca.is_ng = true) as ng_count,
  COUNT(*) as total_items
FROM checklist_instances ci
JOIN checklist_templates ct ON ci.template_id = ct.id
LEFT JOIN checklist_answers ca ON ci.id = ca.instance_id
WHERE ci.id = 1
GROUP BY ci.id, ct.name;

-- 예상 결과:
-- instance_id | template_name      | ng_count | total_items
-- 1           | 생산처 일상점검     | 1        | 4
```

---

## 🐛 문제 해결

### 1️⃣ 금형 데이터가 없는 경우

**증상:**
```
GET /api/v1/mobile/qrcode/scan?code=M2024-001 → 404 Not Found
```

**해결:**
```sql
-- 테스트용 금형 데이터 생성
INSERT INTO molds (mold_code, mold_name, status, shot_counter, created_at)
VALUES ('M2024-001', '테스트 금형', 'active', 0, now())
ON CONFLICT (mold_code) DO NOTHING;
```

---

### 2️⃣ 템플릿이 표시되지 않는 경우

**증상:**
- QR 스캔 후 템플릿 목록이 비어있음
- `templates: []`

**확인:**
```sql
-- 템플릿 데이터 확인
SELECT * FROM checklist_templates WHERE is_active = true;

-- 데이터가 없으면 Migration 재실행
```

---

### 3️⃣ 점검 시작 시 에러

**증상:**
```
POST /api/v1/mobile/molds/1/checklists/start → 500 Error
```

**확인:**
1. Railway 로그 확인
2. Sequelize 모델 에러 확인
3. 템플릿 항목 데이터 확인

```sql
-- 템플릿 항목 확인
SELECT * FROM checklist_template_items WHERE template_id = 1;
```

---

### 4️⃣ 점검 제출 시 에러

**증상:**
```
POST /api/v1/mobile/checklists/1/submit → 500 Error
```

**확인:**
1. Railway 로그 확인
2. instanceId가 유효한지 확인
3. answers 배열 형식 확인

```sql
-- 인스턴스 존재 확인
SELECT * FROM checklist_instances WHERE id = 1;
```

---

## ✅ 테스트 체크리스트

### DB Migration
- [ ] checklist_templates 테이블 생성
- [ ] checklist_template_items 테이블 생성
- [ ] checklist_instances 테이블 생성
- [ ] checklist_answers 테이블 생성
- [ ] 템플릿 2개 데이터 삽입
- [ ] 템플릿 항목 8개 데이터 삽입

### 백엔드 API
- [ ] GET /api/v1/mobile/qrcode/scan → 200 OK
- [ ] POST /api/v1/mobile/molds/:id/checklists/start → 200 OK
- [ ] POST /api/v1/mobile/checklists/:id/submit → 200 OK

### 프론트엔드
- [ ] QR 로그인 성공
- [ ] QR 스캔 페이지 접속
- [ ] 금형 코드 입력 및 스캔
- [ ] 템플릿 목록 표시
- [ ] 템플릿 선택 및 시작
- [ ] 체크리스트 폼 표시
- [ ] 답변 입력 및 제출
- [ ] 완료 페이지 표시
- [ ] 자동 리다이렉트

### DB 데이터
- [ ] checklist_instances 레코드 생성 확인
- [ ] checklist_answers 레코드 생성 확인
- [ ] status = 'submitted' 확인
- [ ] is_ng 플래그 정확성 확인

---

## 🎯 성공 기준

### 필수 기능
✅ QR 로그인 → QR 스캔 → 템플릿 선택 → 체크리스트 작성 → 제출 → 완료

### 데이터 저장
✅ checklist_instances 테이블에 레코드 생성
✅ checklist_answers 테이블에 답변 저장
✅ NG 항목 자동 판정

### 사용자 경험
✅ 에러 없이 전체 흐름 완료
✅ 각 단계에서 적절한 피드백
✅ 완료 후 자동으로 초기 화면 복귀

---

## 📚 참고 자료

- [Backend API Documentation](../server/README.md)
- [Frontend Component Guide](../client/README.md)
- [Database Schema](../server/migrations/004_create_checklist_templates.sql)
- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT_TROUBLESHOOTING.md)
