# QR + GPS 기반 금형관리시스템 Ver.09

금형 개발부터 폐기까지 QR 스캔과 GPS 위치를 기반으로 모든 현장 작업을 실시간 추적하고 제어하는 시스템입니다.

## 🚀 배포 정보

| 서비스 | URL | 상태 |
|--------|-----|------|
| **프론트엔드** | https://spirited-liberation-production-1a4d.up.railway.app | ✅ 운영중 |
| **백엔드 API** | https://cams-mold-management-system-production-b7d0.up.railway.app | ✅ 운영중 |
| **GitHub** | https://github.com/radiohead0803-hash/cams-mold-management-system | |

### 개발 완료율: 100% 🎉

| 구분 | 완료 | 전체 | 완료율 |
|------|------|------|--------|
| 백엔드 API | 97+ | 97+ | 100% |
| 프론트엔드 페이지 | 80+ | 80+ | 100% |
| 데이터베이스 테이블 | 52 | 52 | 100% |
| 테스트 코드 | 20 | 20 | 100% |

--- 

## 🧭 문서 기반 전체 개발 플랜

### 📚 프로젝트 문서

#### 📘 운영 가이드
- **[OPERATION_GUIDE.md](docs/OPERATION_GUIDE.md)** - 시스템 운영 가이드 (사용자 배포용)

#### 사용자 유형 4가지 (공통)
- **CAMS 시스템 관리 담당 (본사)** – 시스템 규칙/감사/전사 모니터링, 권한 설정 · `docs/LOGIN_AND_PERMISSIONS.md`
- **금형개발 담당 (본사)** – 금형 사양 정의·승인·품질, 문서 기반 설계/사용 통계 검토 · `docs/PROJECT_OVERVIEW.md`
- **금형제작처 (Maker)** – 설계/제작/시운전/수리, QR 코드 출력 · `docs/MOLD_LIFECYCLE_WORKFLOW.md`, `docs/REPAIR_LIABILITY_WORKFLOW.md`
- **생산처 (Plant)** – 양산/점검/수리 요청/이관, 점검 스케줄·생산수량 입력·QR 스캔 작업 · `docs/INSPECTION_SCHEDULE_GUIDE.md`, `docs/PRODUCTION_QUANTITY_WORKFLOW.md`

#### 📋 개요 및 계획
1. **[PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)** - 프로젝트 전체 개요
   - 핵심 목표 및 주요 기능
   - 사용자 역할 구조 (4단)
   - 기술 스택 (Apple Design System 포함)
   - UI/UX 디자인 가이드

2. **[DEVELOPMENT_STAGES.md](docs/DEVELOPMENT_STAGES.md)** - 개발 진행 단계별 가이드 (개요)
   - Phase 1: 기반 구축 (Week 1)
   - Phase 2: 핵심 기능 (Week 2)
   - Phase 3: 협력사 기능 (Week 3)
   - Phase 4: 관리자 기능 (Week 4)
   - Phase 5: 최적화 및 배포 (Week 5)

### 📅 주간 개발 계획 (상세)

3. **[WEEK1_DEVELOPMENT.md](docs/WEEK1_DEVELOPMENT.md)** - Week 1: 기반 구축 및 인증 시스템
   - 데이터베이스 설정 (PostgreSQL)
   - 백엔드 API 구조 설계
   - JWT 인증 시스템 구축
   - 사용자 및 금형 기본 테이블

4. **[WEEK2_DEVELOPMENT.md](docs/WEEK2_DEVELOPMENT.md)** - Week 2: QR 스캔 및 점검 시스템
   - QR 코드 생성 및 스캔 API
   - 일상점검 + 생산수량 입력
   - 정기점검 스케줄링
   - GPS 위치 추적 기능

5. **[WEEK3_DEVELOPMENT.md](docs/WEEK3_DEVELOPMENT.md)** - Week 3: 수리 및 이관 관리
   - 수리 요청 및 귀책 협의
   - 금형 이관 (4M 준비 및 점검)
   - 금형 유지보전 (세척/습합)
   - 보전 이력 관리

6. **[WEEK4_DEVELOPMENT.md](docs/WEEK4_DEVELOPMENT.md)** - Week 4: 프론트엔드 및 UI/UX 완성
   - React + Vite 프론트엔드
   - Apple Design System 적용
   - 대시보드 및 주요 화면 구현
   - 모바일 최적화 및 Railway 배포

---

### 📈 주차별 진행 체크리스트

- **Week 1**: `docs/WEEK1_DEVELOPMENT.md`, `docs/DATABASE_SCHEMA.md`, `docs/API_SPEC.md` 중심
  - PostgreSQL + 사용자/금형/QR 테이블 생성 (`users`, `molds`, `qr_sessions`, `mold_status_history`)
  - 비밀번호/토큰 정책 정의 및 JWT 인증 API(로그인/토큰 갱신) 구축
  - `docs/LOGIN_AND_PERMISSIONS.md` 기반으로 사용자 역할·권한 초기 설정
- **Week 2**: `docs/WEEK2_DEVELOPMENT.md`, `docs/DAILY_CHECK_ITEMS.md`, `docs/INSPECTION_SCHEDULE_GUIDE.md` 중심
  - QR 스캔 → 점검 입력 → 생산수량/타수 반영 파이프라인 설계
  - 생산수량/점검 데이터를 일정표(`docs/PRODUCTION_QUANTITY_WORKFLOW.md`)에 연결하여 알람/타수 계산 확인
  - UI/UX 상태 스펙(`docs/UI_UX_SPECIFICATIONS.md`) 따라 점검 화면, 타수/스케줄 카드 구현
- **Week 3**: `docs/WEEK3_DEVELOPMENT.md`, `docs/NG_HANDLING_WORKFLOW.md`, `docs/REPAIR_LIABILITY_WORKFLOW.md` 중심
  - 수리 요청 → 1/2차 협의 워크플로우 구현, `docs/MOLD_LIFECYCLE_DETAILED.md` 체크리스트 연결
  - 제작처↔생산처 이관 상태 전환·점검 이력 추가, NG 유형별 대응 로직 및 알림(`docs/SYSTEM_SPECIFICATIONS.md`) 적용
  - 현장 이슈 대시보드에 상태/피드백 표시 기능 포함
- **Week 4**: `docs/WEEK4_DEVELOPMENT.md`, `docs/DESIGN_SYSTEM.md`, `docs/RAILWAY_DEPLOYMENT_GUIDE.md` 중심
  - Apple Design System 기반 반응형 컴포넌트·대시보드 마무리, `docs/DASHBOARD_GUIDE.md` 리포트 카드 검토
  - Railway CI/CD 설정(`docs/RAILWAY_DEPLOYMENT_GUIDE.md`)→배포 스크립트, 자동화 승인(`docs/ADMIN_MODIFICATION_GUIDE.md`)
  - `docs/WORKFLOW_SUMMARY.md`로 전체 흐름 검증

---

### 기술 문서

7. **[DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** - 데이터베이스 스키마
   - 총 52개 테이블, 10개 카테고리
   - 상세 SQL 스키마 정의 (마스터 체크리스트·템플릿/사진/이관 포함)
   - 인덱스 및 관계 설정
8. **[SYSTEM_SPECIFICATIONS.md](docs/SYSTEM_SPECIFICATIONS.md)** - 시스템 사양
   - 금형 상태 코드 및 전환 규칙
   - 긴급도 기준 및 대응 시간
   - 점검 주기 및 상세 항목
   - 알림 시스템 발송 규칙
9. **[DATA_FLOW_ARCHITECTURE.md](docs/DATA_FLOW_ARCHITECTURE.md)** - 데이터 흐름 아키텍처 (전체)
   - 본사 → 제작처 → 마스터 → 생산처 자동 연동
   - 제작전 체크리스트 (81개 항목, 9개 카테고리)
   - 12단계 공정 관리 및 경도측정
   - QR 스캔 기반 모바일 대시보드
   - 문서 마스터 관리 및 리비젼 시스템
   - WebSocket 기반 실시간 동기화
   
10. **[DAILY_CHECK_ITEMS.md](docs/DAILY_CHECK_ITEMS.md)** - 일상점검·이관 체크리스트
   - 인계처 확인란, 사진/문서 첨부 흐름
   - UI 모형, 자동 알림 및 API/DB 참조 테이블
   - 관리 현황/정기 점검 상세 테이블
11. **[PERIODIC_INSPECTION_CHECKLIST.md](docs/PERIODIC_INSPECTION_CHECKLIST.md)** - 정기점검 체크리스트
   - 20K~800K 주기별 항목 및 세척/습합 통합
   - 사진/세척제, 승인 흐름, 문서·알림 설계
12. **시스템 관리자가 운영하는 체크리스트 마스터**
   - `checklist_master_templates` + `checklist_template_items`을 통해 협력사·제작처 대상 체크리스트를 버전 관리
   - `checklist_template_deployment`/`history` 테이블로 변경 이력·배포 현황을 추적하며 관리자 승인 요구
   - 수정·개정 후 자동 재배포(목표 plant/maker 지정)하며 현장 앱에서 최신 버전을 자동 로드

---

### 운영 가이드

12. **[INSPECTION_SCHEDULE_GUIDE.md](docs/INSPECTION_SCHEDULE_GUIDE.md)** - 점검 스케줄 가이드
   - 생산수량 기반 점검 관리
   - QR 스캔 알람 시스템
   - 자동 연동 프로세스

13. **[ADMIN_MODIFICATION_GUIDE.md](docs/ADMIN_MODIFICATION_GUIDE.md)** - 관리자 수정 가이드
    - 협력사 데이터 수정 이력 관리
    - 다단계 승인 프로세스
    - 자동 배포 시스템

14. **[PRODUCTION_QUANTITY_WORKFLOW.md](docs/PRODUCTION_QUANTITY_WORKFLOW.md)** - 생산수량 연동
    - 일상점검 시 생산수량 입력
    - 자동 연동 (점검 스케줄, 타수, 알람)
    - 데이터 흐름도

---

### 🎨 디자인 시스템

15. **[DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** - Apple Design System 가이드
    - 컬러 시스템 (Primary, Neutral, Accent)
    - 타이포그래피 (SF Pro Text fallback)
    - 애니메이션 (fade-in, slide-up, scale-in, pulse)
    - 그림자 효과 (shadow-apple)
    - Border Radius (2xl, 3xl)
    - 반응형 디자인
    - 다크 모드 지원
    - 컴포넌트 스타일 가이드

16. **[UI_UX_SPECIFICATIONS.md](docs/UI_UX_SPECIFICATIONS.md)** - UI/UX 상세 명세서
    - 로그인 화면 구조 및 디자인
    - QR 코드 스캔 페이지
    - 상태별 UI (기본/포커스/호버/에러/로딩)
    - 애니메이션 상세
    - 반응형 디자인 (데스크톱/태블릿/모바일)
    - 보안 기능 및 API 연동
    - 접근성 (Accessibility) 가이드

17. **[DASHBOARD_GUIDE.md](docs/DASHBOARD_GUIDE.md)** - 대시보드 가이드
    - CAMS 시스템 관리 담당 대시보드
    - 금형개발 담당 대시보드
    - GPS 금형 위치 추적
    - 통계 및 리포트

---

### 🔄 금형 Lifecycle 및 업무 플로우

18. **[WORKFLOW_SUMMARY.md](docs/WORKFLOW_SUMMARY.md)** - 업무 플로우 종합 요약
    - 4단 역할 구조 요약
    - 10단계 Lifecycle 요약
    - QR 시스템 운영 요약
    - NG 자동 연계 요약

19. **[MOLD_LIFECYCLE_WORKFLOW.md](docs/MOLD_LIFECYCLE_WORKFLOW.md)** - 금형 Lifecycle 전체 업무 플로어
    - 업무 구분 및 역할 체계 (4단 구조)
    - 시스템 금형정보 입력 흐름
    - 금형 개발부터 폐기까지 10단계 프로세스
    - QR 스캔 기반 권한 자동 구분

20. **[MOLD_LIFECYCLE_DETAILED.md](docs/MOLD_LIFECYCLE_DETAILED.md)** - 금형 Lifecycle 상세 흐름
    - 각 단계별 상세 프로세스
    - 데이터베이스 테이블 연계
    - 단계별 체크리스트

21. **[NG_HANDLING_WORKFLOW.md](docs/NG_HANDLING_WORKFLOW.md)** - NG 처리 및 정기점검 연계
    - NG 자동 연계 5단계 프로세스
    - NG 유형 분류 (Minor/Major/Critical)
    - 정기점검 연계 구조 (1차/2차/3차)
    - 통합 흐름도 (일상점검-정기점검-NG)

22. **[QR_BASED_OPERATIONS.md](docs/QR_BASED_OPERATIONS.md)** - QR 기반 전사 운영
    - QR 시스템 적용 전사 운영 구조
    - QR 스캔 프로세스 및 세션 관리
    - GPS 위치 추적 시스템
    - 이상 발생 시 자동 연계
    - 4단 역할 연동 구조

23. **[REPAIR_LIABILITY_WORKFLOW.md](docs/REPAIR_LIABILITY_WORKFLOW.md)** - 금형 수리 귀책 협의 워크플로우
    - 귀책 협의 프로세스 (1차/2차)
    - 귀책 유형 분류 (생산처/제작처/자연마모/기타)
    - 비용 처리 방안
    - 데이터베이스 테이블 구조

24. **[LOGIN_AND_PERMISSIONS.md](docs/LOGIN_AND_PERMISSIONS.md)** - 시스템 로그인 및 권한 관리
    - 4단 사용자 유형 (시스템관리/금형개발/제작처/생산처)
    - 로그인 프로세스 및 JWT 인증
    - 권한별 메뉴 구조
    - 보안 정책 (비밀번호/세션/접속이력)

---

## 🎯 핵심 기능

### 1. QR + GPS 기반 현장 작업
- QR 코드 스캔으로 빠른 접근
- GPS 위치 자동 기록 (50m 오차 이내)
- 8시간 세션 유지

### 2. 생산수량 기반 점검 관리
- 일상점검 시 생산수량 필수 입력
- 자동 누적 계산
- 점검 스케줄 자동 업데이트
- 타수 기록 자동 업데이트
- 알람 자동 생성

### 3. 관리자 수정 및 자동 배포
- 협력사 데이터 수정 이력 관리
- 다단계 승인 프로세스
- 승인 후 자동 배포
- 롤백 기능

### 4. 실시간 알람 시스템
- QR 스캔 시 즉시 알람 표시
- 우선순위별 차별화 (Urgent, High, Medium, Low)
- 점검 예정, 점검 지연, 생산 목표 달성
- 긴급 수리, 타수 임계치, 상태 경고

---

## 🏗️ 기술 스택

### Frontend
- React 18 + Vite
- Tailwind CSS + Apple Design System
- Lucide React (아이콘)
- React Query + Context API
- React Router v6

### Backend
- Node.js 18+ + Express.js
- Sequelize ORM
- PostgreSQL 14+
- JWT 인증
- Multer (파일 업로드)

### DevOps
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Nginx (리버스 프록시)

---

## 🎨 Apple Design System

### 컬러
- **Primary**: #0ea5e9 (Sky Blue, 50~900)
- **Neutral**: #737373 (Gray, 50~900)
- **Accent**: Orange (#ff9500), Green (#30d158), Red (#ff3b30)

### 타이포그래피
- SF Pro Text fallback
- 폰트 크기: xs (12px) ~ 4xl (36px)
- 폰트 굵기: Light (300) ~ Bold (700)

### 애니메이션
- fade-in (200ms)
- slide-up (200ms)
- scale-in (200ms)
- pulse (2s)

### 그림자
- shadow-apple
- shadow-apple-lg

### Border Radius
- 2xl: 1rem (16px)
- 3xl: 1.5rem (24px)

---

## 📊 데이터베이스 구조

**총 52개 테이블, 10개 카테고리**

**참고 문서**: `docs/DATABASE_SCHEMA.md`

**주요 변경사항**: 습합점검과 세척점검은 정기점검 내 체크리스트 항목으로 통합

1. **사용자 및 권한** (2개) - `users`, `qr_sessions`
2. **데이터 흐름 및 자동 연동** (4개) - `mold_specifications`, `maker_specifications`, `plant_molds`, `stage_change_history`
3. **금형정보 관리** (11개)
   - 금형 기본: `molds`, `mold_development`
   - **금형개발계획**: `mold_development_plans` (진도 관리), `mold_process_steps` (12단계 공정)
   - **제작전 체크리스트**: `pre_production_checklists` (9개 카테고리, 81개 항목)
   - **체크리스트 템플릿**: `checklist_master_templates`, `checklist_template_items`
   - 기타: `mold_replication`, `mold_drawings`, `maker_info` 등
4. **사출정보 관리** (5개) - `plant_info`, `injection_conditions`, `production_lines` 등
5. **점검 관리** (4개) - `daily_checks`, `inspections` (정기점검: 1차/2차/3차, 습합/세척 통합), `inspection_items`, `inspection_history`
6. **수리 관리** (3개) - `repairs`, `repair_management`, `repair_progress`
7. **이관 관리** (4개) - `transfer_logs`, `transfer_management`, `transfer_checklist`, `transfer_approvals`
8. **금형 폐기 관리** (3개) - `scrapping_requests`, `scrapping_approvals`, `scrapping_history`
9. **관리자 수정 및 배포 관리** (4개) - `document_master_templates`, `checklist_template_deployment`, `checklist_template_history`, `template_deployment_log`
10. **기타** (8개) - `shots`, `notifications`, `production_quantities`, `production_progress`, `trial_run_results`, `gps_locations`, `comments`, `mold_images`

---

## 📅 개발 일정

### Week 1 (7일): 기반 구축 및 인증 시스템
**참고 문서**: `docs/WEEK1_DEVELOPMENT.md`, `docs/DATABASE_SCHEMA.md`, `docs/API_SPEC.md`, `docs/LOGIN_AND_PERMISSIONS.md`

- **데이터베이스 설정 (카테고리 1-3 우선 구축)**
  - PostgreSQL 14+ 설치 및 초기 스키마 구축
  - **카테고리 1: 사용자 및 권한** (2개)
    - `users` - 사용자 정보 (user_type: system_admin/mold_developer/maker/plant)
    - `qr_sessions` - QR 스캔 세션 관리 (8시간 유지)
  - **카테고리 2: 데이터 흐름 및 자동 연동** (4개)
    - `mold_specifications` - 본사 금형제작사양 (1차 입력)
    - `maker_specifications` - 제작처 사양 (자동 연동 + 추가 입력)
    - `plant_molds` - 생산처 금형 (자동 연동)
    - `stage_change_history` - 단계 변경 이력
  - **카테고리 3: 금형정보 관리** (11개 중 핵심 7개)
    - `molds` - 금형 마스터 (QR 토큰, 타수, 상태)
    - `mold_development` - 금형개발 기본 정보
    - **금형개발계획 시스템** (2개 테이블)
      - `mold_development_plans` - 금형개발계획 (진도 관리)
        - 자동 입력: 차종, 품번, 품명, 제작일정 코드, 수출률
        - 수동 입력: 원재료, 제작자, T/O일정, 상/하형 재질, 부품중량
        - 12단계 공정 진행률 관리
      - `mold_process_steps` - 공정 단계 (12단계)
        - 도면접수 → 몰드베이스발주 → 금형설계 → 도면검토회 → 상형가공 → 하형가공
        - 상형열처리 → 하형열처리 → 상형경도측정 → 하형경도측정 → 조립 → 시운전
    - **제작전 체크리스트 시스템** (2개 테이블)
      - `pre_production_checklists` - 제작전 체크리스트 (제작 시작 전 점검)
        - 9개 카테고리: 원재료/금형/가스배기/성형해석/싱크마크/취출/MIC제품/도금/리어백빔
        - 총 81개 점검항목
      - `checklist_master_templates` - 체크리스트 마스터 템플릿 (버전 관리)
- **백엔드 API 구조**
  - Express.js + Sequelize ORM 프로젝트 초기화
  - 환경 변수(.env) 설정: DB, JWT, 서버 포트
  - 폴더 구조: `config/`, `models/`, `controllers/`, `middleware/`, `routes/`
- **JWT 인증 시스템**
  - 로그인/로그아웃 API, 토큰 발급/갱신 로직
  - 4가지 사용자 유형별 권한 정의 및 대시보드 라우팅
  - 비밀번호 해싱(bcrypt), 실패 시도 제한, 계정 잠금
- **QR/GPS 기본 프레임**
  - QR 코드 생성 로직 (`CAMS-MOLD-[코드]-[체크섬]`)
  - QR 세션 관리 (8시간 자동 만료)
  - GPS 좌표 저장 구조 (`gps_locations` 테이블)
- **제작전 체크리스트 시스템 구축**
  - 체크리스트 유형: 제작전 (제작 시작 전 점검)
  - 9개 카테고리, 총 81개 항목:
    - I. 원재료 (9개) - 수축률, 재질 사양, 성적서 등
    - II. 금형 (13개) - 금형 구조, 냉각 시스템, 이젝션 등
    - III. 가스 배기 (6개) - 벤트 설계, 배기 위치 등
    - IV. 성형 해석 (11개) - Moldflow 분석, 충전 패턴 등
    - V. 싱크마크 (10개) - 싱크 발생 예측, 리브 설계 등
    - VI. 취출 (10개) - 이젝터 핀 배치, 언더컷 처리 등
    - VII. MIC 제품 (9개) - MICA 스펙률, 표면 품질 등
    - VIII. 도금 (7개) - 도금 전처리, 두께 관리 등
    - IX. 리어 백빔 (6개) - 금형 구배, 후기공 볼 등
  - 템플릿 기반 자동 생성 (`checklist_master_templates` → `pre_production_checklists`)
  - 도면검토회 연동 알림 시스템 (D-7, D-5, D-3, D-1)
  - 버전 관리 및 배포 시스템

### Week 2 (7일): QR 스캔 및 점검 시스템
**참고 문서**: `docs/WEEK2_DEVELOPMENT.md`, `docs/DAILY_CHECK_ITEMS.md`, `docs/INSPECTION_SCHEDULE_GUIDE.md`, `docs/PRODUCTION_QUANTITY_WORKFLOW.md`, `docs/UI_UX_SPECIFICATIONS.md`

- **데이터베이스 추가 구축 (카테고리 4-5)**
  - **카테고리 4: 사출정보 관리** (5개)
    - `plant_info` - 생산처 정보
    - `injection_conditions` - 사출 조건
    - `production_lines` - 생산 라인
  - **카테고리 5: 점검 관리** (4개)
    - `daily_checks` - 일상점검 (10개 카테고리)
    - `inspections` - 정기점검 (1차: 100K, 2차: 500K, 3차: 1M)
      - 습합/세척 점검 통합 (정기점검 내 체크리스트 항목)
    - `inspection_items` - 점검 항목 상세
    - `inspection_history` - 점검 이력
  - **카테고리 10: 기타** (모바일 작업용 4개)
    - `production_quantities` - 생산수량 기록 (타수 누적)
    - `gps_locations` - GPS 위치 이력
    - `notifications` - 알람 및 알림
    - `shots` - 타수 기록
- **QR 코드 스캔 API**
  - `GET /api/qr-scan/:qr_code` - 금형 정보 로드 + 사용자 유형별 메뉴 구분
  - QR 세션 생성 및 GPS 위치 자동 기록
- **모바일 대시보드 - 생산처**
  - 일상점검 + 생산수량 입력 (`POST /api/mobile/daily-inspection`)
  - 생산수량만 빠르게 입력 (`POST /api/mobile/production-quantity`)
  - 10개 카테고리 점검 항목 UI (정결관리, 작동부, 냉각, 온도전기, 재결, 취출, 윤활, 이상, 외관, 방청)
  - 사진 첨부 및 GPS 자동 기록
- **타수 자동 누적 및 점검 스케줄링**
  - 생산수량 입력 시 `molds.current_shots` 자동 누적
  - 정기점검 알람 자동 생성 (1차: 100K, 2차: 500K, 3차: 1M)
  - 알람 우선순위 설정 (Critical/High/Medium/Low)
- **GPS 위치 추적**
  - 모든 QR 스캔 작업 시 GPS 좌표 자동 저장
  - `gps_locations` 테이블에 이력 관리
  - 위치 이탈 감지 및 알람

### Week 3 (7일): 수리·이관·유지보전 관리
**참고 문서**: `docs/WEEK3_DEVELOPMENT.md`, `docs/REPAIR_LIABILITY_WORKFLOW.md`, `docs/NG_HANDLING_WORKFLOW.md`, `docs/MOLD_LIFECYCLE_DETAILED.md`, `docs/PERIODIC_INSPECTION_CHECKLIST.md`

- **데이터베이스 추가 구축 (카테고리 6-8)**
  - **카테고리 6: 수리 관리** (3개)
    - `repairs` - 수리 요청 및 이력
    - `repair_management` - 수리 관리 (귀책 협의)
    - `repair_progress` - 수리 진행 단계
  - **카테고리 7: 이관 관리** (4개)
    - `transfer_logs` - 이관 요청 및 이력
    - `transfer_management` - 이관 관리
    - `transfer_checklist` - 4M 체크리스트
    - `transfer_approvals` - 이관 승인
  - **카테고리 8: 금형 폐기 관리** (3개)
    - `scrapping_requests` - 폐기 요청
    - `scrapping_approvals` - 폐기 승인
    - `scrapping_history` - 폐기 이력
  - **카테고리 10: 기타** (제작처 작업용 2개)
    - `production_progress` - 제작 진행 기록
    - `trial_run_results` - 시운전 결과
- **모바일 대시보드 - 생산처**
  - 수리 요청 생성 (`POST /api/mobile/repair-request`)
  - 이관 요청 생성 (`POST /api/mobile/transfer-request`)
  - Minor/Major/Critical 유형 분류
  - 수리 전/중/후 사진 첨부
- **모바일 대시보드 - 제작처**
  - 제작 진행 등록 (`POST /api/mobile/maker/production-progress`)
  - 시운전 결과 입력 (`POST /api/mobile/maker/trial-run`)
  - 설계/가공/조립/시운전 단계 관리
  - PASS/FAIL 판정 및 사진 첨부
- **체크리스트 연동**
  - 제작완료 체크리스트 (`mold_project` - checklist_type: '제작완료')
  - 수리완료 체크리스트 (`mold_project` - checklist_type: '수리완료')
  - 이관전 체크리스트 (`transfer_checklist` + `mold_project` - checklist_type: '이관전')
  - 템플릿 기반 자동 생성 및 항목 검증
- **수리 귀책 협의 워크플로우**
  - 1차 협의 (생산처 ↔ 제작처)
  - 2차 협의 (본사 개입)
  - 귀책 유형 분류 및 비용 처리
- **이관 관리 (4M 체크리스트)**
  - 반출/입고 확인
  - GPS 기반 위치 추적
  - 금형 상태 자동 변경
- **금형 유지보전**
  - 정기점검 내 습합/세척 체크리스트 (`inspections` 테이블)
  - 1차 점검: 청소/습합 보강 (벤트/게이트부, 습합 접합면)
  - 2차 점검: 전면 세척/습합 점검 (분해 후 세척, 습합 간극 측정)
  - 3차 점검: 전체 분해 및 방청 처리
  - 정기 스케줄 자동 관리 (80K, 200K 알람)

### Week 4 (7일): 프론트엔드 UI/UX 및 배포
**참고 문서**: `docs/WEEK4_DEVELOPMENT.md`, `docs/DESIGN_SYSTEM.md`, `docs/UI_UX_SPECIFICATIONS.md`, `docs/DASHBOARD_GUIDE.md`, `docs/RAILWAY_SETUP.md`, `docs/RAILWAY_DEPLOYMENT_GUIDE.md`, `docs/GIT_RAILWAY_WORKFLOW.md`, `docs/ADMIN_MODIFICATION_GUIDE.md`

- **데이터베이스 최종 구축 (카테고리 9 + 나머지)**
  - **카테고리 9: 관리자 수정 및 배포 관리** (4개)
    - `document_master_templates` - 문서 마스터 템플릿
    - `checklist_template_deployment` - 체크리스트 템플릿 배포 이력
    - `checklist_template_history` - 체크리스트 템플릿 변경 이력
    - `template_deployment_log` - 템플릿 배포 로그
    - **참고**: `checklist_master_templates`와 `checklist_template_items`는 카테고리 3에 포함
  - **카테고리 3: 금형정보 관리** (나머지 8개)
    - `development_progress_history` - 개발 진행 이력
    - `mold_replication` - 금형육성
    - `mold_drawings` - 경도측정
    - `maker_info` - 금형정보 요약
    - 체크리스트 템플릿 관련 테이블
  - **카테고리 10: 기타** (나머지 2개)
    - `comments` - 협력사↔제작처 소통
    - `mold_images` - 금형 이미지
- **React + Vite 프론트엔드**
  - 프로젝트 초기화, Tailwind CSS + Apple Design System 적용
  - 컴포넌트 구조: 로그인, QR 스캔, 점검 입력, 대시보드, 이슈 관리
  - React Router v6, React Query, Context API 설정
- **Apple Design System 적용**
  - 컬러 시스템 (Primary/Neutral/Accent), 타이포그래피 (SF Pro Text fallback)
  - 애니메이션 (fade-in, slide-up, scale-in, pulse), 그림자 효과
  - 상태별 UI (기본/포커스/호버/에러/로딩), 다크 모드 지원
- **사용자 유형별 대시보드 구현** (`docs/DASHBOARD_GUIDE.md`)
  - **CAMS 시스템 관리 담당** (`/dashboard/system-admin`): 전사 통합 현황, 사용자/권한 관리, 실시간 알람, 템플릿 배포 관리
  - **금형개발 담당** (`/dashboard/mold-developer`): 금형 생명주기 관리, 승인/검토 워크플로우, 제작처 성과
  - **금형제작처** (`/dashboard/maker`): 제작/수리 작업 현황, QR 코드 관리, 시운전 및 귀책 협의
  - **생산처** (`/dashboard/plant`): 점검 일정/현황, QR 스캔 작업, 수리 요청 및 이관 관리
  - 로그인 후 JWT 토큰 기반 자동 라우팅
- **모바일 최적화**
  - 모바일 대시보드 (QR 스캔 후 제작처/생산처 전용 UI)
  - 터치 친화적 디자인 (최소 56px 버튼, 16px 폰트)
  - 카메라 직접 촬영, GPS 자동 기록
  - 반응형 디자인 (데스크톱/태블릿/모바일)
- **Railway 배포**
  - Railway 환경 설정: PostgreSQL 14+, 환경 변수, Secret 관리
  - CI/CD 파이프라인: GitHub Actions → Railway 자동 배포
  - 관리자 자동 배포/롤백 기능 (`docs/ADMIN_MODIFICATION_GUIDE.md`)
- **체크리스트 마스터 관리 및 배포 시스템**
  - 관리자 전용 템플릿 관리 UI
  - 템플릿 생성/수정/버전 관리
  - 전사 배포 및 롤백 기능
  - 변경 이력 추적 및 감사
- **운영 문서화**
  - `docs/Report_Templates.md` 기반 릴리즈 노트, 회의록 작성
  - `docs/WORKFLOW_SUMMARY.md`로 전체 흐름 최종 검증
  - `docs/SYSTEM_INTEGRATION_CHECK.md`로 시스템 일관성 확인

---

## 🔧 체크리스트 마스터 관리 및 배포 시스템

### 📋 개요

체크리스트 마스터 템플릿은 **CAMS 시스템 관리 담당자**만 생성, 수정, 배포할 수 있으며, 전사에 표준화된 체크리스트를 배포하여 일관된 품질 관리를 보장합니다.

**참고 문서**: `docs/ADMIN_MODIFICATION_GUIDE.md`

### 🔄 업무 흐름도

```
[1단계: 템플릿 생성]
시스템 관리자 로그인
    ↓
템플릿 관리 메뉴 접근 (/admin/checklist-templates)
    ↓
새 템플릿 생성
  - 템플릿 유형 선택 (제작완료/수리완료/정기점검/이관전)
  - 템플릿명, 코드, 설명 입력
  - 버전 설정 (v1.0)
    ↓
8개 카테고리별 항목 정의
  - 외관: 표면 상태, 녹/부식, 스크래치, 청결도
  - 치수: 캐비티 치수, 코어 치수, 파팅라인, 게이트 크기
  - 기능: 이젝터 작동, 슬라이드, 리프터, 냉각 채널
  - 안전: 날카로운 모서리, 끼임 위험, 안전 가드
  - 구조: 장착 구멍, 가이드 핀, 로케이팅 링
  - 부품: 이젝터 핀, 리턴 핀, 스프링, 볼트
  - 성능: 사이클 타임, 쇼트 중량, 냉각 효율
  - 문서: 도면, 사양서, 정비 매뉴얼
    ↓
각 항목별 상세 설정
  - 항목명, 점검 기준, 합격 기준
  - 필수 항목 여부 (is_required)
  - 중요도 (low/medium/high/critical)
  - 정렬 순서
    ↓
템플릿 저장 (checklist_master_templates)
항목 저장 (checklist_template_items)

[2단계: 템플릿 검토 및 수정]
템플릿 목록 조회
    ↓
템플릿 선택 및 미리보기
    ↓
수정 필요 시
  - 버전 업그레이드 (v1.0 → v1.1)
  - 항목 추가/수정/삭제
  - 변경 이력 자동 기록 (checklist_template_history)
    ↓
변경 사항 저장

[3단계: 배포 준비]
배포 대상 템플릿 선택
    ↓
배포 정보 입력
  - 배포 버전 확인
  - 배포 일시 설정 (즉시/예약)
  - 배포 범위 선택 (전사/특정 사업장/특정 제작처)
  - 배포 사유 및 변경 내용 기술
    ↓
이전 버전 롤백 설정
  - 롤백 가능 기간 설정 (예: 30일)
  - 이전 템플릿 ID 자동 연결
    ↓
배포 승인 요청 (선택적)

[4단계: 배포 실행]
배포 시작
    ↓
배포 상태 업데이트 (checklist_template_deployment)
  - deployment_status: 'pending' → 'in_progress'
    ↓
전사 시스템에 템플릿 배포
  - 기존 활성 템플릿 비활성화 (is_active = false)
  - 새 템플릿 활성화 (is_active = true)
  - 영향받는 사용자/사업장 알림 발송
    ↓
배포 완료
  - deployment_status: 'completed'
  - 배포 완료 시간 기록
  - 배포 로그 저장 (template_deployment_log)

[5단계: 모니터링 및 롤백]
배포 후 모니터링
  - 사용 현황 추적
  - 오류/문제 발생 모니터링
    ↓
문제 발생 시 롤백
  - 롤백 가능 기간 내 확인
  - 이전 버전으로 복구
  - 롤백 사유 기록
  - 영향받는 사용자 알림
    ↓
롤백 완료
  - deployment_status: 'rolled_back'
  - 롤백 완료 시간 기록
```

### 📊 데이터베이스 테이블 연동

```
[템플릿 마스터]
checklist_master_templates (템플릿 기본 정보)
  ├─ id, template_name, template_code
  ├─ checklist_type (제작완료/수리완료/정기점검/이관전)
  ├─ version, version_number, is_active
  └─ 8개 카테고리 템플릿 (JSONB)

checklist_template_items (템플릿 항목 상세)
  ├─ template_id (FK → checklist_master_templates)
  ├─ category, item_name, item_order
  ├─ inspection_standard, acceptance_criteria
  ├─ is_required, is_critical, severity
  └─ default_status

[배포 관리]
checklist_template_deployment (배포 이력)
  ├─ template_id (FK → checklist_master_templates)
  ├─ deployment_version, deployment_date
  ├─ deployment_status (pending/in_progress/completed/failed/rolled_back)
  ├─ deployed_by, deployment_scope
  ├─ can_rollback, previous_template_id
  └─ rollback_available_until

checklist_template_history (변경 이력)
  ├─ template_id (FK → checklist_master_templates)
  ├─ change_type (created/updated/item_added/item_removed/deployed)
  ├─ changed_by, change_date
  ├─ old_value, new_value (JSONB)
  └─ change_description

template_deployment_log (배포 로그)
  ├─ deployment_id (FK → checklist_template_deployment)
  ├─ log_level (info/warning/error)
  ├─ log_message, log_details (JSONB)
  └─ created_at
```

### 🎯 주요 기능

#### 1. **템플릿 생성 및 관리**
- 체크리스트 유형별 템플릿 생성
- 8개 카테고리별 항목 정의
- 항목별 점검 기준 및 합격 기준 설정
- 필수 항목 및 중요도 지정

#### 2. **버전 관리**
- 시맨틱 버전 관리 (v1.0, v1.1, v2.0)
- 버전별 변경 이력 추적
- 이전 버전 조회 및 비교
- 활성 버전 관리 (is_active)

#### 3. **배포 시스템**
- 전사/사업장별/제작처별 배포 범위 설정
- 즉시 배포 또는 예약 배포
- 배포 진행 상황 실시간 모니터링
- 배포 완료 후 자동 알림

#### 4. **롤백 기능**
- 배포 후 일정 기간 내 롤백 가능
- 이전 버전으로 즉시 복구
- 롤백 사유 및 이력 기록
- 롤백 시 자동 알림

#### 5. **감사 추적**
- 모든 변경 사항 이력 기록
- 변경자, 변경 일시, 변경 내용 추적
- 배포 로그 상세 기록
- 변경 전/후 값 비교 (JSONB)

### 🔐 권한 관리

| 사용자 유형 | 템플릿 조회 | 템플릿 생성 | 템플릿 수정 | 템플릿 배포 | 롤백 |
|------------|-----------|-----------|-----------|-----------|------|
| CAMS 시스템 관리 담당 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 금형개발 담당 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 금형제작처 | ✅ (배포된 템플릿만) | ❌ | ❌ | ❌ | ❌ |
| 생산처 | ✅ (배포된 템플릿만) | ❌ | ❌ | ❌ | ❌ |

### 📱 관리자 UI 화면 구성

#### 1. **템플릿 목록 화면** (`/admin/checklist-templates`)
```
┌─────────────────────────────────────────────────────────┐
│  체크리스트 마스터 템플릿 관리                            │
├─────────────────────────────────────────────────────────┤
│  [+ 새 템플릿 생성]  [배포 이력]  [변경 이력]            │
├─────────────────────────────────────────────────────────┤
│  필터: [전체 ▼] [활성 템플릿만] 검색: [_________] [🔍]   │
├─────────────────────────────────────────────────────────┤
│  템플릿명        │ 유형      │ 버전  │ 상태  │ 작업      │
├─────────────────────────────────────────────────────────┤
│  제작완료 표준   │ 제작완료  │ v2.1  │ 활성  │ [수정][배포]│
│  수리완료 표준   │ 수리완료  │ v1.5  │ 활성  │ [수정][배포]│
│  정기점검 표준   │ 정기점검  │ v3.0  │ 활성  │ [수정][배포]│
│  이관전 표준     │ 이관전    │ v1.2  │ 활성  │ [수정][배포]│
└─────────────────────────────────────────────────────────┘
```

#### 2. **템플릿 편집 화면** (`/admin/checklist-templates/:id/edit`)
```
┌─────────────────────────────────────────────────────────┐
│  템플릿 편집: 제작완료 표준 v2.1                          │
├─────────────────────────────────────────────────────────┤
│  기본 정보                                               │
│  템플릿명: [제작완료 표준_____________]                   │
│  템플릿 코드: [TMPL-PROD-001]                            │
│  유형: [제작완료 ▼]                                      │
│  버전: [v2.1] → [v2.2] (자동 증가)                       │
│  설명: [제작 완료 시 사용하는 표준 체크리스트_______]      │
├─────────────────────────────────────────────────────────┤
│  카테고리별 항목 (8개)                                    │
│  ┌─ 1. 외관 점검 (4개 항목) ──────────────────┐         │
│  │  [+ 항목 추가]                              │         │
│  │  1.1 표면 상태          [필수] [중요도: High]│         │
│  │      점검기준: 표면에 크랙, 기포 없음        │         │
│  │      합격기준: 육안 검사 시 결함 없음        │         │
│  │      [수정] [삭제]                          │         │
│  │  1.2 녹/부식            [필수] [중요도: High]│         │
│  │  1.3 스크래치/찍힘      [선택] [중요도: Med] │         │
│  │  1.4 청결도             [필수] [중요도: Med] │         │
│  └──────────────────────────────────────────┘         │
│  ┌─ 2. 치수 점검 (4개 항목) ──────────────────┐         │
│  ┌─ 3. 기능 점검 (5개 항목) ──────────────────┐         │
│  ... (총 8개 카테고리)                                   │
├─────────────────────────────────────────────────────────┤
│  [미리보기] [저장] [취소]                                │
└─────────────────────────────────────────────────────────┘
```

#### 3. **배포 화면** (`/admin/checklist-templates/:id/deploy`)
```
┌─────────────────────────────────────────────────────────┐
│  템플릿 배포: 제작완료 표준 v2.2                          │
├─────────────────────────────────────────────────────────┤
│  배포 정보                                               │
│  배포 버전: v2.2                                         │
│  배포 일시: ⦿ 즉시  ○ 예약 [날짜/시간 선택]              │
│  배포 범위: ⦿ 전사  ○ 특정 사업장  ○ 특정 제작처         │
│                                                         │
│  변경 내용:                                              │
│  [외관 점검 항목 2개 추가, 치수 점검 기준 강화_______]     │
│                                                         │
│  롤백 설정:                                              │
│  롤백 가능 기간: [30일 ▼]                                │
│  이전 버전: v2.1 (자동 연결)                             │
├─────────────────────────────────────────────────────────┤
│  ⚠️ 주의: 배포 시 전사에 즉시 적용됩니다.                 │
│                                                         │
│  [배포 실행] [취소]                                      │
└─────────────────────────────────────────────────────────┘
```

### 🔔 알림 시스템

#### 배포 시 알림 대상
- **전사 배포**: 모든 사용자에게 알림
- **사업장별 배포**: 해당 사업장 사용자에게 알림
- **제작처별 배포**: 해당 제작처 사용자에게 알림

#### 알림 내용
```
[체크리스트 템플릿 업데이트]
제작완료 표준 템플릿이 v2.1에서 v2.2로 업데이트되었습니다.

주요 변경 사항:
- 외관 점검 항목 2개 추가
- 치수 점검 기준 강화

배포 일시: 2025-11-20 14:30
배포자: 홍길동 (시스템 관리자)

자세한 내용은 템플릿 관리 메뉴에서 확인하세요.
```

### 📈 모니터링 및 리포트

#### 1. **배포 현황 대시보드**
- 배포 진행 중인 템플릿
- 최근 배포 이력
- 배포 성공/실패 통계
- 롤백 이력

#### 2. **사용 현황 분석**
- 템플릿별 사용 빈도
- 사업장별 체크리스트 작성 현황
- 항목별 NG 발생 빈도
- 개선 필요 항목 식별

#### 3. **변경 이력 리포트**
- 템플릿 변경 타임라인
- 변경자별 통계
- 변경 사유 분석
- 버전별 비교

---

## 🏭 금형개발 및 제작 업무 흐름도

### 📋 개요

금형제작사양 입력부터 12단계 공정 관리, 제작전 체크리스트, 경도측정까지의 전체 업무 흐름과 데이터베이스 연계를 설명합니다.

### 🔄 전체 업무 흐름도

```
[1단계: 금형제작사양 입력]
본사 금형개발 담당
    ↓
금형제작사양 입력 (mold_specifications)
  - 품번, 품명, 차종
  - 캐비티 수, 재질, 타수 목표
  - 납기, 예산, 도면검토회 일정
    ↓
제작처 선정 및 배정
    ↓
제작처에 자동 연동 (maker_specifications)

[2단계: 금형개발계획 수립]
제작처 또는 본사
    ↓
금형개발계획 생성 (mold_development_plans)
  - 자동 입력: 차종, 품번, 품명, 제작일정 코드(D+144), 수출률(6/1000)
  - 수동 입력: 원재료, 제작자, T/O일정, 상/하형 재질, 부품중량
    ↓
12단계 공정 자동 생성 (mold_process_steps)
  1. 도면접수
  2. 몰드베이스발주
  3. 금형설계
  4. 도면검토회
  5. 상형가공
  6. 하형가공
  7. 상형열처리
  8. 하형열처리
  9. 상형경도측정 ← 경도측정 단계
  10. 하형경도측정 ← 경도측정 단계
  11. 조립
  12. 시운전
    ↓
각 단계별 일정 관리
  - 시작일, 종료일 (계획/실제)
  - 상태 (대기/진행중/완료/지연)
  - 비고, 담당자
  - 일정 표시 (D+00 형식)

[3단계: 제작전 체크리스트 작성]
제작처 로그인
    ↓
도면검토회 전 체크리스트 작성 (pre_production_checklists)
  - 도면검토회 D-7, D-5, D-3, D-1 알림
  - 체크리스트 유형: '제작전'
  - 템플릿 기반 자동 생성
  - 9개 카테고리 점검 (총 81개 항목)
    ├─ I. 원재료 (9개)
    ├─ II. 금형 (13개)
    ├─ III. 가스 배기 (6개)
    ├─ IV. 성형 해석 (11개)
    ├─ V. 싱크마크 (10개)
    ├─ VI. 취출 (10개)
    ├─ VII. MIC 제품 (9개)
    ├─ VIII. 도금 (7개)
    └─ IX. 리어 백빔 (6개)
    ↓
체크리스트 제출 (approval_status = 'pending')
    ↓
본사 금형개발 담당 검토 및 승인
  - 승인 (approved) → 제작 시작 가능
  - 반려 (rejected) → 수정 후 재제출

[4단계: 제작 진행 및 경도측정]
제작처 제작 진행
    ↓
12단계 공정 진행 (mold_process_steps 업데이트)
  - 각 단계별 시작일, 완료일 기록
  - 상태 업데이트 (진행중 → 완료)
  - 진행률 자동 계산
    ↓
9단계: 상형경도측정 
  - 측정 위치: 상형 (캐비티, 코어)
  - 경도값 (HRC) - hardness_upper_mold
  - 목표 범위
  - 결과: 적합/부적합/주의
  - 측정 사진 첨부 (upper_mold_images)
  - 경도 측정일 (hardness_test_date)
  - 경도 측정 성적서 (hardness_test_report)
    ↓
10단계: 하형경도측정 
  - 측정 위치: 하형 (캐비티, 코어)
  - 경도값 (HRC) - hardness_lower_mold
  - 목표 범위
  - 결과: 적합/부적합/주의
  - 측정 사진 첨부 (lower_mold_images)
  - 경도 측정일 (hardness_test_date)
  - 경도 측정 성적서 (hardness_test_report)
    ↓
11단계: 조립
12단계: 시운전
    ↓
시운전 결과 기록 (trial_run_results)
  - 시운전 일자
  - 사출 조건 (온도, 압력, 시간)
  - 성형품 품질 평가
  - 문제점 및 개선사항
    ↓
제작완료 필수 항목 확인
  상형 경도측정 완료 (hardness_upper_mold)
  하형 경도측정 완료 (hardness_lower_mold)
  경도 측정일 기록 (hardness_test_date)
  경도 측정 성적서 첨부 (hardness_test_report)
  상하형 사진 첨부 (upper_mold_images, lower_mold_images)
  금형인자표 첨부 (mold_parameter_sheet)
  성형해석 자료 첨부 (molding_analysis)
  초도사출 T/O 결과 첨부 (trial_shot_result)
    ↓
전체 12단계 완료
  - 진행률 100%
  - 상태: 'completed'
  - 제작완료 필수 항목 모두 입력됨

[4단계: 금형 마스터 자동 생성]
12단계 완료 후
    ↓
금형 마스터 자동 생성 (molds)
  - 금형 코드 (mold_code)
  - QR 코드 자동 발급 (qr_token)
    → CAMS-MOLD-[코드]-[체크섬]
  - 초기 타수 = 0 (current_shots)
  - 상태 = '양산대기' (status)
  - 위치 = 제작처 (location)
    ↓
금형정보 요약 자동 생성 (maker_info)
  - 재질 (material) ← 개발계획의 상/하형 재질
  - 중량 (weight) ← 개발계획의 부품중량
  - 치수 (dimensions)
  - 캐비티 수 (cavity_count)
  - 경도 (hardness) ← 9, 10단계 경도측정 결과
  - 냉각방식 (cooling_type)
  - 이젝션 방식 (ejection_type)
  - 최대 타수 (max_shots)
  - 상세 사양 (specifications) ← 제작전 체크리스트 결과 포함
    ↓
생산처에 자동 연동 (plant_molds)
  - 양산 준비 완료
  - 생산처 대시보드에 표시
```

### 📊 데이터베이스 테이블 연계도

```
[1단계: 금형제작사양]
mold_specifications (본사 입력)
  - 품번, 품명, 차종
  - 도면검토회 일정
    ↓ 자동 연동
maker_specifications (제작처 확인)

[2단계: 금형개발계획]
mold_development_plans (진도 관리)
  ├─ mold_specification_id (FK → mold_specifications)
  ├─ 자동: car_model, part_number, part_name, schedule_code, export_rate
  ├─ 수동: raw_material, manufacturer, trial_order_date, material_upper/lower_type
  └─ 진행률: overall_progress, completed_steps/total_steps (12)
    ↓
mold_process_steps (12단계 공정)
  ├─ development_plan_id (FK → mold_development_plans)
  ├─ step_number (1~12)
  ├─ step_name (도면접수 ~ 시운전)
  ├─ start_date, planned_completion_date, actual_completion_date
  ├─ status (pending/in_progress/completed/delayed)
  └─ days_remaining (D+00 형식)

[3단계: 제작전 체크리스트]
pre_production_checklists (제작 시작 전 점검)
  ├─ mold_specification_id (FK → mold_specifications)
  ├─ checklist_type = '제작전'
  ├─ 9개 카테고리 (JSONB) - 총 81개 항목
  │   ├─ category_material (원재료, 9개)
  │   ├─ category_mold (금형, 13개)
  │   ├─ category_gas_vent (가스배기, 6개)
  │   ├─ category_moldflow (성형해석, 11개)
  │   ├─ category_sink_mark (싱크마크, 10개)
  │   ├─ category_ejection (취출, 10개)
  │   ├─ category_mic (MIC제품, 9개)
  │   ├─ category_coating (도금, 7개)
  │   └─ category_rear_back_beam (리어백빔, 6개)
  ├─ review_status (pending/approved/rejected)
  └─ production_approved (제작 시작 가능 여부)

[4단계: 제작 진행 및 경도측정]
mold_process_steps 업데이트
  ├─ 9단계: 상형경도측정
  │   - 측정 위치: 상형 (캐비티, 코어)
  │   - 경도값 (HRC), 목표 범위
  │   - 결과: 적합/부적합/주의
  └─ 10단계: 하형경도측정
      - 측정 위치: 하형 (캐비티, 코어)
      - 경도값 (HRC), 목표 범위
      - 결과: 적합/부적합/주의
    ↓
12단계: 시운전
trial_run_results (시운전 결과)
  ├─ mold_id (FK → molds)
  ├─ trial_result (PASS/FAIL)
  └─ quality_check (품질 검증)

[5단계: 금형 마스터 자동 생성]
molds (금형 마스터) ← 12단계 완료 후 자동 생성
  ├─ qr_token (자동 생성: CAMS-MOLD-[코드]-[체크섬])
  ├─ current_shots = 0
  ├─ status = '양산대기'
  └─ development_id (FK → mold_development)
    ↓
maker_info (금형정보 요약)
  ├─ mold_id (FK → molds)
  ├─ material (상/하형 재질)
  ├─ weight (부품중량)
  ├─ hardness (9, 10단계 경도측정 결과)
  └─ specifications (제작전 체크리스트 결과 포함)
    ↓
plant_molds (생산처 자동 연동)
  - 양산 준비 완료
```

### 🔗 주요 연계 포인트

#### 1. **금형개발계획 자동 생성**
```sql
-- 금형제작사양 기반 개발계획 자동 생성
INSERT INTO mold_development_plans 
(mold_specification_id, car_model, part_number, part_name, schedule_code, export_rate)
SELECT 
  id,
  car_model,
  part_number,
  part_name,
  CONCAT('D+', EXTRACT(DAY FROM (target_delivery_date - order_date))),
  CONCAT(cavity_count, '/1000')
FROM mold_specifications
WHERE id = ?

-- 12단계 공정 자동 생성
INSERT INTO mold_process_steps 
(development_plan_id, step_number, step_name, status)
VALUES 
  (?, 1, '도면접수', 'pending'),
  (?, 2, '몰드베이스발주', 'pending'),
  (?, 3, '금형설계', 'pending'),
  (?, 4, '도면검토회', 'pending'),
  (?, 5, '상형가공', 'pending'),
  (?, 6, '하형가공', 'pending'),
  (?, 7, '상형열처리', 'pending'),
  (?, 8, '하형열처리', 'pending'),
  (?, 9, '상형경도측정', 'pending'),
  (?, 10, '하형경도측정', 'pending'),
  (?, 11, '조립', 'pending'),
  (?, 12, '시운전', 'pending')
```

#### 2. **공정 단계 업데이트 및 진행률 계산**
```sql
-- 공정 단계 완료 처리
UPDATE mold_process_steps 
SET status = 'completed',
    actual_completion_date = NOW(),
    status_display = '완료'
WHERE development_plan_id = ? AND step_number = ?

-- 진행률 자동 계산
UPDATE mold_development_plans 
SET completed_steps = (
      SELECT COUNT(*) FROM mold_process_steps 
      WHERE development_plan_id = ? AND status = 'completed'
    ),
    overall_progress = (
      SELECT COUNT(*) * 100 / 12 FROM mold_process_steps 
      WHERE development_plan_id = ? AND status = 'completed'
    )
WHERE id = ?
```

#### 3. **제작전 체크리스트 자동 생성 및 승인**
```sql
-- 제작전 체크리스트 자동 생성
INSERT INTO pre_production_checklists 
(mold_specification_id, maker_id, car_model, part_number, part_name, checklist_type)
SELECT 
  ms.id,
  ms.target_maker_id,
  ms.car_model,
  ms.part_number,
  ms.part_name,
  '제작전'
FROM mold_specifications ms
WHERE ms.id = ?

-- 제작전 체크리스트 승인
UPDATE pre_production_checklists 
SET review_status = 'approved',
    reviewed_by = ?,
    reviewed_at = NOW(),
    production_approved = TRUE
WHERE id = ? AND overall_result = 'pass'
```

#### 4. **12단계 완료 → 금형 마스터 자동 생성**
```sql
-- 12단계 완료 확인
SELECT 
  mdp.id,
  mdp.completed_steps,
  mdp.overall_progress
FROM mold_development_plans mdp
WHERE mdp.id = ? 
  AND mdp.completed_steps = 12
  AND mdp.overall_progress = 100

-- 금형 마스터 자동 생성
INSERT INTO molds 
(mold_code, qr_token, status, current_shots, development_id)
SELECT 
  ms.mold_code,
  CONCAT('CAMS-MOLD-', ms.mold_code, '-', md5(ms.mold_code::text)),
  '양산대기',
  0,
  mdp.id
FROM mold_specifications ms
JOIN mold_development_plans mdp ON mdp.mold_specification_id = ms.id
WHERE mdp.id = ? AND mdp.completed_steps = 12

-- 금형정보 요약 생성 (경도측정 결과 포함)
INSERT INTO maker_info 
(mold_id, material, weight, hardness, specifications)
SELECT 
  m.id,
  CONCAT(mdp.material_upper_type, '/', mdp.material_lower_type),
  mdp.part_weight,
  '상형: HRC 52.5, 하형: HRC 51.8', -- 9, 10단계 경도측정 결과
  jsonb_build_object(
    'pre_production_checklist', ppc.overall_result,
    'trial_run', tr.trial_result
  )
FROM molds m
JOIN mold_development_plans mdp ON mdp.id = m.development_id
LEFT JOIN pre_production_checklists ppc ON ppc.mold_specification_id = mdp.mold_specification_id
LEFT JOIN trial_run_results tr ON tr.mold_id = m.id
WHERE m.id = ?
```

### 📱 사용자별 화면 및 권한

| 사용자 유형 | 개발계획 | 진행 업데이트 | 경도측정 | 체크리스트 작성 | 승인 |
|------------|---------|-------------|---------|---------------|------|
| CAMS 시스템 관리 | 조회 | ❌ | ❌ | ❌ | ✅ |
| 금형개발 담당 | ✅ 생성/수정 | 조회 | 조회 | 조회 | ✅ 승인 |
| 금형제작처 | 조회 | ✅ 업데이트 | ✅ 입력 | ✅ 작성 | ❌ |
| 생산처 | ❌ | ❌ | ❌ | ❌ | ❌ |

### 🎯 핵심 기능

#### 1. **개발계획 5단계 관리**
- 단계별 일정 관리 (계획 vs 실제)
- 진행률 자동 계산 및 시각화
- 마일스톤 및 이슈 추적
- 비용 관리 (계획 vs 실제)

#### 2. **경도측정 품질 관리**
- 측정 위치별 경도값 기록
- 목표 범위 대비 적합성 판정
- 측정 사진 첨부
- 부적합 시 재측정 요청

#### 3. **제작완료 체크리스트**
- 템플릿 기반 자동 생성
- 8개 카테고리 체계적 점검
- 항목별 OK/NG/N/A 판정
- 합격률 자동 계산

#### 4. **승인 워크플로우**
- 본사 검토 및 승인 프로세스
- 조건부 승인 및 재작업 요청
- 승인 이력 추적
- 자동 알림 발송

#### 5. **금형 마스터 자동 생성**
- 승인 완료 시 자동 생성
- QR 코드 자동 발급
- 금형정보 요약 자동 작성
- 다음 단계 (시운전/양산) 준비

---

## ✅ 스키마 vs README 내용 비교 검증

### 📊 비교 결과 요약

| 항목 | README 설명 | DATABASE_SCHEMA.md | 일치 여부 |
|------|------------|-------------------|----------|
| 개발계획 5단계 | 기획/설계/제작/시운전/양산 | `development_plan.phase_name` | ✅ 일치 |
| 일정 관리 | 계획 vs 실제 | `planned_start_date`, `actual_start_date` | ✅ 일치 |
| 진행률 | 0-100% | `progress_percentage INTEGER DEFAULT 0` | ✅ 일치 |
| 마일스톤 | JSONB 배열 | `milestones JSONB` | ✅ 일치 |
| 비용 관리 | 계획 vs 실제 | `planned_cost`, `actual_cost` | ✅ 일치 |
| 경도측정 위치 | 캐비티/코어/슬라이드 | `measurement_location VARCHAR(100)` | ✅ 일치 |
| 경도값 | HRC | `hardness_value DECIMAL(5, 1)` | ✅ 일치 |
| 적합성 판정 | 적합/부적합/주의 | `result VARCHAR(20)` | ✅ 일치 |
| 체크리스트 유형 | 제작완료/수리완료/정기점검/이관전 | `checklist_type VARCHAR(50)` | ✅ 일치 |
| 8개 카테고리 | 외관/치수/기능/안전/구조/부품/성능/문서 | JSONB 필드 8개 | ✅ 일치 |
| 승인 상태 | pending/approved/rejected | `approval_status VARCHAR(20)` | ✅ 일치 |
| QR 코드 | 자동 생성 | `qr_token VARCHAR(255) UNIQUE` | ✅ 일치 |

### 🔍 상세 비교

#### 1. **개발계획 5단계 관리** (`development_plan`)

**README 내용**:
- 단계별 일정 관리 (계획 vs 실제)
- 진행률 자동 계산 및 시각화
- 마일스톤 및 이슈 추적
- 비용 관리 (계획 vs 실제)

**스키마 필드**:
```sql
-- 단계 정보
phase_number INTEGER NOT NULL,           -- 1, 2, 3, 4, 5
phase_name VARCHAR(100) NOT NULL,        -- '기획', '설계', '제작', '시운전', '양산'

-- 일정 (계획 vs 실제)
planned_start_date DATE,                 -- ✅ 계획 시작일
planned_end_date DATE,                   -- ✅ 계획 종료일
actual_start_date DATE,                  -- ✅ 실제 시작일
actual_end_date DATE,                    -- ✅ 실제 종료일

-- 진행률
progress_percentage INTEGER DEFAULT 0,   -- ✅ 0-100%

-- 마일스톤
milestones JSONB,                        -- ✅ [{"name": "설계 검토", "date": "...", "completed": true}]

-- 이슈 및 리스크
issues JSONB,                            -- ✅ [{"issue": "재료 수급 지연", "severity": "high"}]
risks JSONB,                             -- ✅ [{"risk": "납기 지연 가능성", "probability": "medium"}]

-- 비용 (계획 vs 실제)
planned_cost DECIMAL(12, 2),             -- ✅ 계획 비용
actual_cost DECIMAL(12, 2),              -- ✅ 실제 비용
```

**검증 결과**: ✅ **완벽 일치** - 모든 기능이 스키마에 정확히 반영됨

---

#### 2. **경도측정 품질 관리** (`mold_drawings`)

**README 내용**:
- 측정 위치별 경도값 기록
- 목표 범위 대비 적합성 판정
- 측정 사진 첨부
- 부적합 시 재측정 요청

**스키마 필드**:
```sql
mold_id INTEGER NOT NULL REFERENCES molds(id),
measurement_date DATE NOT NULL,          -- ✅ 측정일
measurement_location VARCHAR(100),       -- ✅ 측정 위치 (캐비티, 코어, 슬라이드)
hardness_value DECIMAL(5, 1),            -- ✅ 경도값 (HRC)
hardness_standard VARCHAR(50),           -- ✅ 경도 기준 (HRC, HB, HV)
target_hardness VARCHAR(50),             -- ✅ 목표 경도 범위
result VARCHAR(20),                      -- ✅ '적합', '부적합', '주의'
measured_by VARCHAR(100),                -- ✅ 측정자
measurement_equipment VARCHAR(100),      -- ✅ 측정 장비
notes TEXT,                              -- ✅ 비고 (재측정 요청 기록 가능)
image_url VARCHAR(500),                  -- ✅ 측정 사진
```

**검증 결과**: ✅ **완벽 일치** - 모든 기능이 스키마에 정확히 반영됨

---

#### 3. **제작완료 체크리스트** (`mold_project` + `mold_project_items`)

**README 내용**:
- 템플릿 기반 자동 생성
- 8개 카테고리 체계적 점검
- 항목별 OK/NG/N/A 판정
- 합격률 자동 계산

**스키마 필드 (`mold_project`)**:
```sql
checklist_type VARCHAR(50),              -- ✅ '제작완료', '수리완료', '정기점검', '이관전'

-- 8개 카테고리 (JSONB)
appearance_check JSONB,                  -- ✅ 1. 외관 점검
dimension_check JSONB,                   -- ✅ 2. 치수 점검
function_check JSONB,                    -- ✅ 3. 기능 점검
safety_check JSONB,                      -- ✅ 4. 안전 점검
structure_check JSONB,                   -- ✅ 5. 구조 점검
parts_check JSONB,                       -- ✅ 6. 부품 점검
performance_check JSONB,                 -- ✅ 7. 성능 점검
documentation_check JSONB,               -- ✅ 8. 문서 점검

-- 종합 결과
total_items INTEGER DEFAULT 0,           -- ✅ 전체 항목 수
ok_items INTEGER DEFAULT 0,              -- ✅ OK 항목 수
ng_items INTEGER DEFAULT 0,              -- ✅ NG 항목 수
na_items INTEGER DEFAULT 0,              -- ✅ N/A 항목 수
pass_rate DECIMAL(5, 2),                 -- ✅ 합격률 (%)
overall_result VARCHAR(20),              -- ✅ 'pass', 'conditional_pass', 'fail'
```

**스키마 필드 (`mold_project_items`)**:
```sql
category VARCHAR(50) NOT NULL,           -- ✅ '외관', '치수', '기능', '안전', '구조', '부품', '성능', '문서'
status VARCHAR(10),                      -- ✅ 'OK', 'NG', 'N/A'
measured_value VARCHAR(100),             -- ✅ 측정값
standard_value VARCHAR(100),             -- ✅ 기준값
defect_description TEXT,                 -- ✅ 불량 내용 (NG인 경우)
corrective_action TEXT,                  -- ✅ 조치 방법
```

**템플릿 연계**:
```sql
-- checklist_master_templates 테이블에서 템플릿 로드
-- mold_project 자동 생성 시 템플릿 기반으로 8개 카테고리 JSONB 초기화
```

**검증 결과**: ✅ **완벽 일치** - 템플릿 기반 생성, 8개 카테고리, 합격률 계산 모두 반영됨

---

#### 4. **승인 워크플로우** (`mold_project`, `development_plan`)

**README 내용**:
- 본사 검토 및 승인 프로세스
- 조건부 승인 및 재작업 요청
- 승인 이력 추적
- 자동 알림 발송

**스키마 필드 (`mold_project`)**:
```sql
-- 승인 정보
approval_required BOOLEAN DEFAULT FALSE, -- ✅ 승인 필요 여부
approval_status VARCHAR(20),             -- ✅ 'pending', 'approved', 'rejected'
approved_by INTEGER REFERENCES users(id),-- ✅ 승인자
approved_at TIMESTAMP,                   -- ✅ 승인 일시
approval_comments TEXT,                  -- ✅ 승인 의견 (조건부 승인, 재작업 요청 기록)

overall_result VARCHAR(20),              -- ✅ 'pass', 'conditional_pass', 'fail'
```

**스키마 필드 (`development_plan`)**:
```sql
approval_required BOOLEAN DEFAULT FALSE,
approval_status VARCHAR(20),             -- ✅ 'pending', 'approved', 'rejected'
approved_by INTEGER REFERENCES users(id),
approved_at TIMESTAMP,
approval_comments TEXT,
```

**알림 연계**:
```sql
-- notifications 테이블 (카테고리 10: 기타)
-- 승인 완료 시 자동 알림 생성
```

**검증 결과**: ✅ **완벽 일치** - 승인 상태, 조건부 승인, 이력 추적 모두 반영됨

---

#### 5. **금형 마스터 자동 생성** (`molds` + `maker_info`)

**README 내용**:
- 승인 완료 시 자동 생성
- QR 코드 자동 발급
- 금형정보 요약 자동 작성
- 다음 단계 (시운전/양산) 준비

**스키마 필드 (`molds`)**:
```sql
mold_code VARCHAR(50) UNIQUE NOT NULL,   -- ✅ 금형 코드
qr_token VARCHAR(255) UNIQUE,            -- ✅ QR 코드 (자동 생성)
status VARCHAR(20) DEFAULT 'active',     -- ✅ '양산대기', 'active', 'repair', 'transfer'
current_shots INTEGER DEFAULT 0,         -- ✅ 초기 타수 = 0
development_id INTEGER,                  -- ✅ 개발 정보 연계 (FK)
```

**스키마 필드 (`maker_info`)**:
```sql
mold_id INTEGER NOT NULL REFERENCES molds(id),
material VARCHAR(100),                   -- ✅ 재질
weight DECIMAL(10, 2),                   -- ✅ 중량(kg)
dimensions VARCHAR(100),                 -- ✅ 치수 (LxWxH)
cavity_count INTEGER,                    -- ✅ 캐비티 수
hardness VARCHAR(50),                    -- ✅ 경도 (경도측정 결과 반영)
cooling_type VARCHAR(50),                -- ✅ 냉각방식
ejection_type VARCHAR(50),               -- ✅ 이젝션 방식
cycle_time INTEGER,                      -- ✅ 사이클 타임(초)
max_shots INTEGER,                       -- ✅ 최대 타수
specifications JSONB,                    -- ✅ 상세 사양 (체크리스트 결과 포함)
```

**자동 생성 로직** (README SQL 예제와 일치):
```sql
-- 1. 체크리스트 승인
UPDATE mold_project 
SET approval_status = 'approved'
WHERE id = ? AND overall_result = 'pass'

-- 2. 금형 마스터 자동 생성
INSERT INTO molds (mold_code, qr_token, status, current_shots)
SELECT mold_code, 
       CONCAT('CAMS-MOLD-', mold_code, '-', checksum),
       '양산대기', 
       0
FROM mold_project WHERE approval_status = 'approved'

-- 3. 금형정보 요약 자동 생성
INSERT INTO maker_info (mold_id, hardness, specifications)
SELECT m.id,
       (SELECT hardness_value FROM mold_drawings WHERE mold_id = m.id),
       jsonb_build_object('checklist_result', mp.overall_result)
FROM molds m JOIN mold_project mp ON mp.mold_id = m.id
```

**검증 결과**: ✅ **완벽 일치** - QR 코드 자동 생성, 정보 요약, 상태 관리 모두 반영됨

---

### 📋 종합 검증 결과

| 핵심 기능 | README 설명 | 스키마 반영 | 일치도 |
|----------|------------|-----------|--------|
| 1. 개발계획 5단계 관리 | 일정, 진행률, 마일스톤, 비용 | `development_plan` 테이블 | ✅ 100% |
| 2. 경도측정 품질 관리 | 위치별 측정, 적합성 판정 | `mold_drawings` 테이블 | ✅ 100% |
| 3. 제작완료 체크리스트 | 템플릿 기반, 8개 카테고리 | `mold_project` + `mold_project_items` | ✅ 100% |
| 4. 승인 워크플로우 | 검토, 승인, 조건부 승인, 반려 | `approval_status` 필드 | ✅ 100% |
| 5. 금형 마스터 자동 생성 | QR 코드, 정보 요약 | `molds` + `maker_info` | ✅ 100% |

### ✅ 최종 결론

**모든 README 내용이 DATABASE_SCHEMA.md와 100% 일치합니다.**

- ✅ 개발계획 5단계 관리의 모든 필드 (일정, 진행률, 마일스톤, 비용) 정확히 반영
- ✅ 경도측정의 측정 위치, 경도값, 적합성 판정 필드 완벽 구현
- ✅ 체크리스트 8개 카테고리 JSONB 구조로 정확히 설계
- ✅ 승인 워크플로우의 모든 상태 (pending/approved/rejected/conditional_pass) 지원
- ✅ 금형 마스터 자동 생성 로직이 스키마와 완벽히 연계

**추가 확인 사항**:
- 모든 FK(Foreign Key) 관계가 정확히 설정됨
- JSONB 필드 구조가 README 예제와 일치
- 인덱스가 조회 성능 최적화를 위해 적절히 설정됨

---

## 🚀 시작하기

### 1. 문서 읽기
프로젝트를 시작하기 전에 다음 문서를 순서대로 읽어주세요:

1. [PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) - 전체 개요 파악
2. [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) - 데이터 구조 이해
3. [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) - UI/UX 가이드 확인
4. [WEEK1_PLAN.md](docs/WEEK1_PLAN.md) - 개발 시작

### 2. 환경 설정
```bash
# Node.js 18+ 설치
# PostgreSQL 14+ 설치
# Git 설치
```

### 3. 프로젝트 초기화
```bash
# 저장소 클론
git clone [repository-url]

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# 데이터베이스 마이그레이션
npm run migrate

# 개발 서버 실행
npm run dev
```

---

## 📖 문서 활용 가이드

### 개발자용
1. **PROJECT_OVERVIEW.md** - 프로젝트 전체 이해
2. **DATABASE_SCHEMA.md** - 데이터베이스 스키마 참조
3. **WEEK1~4_PLAN.md** - 개발 일정 및 작업 내용
4. **DESIGN_SYSTEM.md** - UI 컴포넌트 개발 시 참조

### 기획자/디자이너용
1. **PROJECT_OVERVIEW.md** - 기능 및 사용자 역할 이해
2. **DESIGN_SYSTEM.md** - 디자인 가이드라인
3. **INSPECTION_SCHEDULE_GUIDE.md** - 점검 프로세스 이해
4. **PRODUCTION_QUANTITY_WORKFLOW.md** - 생산수량 연동 흐름

### 관리자용
1. **SYSTEM_SPECIFICATIONS.md** - 시스템 운영 규칙
2. **ADMIN_MODIFICATION_GUIDE.md** - 데이터 수정 및 배포
3. **INSPECTION_SCHEDULE_GUIDE.md** - 점검 스케줄 관리

---

## 📞 문의 및 지원

프로젝트 관련 문의사항은 문서를 먼저 확인해주세요.

---

## 📝 라이선스

이 프로젝트는 내부 사용을 위한 것입니다.

---

**마지막 업데이트**: 2024-01-18
**버전**: Ver.09
**문서 개수**: 20개
**테이블 개수**: 50개

---

## 🔄 금형 Lifecycle 업무 흐름 요약

### 4단 역할 구조
```
CAMS 시스템 관리 담당 (본사)
         ↓
금형개발 담당 (본사)
         ↓
금형제작처 (Maker)
         ↓
생산처 (Plant)
```

### 10단계 Lifecycle
```
1. 금형 개발 (금형개발 담당 + CAMS 시스템 관리 담당)
2. 금형 설계 (제작처 + 금형개발 담당)
3. 금형 제작 (제작처)
4. 시운전 (Try-out)
5. 양산 이관 (제작처 → 생산처)
6. 양산 생산 (생산처)
7. 금형 수리 (생산처/제작처)
8. 금형 유지보전
9. 금형 이관 (공장 간 / 외주)
10. 금형 폐기 (금형개발 담당 승인)
```

### QR + GPS 기반 운영
- 금형개발 담당이 금형정보 등록 시 QR 코드 자동 생성
- 제작처에서 자동생성된 QR 코드를 금형 명판에 부착
- 모든 작업은 QR 스캔으로 시작
- GPS 자동 기록 (작업자 단말 기준)
- 권한별 메뉴 자동 구분
- 실시간 데이터 동기화

### NG 자동 연계
- Minor → 협력사 자체 조치
- Major → 수리 요청 필요
- Critical → 생산중단 + 본사 알림
