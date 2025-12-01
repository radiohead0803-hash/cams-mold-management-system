# 🗄️ CAMS 금형관리 시스템 ERD

## 📊 Entity Relationship Diagram

```mermaid
erDiagram
    %% 사용자 및 회사
    users ||--o{ qr_sessions : "creates"
    users ||--o{ repairs : "requests"
    users ||--o{ daily_checks : "performs"
    users ||--o{ notifications : "receives"
    users }o--|| companies : "belongs_to"
    
    %% 금형 관련
    molds ||--o{ qr_sessions : "has"
    molds ||--o{ repairs : "requires"
    molds ||--o{ daily_checks : "undergoes"
    molds ||--o{ inspections : "undergoes"
    molds ||--o{ transfers : "involves"
    molds ||--o{ shots : "tracks"
    molds ||--o{ mold_issues : "has"
    molds ||--|| mold_specifications : "has"
    molds }o--|| companies : "owned_by"
    
    %% 수리요청
    repairs }o--|| molds : "for"
    repairs }o--|| users : "requested_by"
    repairs }o--o| qr_sessions : "linked_to"
    
    %% QR 세션
    qr_sessions }o--|| users : "created_by"
    qr_sessions }o--|| molds : "scans"
    
    %% 일상점검
    daily_checks }o--|| molds : "for"
    daily_checks }o--|| users : "performed_by"
    daily_checks ||--o{ daily_check_items : "contains"
    daily_check_items }o--|| check_item_master : "based_on"
    daily_check_items ||--o{ daily_check_item_status : "has_status"
    
    %% 정기검사
    inspections }o--|| molds : "for"
    inspections ||--o{ inspection_items : "contains"
    inspections ||--o{ inspection_photos : "has"
    
    %% 금형 사양
    mold_specifications }o--|| molds : "for"
    mold_specifications }o--o| car_models : "uses"
    mold_specifications }o--o| materials : "uses"
    mold_specifications }o--o| mold_types : "is"
    mold_specifications }o--o| tonnages : "requires"
    
    %% 제작처 사양
    maker_specifications }o--|| companies : "for"
    
    %% 알림
    notifications }o--|| users : "for"
    
    %% 이전
    transfers }o--|| molds : "involves"
    transfers }o--|| companies : "from"
    transfers }o--|| companies : "to"
    
    %% 타수
    shots }o--|| molds : "for"
    
    %% 금형 개발
    mold_development_plans }o--|| molds : "for"
    mold_development_plans ||--o{ mold_process_steps : "has"
    
    %% 양산 전 체크리스트
    pre_production_checklists }o--|| molds : "for"
    
    %% 체크리스트 마스터
    checklist_master_templates ||--o{ checklist_template_items : "contains"
    checklist_master_templates ||--o{ checklist_template_deployments : "deployed_as"
    checklist_master_templates ||--o{ checklist_template_history : "has_history"
    
    %% 생산 수량
    production_quantities }o--|| molds : "for"

    %% Users 테이블
    users {
        int id PK
        string username UK
        string password_hash
        string email UK
        string name
        string user_type "system_admin, mold_developer, maker, plant"
        int company_id FK
        string company_name
        string company_type "hq, maker, plant"
        boolean is_active
        datetime last_login
        datetime created_at
        datetime updated_at
    }

    %% Companies 테이블
    companies {
        int id PK
        string company_code UK
        string company_name
        string company_type "hq, maker, plant"
        string business_number
        string representative
        string address
        string phone
        string email
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    %% Molds 테이블
    molds {
        int id PK
        string mold_code UK
        string mold_name
        string qr_token UK
        string status "active, maintenance, ng, storage"
        string car_model
        string part_name
        int cavity
        int current_shots
        int target_shots
        string location
        int company_id FK
        datetime created_at
        datetime updated_at
    }

    %% Mold Specifications 테이블
    mold_specifications {
        int id PK
        int mold_id FK UK
        string part_name
        string car_model
        int cavity_count
        decimal weight
        string material
        string mold_type
        int tonnage
        json dimensions
        string maker_company
        date manufacture_date
        int target_shots
        string storage_location
        text notes
        datetime created_at
        datetime updated_at
    }

    %% QR Sessions 테이블
    qr_sessions {
        int id PK
        string session_token UK
        int user_id FK
        int mold_id FK
        string qr_code
        datetime expires_at
        boolean is_active
        decimal gps_latitude
        decimal gps_longitude
        json device_info
        datetime created_at
        datetime updated_at
    }

    %% Repairs 테이블
    repairs {
        int id PK
        int mold_id FK
        int qr_session_id FK
        string request_number UK
        int requested_by FK
        date request_date
        string issue_type "SHORT_SHOT, FLASH, BURN, CRACK, etc"
        text issue_description
        string severity "low, medium, high, urgent"
        string status "requested, in_progress, completed, confirmed, cancelled"
        datetime started_at
        datetime completed_at
        datetime confirmed_at
        int confirmed_by FK
        text confirm_comment
        json photos
        datetime created_at
        datetime updated_at
    }

    %% Daily Checks 테이블
    daily_checks {
        int id PK
        int mold_id FK
        int user_id FK
        date check_date
        string status "pending, in_progress, completed"
        text notes
        datetime created_at
        datetime updated_at
    }

    %% Daily Check Items 테이블
    daily_check_items {
        int id PK
        int daily_check_id FK
        int check_item_id FK
        string result "ok, ng, na"
        text notes
        datetime created_at
        datetime updated_at
    }

    %% Check Item Master 테이블
    check_item_master {
        int id PK
        string category
        string item_name
        text description
        int order_index
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    %% Daily Check Item Status 테이블
    daily_check_item_status {
        int id PK
        int daily_check_item_id FK
        string status
        text notes
        datetime created_at
    }

    %% Inspections 테이블
    inspections {
        int id PK
        int mold_id FK
        string inspection_type "periodic, special"
        date inspection_date
        string status "scheduled, in_progress, completed"
        text notes
        datetime created_at
        datetime updated_at
    }

    %% Inspection Items 테이블
    inspection_items {
        int id PK
        int inspection_id FK
        string item_name
        string result "ok, ng"
        text notes
        datetime created_at
    }

    %% Inspection Photos 테이블
    inspection_photos {
        int id PK
        int inspection_id FK
        string photo_url
        text description
        datetime created_at
    }

    %% Notifications 테이블
    notifications {
        int id PK
        int user_id FK
        string notification_type "repair_request, repair_status_update, etc"
        string title
        text message
        string priority "low, normal, high, urgent"
        string related_type "repair, mold, inspection"
        int related_id
        string action_url
        boolean is_read
        datetime read_at
        datetime created_at
    }

    %% Transfers 테이블
    transfers {
        int id PK
        int mold_id FK
        int from_company_id FK
        int to_company_id FK
        date transfer_date
        string status "requested, approved, completed"
        text notes
        datetime created_at
        datetime updated_at
    }

    %% Shots 테이블
    shots {
        int id PK
        int mold_id FK
        int shot_count
        date recorded_date
        datetime created_at
    }

    %% Mold Issues 테이블
    mold_issues {
        int id PK
        int mold_id FK
        string issue_type
        text description
        string severity
        string status
        datetime created_at
        datetime resolved_at
    }

    %% Production Quantities 테이블
    production_quantities {
        int id PK
        int mold_id FK
        date production_date
        int quantity
        text notes
        datetime created_at
    }

    %% Mold Development Plans 테이블
    mold_development_plans {
        int id PK
        int mold_id FK
        string plan_name
        date start_date
        date end_date
        string status
        datetime created_at
        datetime updated_at
    }

    %% Mold Process Steps 테이블
    mold_process_steps {
        int id PK
        int plan_id FK
        string step_name
        int order_index
        string status
        date start_date
        date end_date
        datetime created_at
    }

    %% Pre Production Checklists 테이블
    pre_production_checklists {
        int id PK
        int mold_id FK
        string checklist_type
        string status
        json items
        datetime created_at
        datetime updated_at
    }

    %% Checklist Master Templates 테이블
    checklist_master_templates {
        int id PK
        string template_name
        string template_type
        text description
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    %% Checklist Template Items 테이블
    checklist_template_items {
        int id PK
        int template_id FK
        string item_name
        int order_index
        boolean is_required
        datetime created_at
    }

    %% Checklist Template Deployments 테이블
    checklist_template_deployments {
        int id PK
        int template_id FK
        date deployed_date
        string deployed_by
        datetime created_at
    }

    %% Checklist Template History 테이블
    checklist_template_history {
        int id PK
        int template_id FK
        string action
        text changes
        string changed_by
        datetime created_at
    }

    %% Maker Specifications 테이블
    maker_specifications {
        int id PK
        int company_id FK
        json capabilities
        json equipment
        text notes
        datetime created_at
        datetime updated_at
    }

    %% Car Models 테이블
    car_models {
        int id PK
        string model_code UK
        string model_name
        string manufacturer
        boolean is_active
        datetime created_at
    }

    %% Materials 테이블
    materials {
        int id PK
        string material_code UK
        string material_name
        text description
        boolean is_active
        datetime created_at
    }

    %% Mold Types 테이블
    mold_types {
        int id PK
        string type_code UK
        string type_name
        text description
        boolean is_active
        datetime created_at
    }

    %% Tonnages 테이블
    tonnages {
        int id PK
        int tonnage_value UK
        text description
        boolean is_active
        datetime created_at
    }

    %% User Requests 테이블
    user_requests {
        int id PK
        int user_id FK
        string request_type
        text description
        string status
        datetime created_at
        datetime updated_at
    }

    %% GPS Locations 테이블
    gps_locations {
        int id PK
        int mold_id FK
        decimal latitude
        decimal longitude
        datetime recorded_at
        datetime created_at
    }

    %% Alerts 테이블
    alerts {
        int id PK
        string alert_type
        string severity
        text message
        json metadata
        boolean is_resolved
        datetime created_at
        datetime resolved_at
    }

    %% Check Guide Materials 테이블
    check_guide_materials {
        int id PK
        int check_item_id FK
        string material_type "image, video, document"
        string file_url
        text description
        datetime created_at
    }
```

---

## 📋 테이블 그룹별 설명

### 1. 사용자 및 회사 관리
- **users**: 시스템 사용자 (system_admin, mold_developer, maker, plant)
- **companies**: 회사 정보 (본사, 제작처, 생산처)
- **user_requests**: 사용자 요청 사항

### 2. 금형 관리
- **molds**: 금형 마스터 데이터
- **mold_specifications**: 금형 상세 사양
- **mold_issues**: 금형 이슈 관리
- **shots**: 금형 타수 기록
- **production_quantities**: 생산 수량 기록
- **transfers**: 금형 이전 관리

### 3. QR 및 세션
- **qr_sessions**: QR 스캔 세션 관리
- **gps_locations**: GPS 위치 기록

### 4. 수리 관리 ⭐ (최근 구현)
- **repairs**: 수리요청 및 진행 상태 관리
  - 상태: requested → in_progress → completed → confirmed

### 5. 점검 관리
- **daily_checks**: 일상점검
- **daily_check_items**: 점검 항목
- **daily_check_item_status**: 점검 항목 상태
- **check_item_master**: 점검 항목 마스터
- **check_guide_materials**: 점검 가이드 자료

### 6. 정기검사
- **inspections**: 정기검사
- **inspection_items**: 검사 항목
- **inspection_photos**: 검사 사진

### 7. 체크리스트 관리
- **checklist_master_templates**: 체크리스트 템플릿
- **checklist_template_items**: 템플릿 항목
- **checklist_template_deployments**: 템플릿 배포
- **checklist_template_history**: 템플릿 이력
- **pre_production_checklists**: 양산 전 체크리스트

### 8. 금형 개발
- **mold_development_plans**: 개발 계획
- **mold_process_steps**: 공정 단계

### 9. 알림 및 알람
- **notifications**: 사용자 알림
- **alerts**: 시스템 알람

### 10. 마스터 데이터
- **car_models**: 차종 마스터
- **materials**: 재질 마스터
- **mold_types**: 금형 타입 마스터
- **tonnages**: 톤수 마스터
- **maker_specifications**: 제작처 사양

---

## 🔑 주요 관계 (Relationships)

### 1. 사용자 중심
```
users (1) ─── (N) qr_sessions
users (1) ─── (N) repairs (요청자)
users (1) ─── (N) daily_checks
users (1) ─── (N) notifications
users (N) ─── (1) companies
```

### 2. 금형 중심
```
molds (1) ─── (N) qr_sessions
molds (1) ─── (N) repairs
molds (1) ─── (N) daily_checks
molds (1) ─── (N) inspections
molds (1) ─── (N) shots
molds (1) ─── (1) mold_specifications
molds (N) ─── (1) companies (소유)
```

### 3. 수리요청 플로우 ⭐
```
users (요청자) ─── repairs ─── molds
                    │
                    └─── qr_sessions (선택)
```

### 4. 점검 플로우
```
daily_checks ─── daily_check_items ─── check_item_master
                        │
                        └─── daily_check_item_status
```

---

## 📊 주요 비즈니스 플로우

### 1. QR 스캔 → 수리요청
```
1. QR 스캔 → qr_sessions 생성
2. 금형 정보 조회 → molds
3. 수리요청 등록 → repairs (status: requested)
4. 알림 생성 → notifications
```

### 2. 수리 진행
```
1. 제작처 확인 → repairs (status: requested)
2. 수리 시작 → repairs (status: in_progress)
3. 수리 완료 → repairs (status: completed)
4. 확인 완료 → repairs (status: confirmed)
```

### 3. 일상점검
```
1. QR 스캔 → qr_sessions
2. 점검 시작 → daily_checks
3. 항목 체크 → daily_check_items
4. 상태 기록 → daily_check_item_status
```

---

## 🔍 인덱스 권장사항

### 성능 최적화를 위한 인덱스

```sql
-- Users
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_company_id ON users(company_id);

-- Molds
CREATE INDEX idx_molds_status ON molds(status);
CREATE INDEX idx_molds_company_id ON molds(company_id);
CREATE INDEX idx_molds_qr_token ON molds(qr_token);

-- Repairs
CREATE INDEX idx_repairs_status ON repairs(status);
CREATE INDEX idx_repairs_mold_id ON repairs(mold_id);
CREATE INDEX idx_repairs_requested_by ON repairs(requested_by);
CREATE INDEX idx_repairs_created_at ON repairs(created_at);

-- QR Sessions
CREATE INDEX idx_qr_sessions_user_id ON qr_sessions(user_id);
CREATE INDEX idx_qr_sessions_mold_id ON qr_sessions(mold_id);
CREATE INDEX idx_qr_sessions_is_active ON qr_sessions(is_active);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Daily Checks
CREATE INDEX idx_daily_checks_mold_id ON daily_checks(mold_id);
CREATE INDEX idx_daily_checks_check_date ON daily_checks(check_date);
```

---

## 📈 통계 쿼리 예시

### 대시보드 KPI
```sql
-- 전체 금형 수
SELECT COUNT(*) FROM molds;

-- 양산 중 금형
SELECT COUNT(*) FROM molds WHERE status IN ('active', 'in_production');

-- 진행 중 수리요청
SELECT COUNT(*) FROM repairs 
WHERE status NOT IN ('completed', 'confirmed', 'cancelled');

-- 오늘 QR 스캔
SELECT COUNT(*) FROM qr_sessions 
WHERE DATE(created_at) = CURRENT_DATE;
```

---

**작성일**: 2024-12-01  
**버전**: 1.0  
**상태**: ✅ 현재 시스템 ERD
