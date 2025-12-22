# QR + GPS 기반 금형관리시스템 (CAMS Mold System Ver.09)
## 프로젝트 개요

### 📋 프로젝트 정보
- **프로젝트명**: QR + GPS 기반 금형관리시스템
- **버전**: Ver.09
- **개발 기간**: 4주 (Sprint 기반)
- **목표**: 자동차 금형의 전체 라이프사이클 관리 시스템 구축

---

## 🎯 핵심 목표

### 1. 시스템 핵심 가치
- **QR 코드 기반** 모바일 현장 작업
- **GPS 위치 기반** 점검/수리/반출/입고 기록
- **역할별 권한 분리** (본사/협력사/제작처)
- **단일 계정 멀티 모드** (PC 대시보드 + QR 모바일)
- **실시간 협업** (협력사 ↔ 제작처 커뮤니케이션)

### 2. 주요 기능
- **금형 정보 관리**: 금형 기본정보, 사양, 이미지, 도면 관리
- **점검 관리**: 일상점검, 정기점검(1차/2차/3차), 습합점검, 세척점검
- **수리 관리**: 수리 요청, 진행, 완료 이력 관리 (타사 금형 수리 가능)
- **타수 관리**: 누적 타수 기록 및 임계치 알림
- **이관 관리**: 반출/입고 프로세스, 체크리스트, 승인 워크플로우
- **QR 기반 접근**: 모바일 QR 스캔을 통한 빠른 접근 (8시간 세션)
- **GPS 위치 추적**: 실시간 금형 위치 및 작업 위치 기록 (50m 오차 이내)
- **실시간 알림**: 점검 예정, 수리 요청, 타수 임계치, 위치 이탈 알림
- **협력사 관리**: 협력사별 수리 이력, 성과 평가

---

## 👥 사용자 역할 구조 (4단)

### CAMS 시스템 관리 담당
- **user_type**: `system_admin`
- **권한**: 전체 시스템 관리 및 설정
- **접근 방법**: `http://[서버주소]/admin/login`
- **주요 기능**:
  - 사용자 관리 (등록/수정/삭제)
  - 권한 관리 (권한 그룹 설정)
  - 점검표 관리 (일상점검/정기점검 체크리스트)
  - 알람 기준 설정 (타수/NG 기준)
  - 전사 모니터링 (통합 대시보드)
  - 실시간 알람 관리
  - GPS 위치 추적
  - 통계 및 리포트

### 금형개발 담당
- **user_type**: `mold_developer`
- **권한**: 금형 정보 관리 및 승인
- **접근 방법**: `http://[서버주소]/developer/login`
- **주요 기능**:
  - 금형 등록 (QR 코드 자동 생성)
  - 금형 정보 수정
  - 설계 승인
  - 시운전 결과 검토
  - 수리 귀책 판정
  - 제작처 관리 및 선정
  - 전사 모니터링
  - 통계 및 리포트

### 금형제작처 (Maker)
- **user_type**: `maker`
- **권한**: 담당자/작업자 동일 ID 사용
- **접근 방법**: `http://[서버주소]/maker/login`
- **주요 기능**:
  - QR 코드 확인 및 출력
  - 제작 진행 등록
  - 금형 명판 부착 확인
  - 시운전 결과 입력 (PASS/FAIL)
  - 수리 요청 확인
  - 수리 진행 등록 (수리 전 → 진행 → 완료)
  - 각 단계별 사진 촬영 필수
  - 귀책 협의 참여
  - GPS 위치 자동 기록
  - 교체 부품 기록

### 생산처 (Plant)
- **user_type**: `plant`
- **권한**: 담당자/작업자 동일 ID 사용
- **접근 방법**: QR 코드 스캔 (세션 유효시간 8시간)
- **필수 권한**: 카메라, GPS 위치
- **주요 기능**:
  - **일상점검**: 매일 실시, 금형 외관/기능부/생산 관련/보관관리
  - **생산수량 입력**: 이전 타수 자동 로드, 현재 타수 입력
  - **수리 요청**: 긴급도 선택, 문제 유형, 사진 첨부 필수
  - **정기점검**: 1차(100K타), 2차(500K타), 3차(1M타)
  - **세척/습합**: 작업 전후 사진 필수, 사용 자재 기록
  - **금형 이관**: 이관 요청, 4M 체크리스트
  - **귀책 협의 참여**
  - GPS 위치 자동 기록 (오차 50m 이내)
  - 불량 항목 발견 시 자동 알림 발송 



---

## 🏗️ 기술 스택

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Apple Design System
- **Design System**: Apple Design System 기반
  - Primary: #0ea5e9 (Sky Blue)
  - Neutral: #737373 (Gray)
  - Accent: Orange (#ff9500), Green (#30d158), Red (#ff3b30)
- **Typography**: SF Pro Text fallback
- **Animations**: fade-in, slide-up, scale-in, pulse
- **UI Components**: Custom components (Button, Input, Card, Badge, Modal)
- **Icons**: Lucide React
- **State Management**: React Query + Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Sequelize
- **Authentication**: JWT
- **File Upload**: Multer
- **Validation**: Joi / Zod

### Database
- **DBMS**: PostgreSQL (Railway)
- **Migration**: Sequelize CLI
- **Version Control**: 마이그레이션 기반

### DevOps
- **Frontend Deploy**: Vercel
- **Backend Deploy**: Railway
- **Version Control**: Git
- **CI/CD**: GitHub Actions (선택)

---

## 📅 4주 개발 일정

### Week 1: 기반 구축 및 인증 시스템
- 프로젝트 초기 설정
- DB 스키마 설계 및 마이그레이션
- 인증/권한 시스템 구축
- 본사 금형 등록 기능

### Week 2: 협력사/제작처 핵심 기능
- 협력사 대시보드 및 API
- 제작처 대시보드 및 API
- QR 로그인 및 세션 관리
- 점검 시스템 (일상/정기)

### Week 3: 반출/입고 및 수리 관리
- 반출/입고 프로세스 구현
- 수리 요청 및 진행 관리
- GPS 위치 기록
- 댓글/메모 시스템

### Week 4: UI/UX 완성 및 배포
- PC 대시보드 UI 완성
- 모바일 QR UI 완성
- 알림 시스템
- 테스트 및 배포

---

## 🔐 보안 및 권한 정책

### 접근 제어 규칙
```javascript
// 협력사
if (role_group === 'plant') {
  allow only if mold.plant_id === user.plant_id
}

// 제작처
if (role_group === 'maker') {
  allow only if mold.maker_id === user.maker_id
}

// 본사
if (role_group === 'hq') {
  allow all
}
```

### QR 접근 흐름
1. QR 스캔 → `/qr/:token`
2. **ID/PW 로그인 강제**
3. QR 세션 생성 (`qr_sessions`)
4. 금형 권한 검증 (plant_id / maker_id)
5. 역할별 모바일 UI 제공

---

## 🎨 UI/UX 디자인

### Apple Design System 기반

본 시스템은 Apple의 디자인 철학을 따라 직관적이고 일관된 사용자 경험을 제공합니다.

#### 컬러 시스템

**Primary (Sky Blue)**
- 주요 액션 버튼, 링크, 강조 요소
- 기본: #0ea5e9
- 호버: #0284c7
- 50~900 단계 제공

**Neutral (Gray)**
- 텍스트, 배경, 테두리
- 기본: #737373
- 50~900 단계 제공

**Accent Colors**
- Orange (#ff9500): 경고, 대기 상태
- Green (#30d158): 성공, 완료 상태
- Red (#ff3b30): 오류, 긴급 상태

#### 타이포그래피

```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 
             'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

- 폰트 크기: xs (12px) ~ 4xl (36px)
- 폰트 굵기: Light (300) ~ Bold (700)

#### 애니메이션

- **fade-in**: 모달, 툴팁 표시 (200ms)
- **slide-up**: 바텀 시트, 카드 등장 (200ms)
- **scale-in**: 버튼 클릭 피드백 (200ms)
- **pulse**: 로딩 상태, 알림 배지 (2s)

#### 그림자 효과

```css
/* Apple Shadow */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 
            0 1px 2px rgba(0, 0, 0, 0.04);

/* Apple Shadow Large */
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 
            0 2px 4px rgba(0, 0, 0, 0.08);
```

#### Border Radius

- 2xl: 1rem (16px) - 카드, 큰 버튼
- 3xl: 1.5rem (24px) - 모달, 바텀 시트
- full: 9999px - 원형 버튼, 배지

#### 반응형 디자인

- **모바일 우선**: 320px ~ 768px
- **태블릿**: 768px ~ 1024px
- **데스크톱**: 1024px+
- **Breakpoint**: md (768px)에서 레이아웃 전환

#### 다크 모드 지원

```css
@media (prefers-color-scheme: dark) {
  --bg-primary: #000000;
  --text-primary: #ffffff;
}
```

---

## 📊 핵심 데이터 모델

### 주요 테이블

#### 1. 사용자 및 권한
- `users` - 사용자 및 권한
- `qr_sessions` - QR 세션

#### 2. 데이터 흐름 및 자동 연동
- `mold_specifications` - 본사 금형제작사양 (1차 입력)
- `maker_specifications` - 제작처 사양 (자동 연동 + 추가 입력)
- `plant_molds` - 생산처 금형 (자동 연동)
- `stage_change_history` - 단계 변경 이력

#### 3. 금형정보 관리
- `molds` - 금형 마스터
- `mold_development` - 금형개발 (기본 정보)
- `development_plan` - 개발계획 (단계별 상세: 기획→설계→제작→시운전→양산)
- `development_progress_history` - 개발 진행 이력
- `mold_project` - 금형체크리스트 (8개 카테고리: 외관/치수/기능/안전/구조/부품/성능/문서)
- `mold_project_items` - 체크리스트 상세 항목
- `checklist_master_templates` - 체크리스트 마스터 템플릿 (본사 관리)
- `checklist_template_items` - 템플릿 항목 마스터
- `checklist_template_deployment` - 템플릿 배포 이력
- `checklist_template_history` - 템플릿 변경 이력
- `mold_replication` - 금형육성
- `mold_drawings` - 경도측정
- `maker_info` - 금형정보 요약

#### 4. 사출정보 관리
- `plant_info` - 사출조건 관리 (생산정보)
- `injection_conditions` - 사출조건 수정관리
- `production_lines` - 라인/사출기
- `revision_history` - 리비젼 관리
- `change_trend_analysis` - 변경이력 추이분석

#### 5. 점검 관리
- `daily_checks` - 일상점검 
- `inspections` - 정기점검
- `fitting_checks` - 습합점검
- `cleaning_checks` - 세척점검
- `inspection_schedules` - 점검 스케줄 (생산수량 기반)
- `qr_scan_alerts` - QR 스캔 알람

#### 6. 수리 관리
- `repairs` - 수리요청
- `repair_management` - 금형수리 관리표
- `repair_progress` - 금형수리 진행현황

#### 7. 이관(반출/입고) 관리
- `transfer_logs` - 이관요청 (반출/입고)
- `transfer_management` - 이관관리
- `transfer_checklist` - 이관 체크리스트
- `transfer_approvals` - 승인

#### 8. 금형 폐기 관리
- `mold_disposal` - 금형 폐기
- `disposal_approval` - 폐기 승인
- `disposal_records` - 폐기 기록

#### 9. 관리자 수정 및 배포 관리
- `admin_modifications` - 관리자 수정 이력
- `modification_approvals` - 수정 승인
- `auto_deployment` - 자동 배포 기록

#### 10. 기타
- `shots` - 타수 기록
- `notifications` - 알림
- `comments` - 협력사↔제작처 소통
- `mold_images` - 금형 이미지

---

## 📁 프로젝트 구조

```
/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # 공통 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── layouts/        # 레이아웃 (Desktop/Mobile)
│   │   ├── hooks/          # Custom Hooks
│   │   ├── utils/          # 유틸리티
│   │   └── api/            # API 클라이언트
│   └── package.json
│
├── server/                 # Express Backend
│   ├── models/             # Sequelize 모델
│   ├── routes/             # API 라우트
│   ├── middleware/         # 인증/권한 미들웨어
│   ├── migrations/         # DB 마이그레이션
│   ├── controllers/        # 비즈니스 로직
│   └── package.json
│
├── docs/                   # 프로젝트 문서
│   ├── WEEK1_PLAN.md
│   ├── WEEK2_PLAN.md
│   ├── WEEK3_PLAN.md
│   ├── WEEK4_PLAN.md
│   └── API_SPEC.md
│
└── README.md
```

---

## 🚀 시작하기

### 개발 환경 요구사항
- Node.js 18+
- PostgreSQL (Railway)
- Git

### 환경 변수 설정
```env
# Backend (.env)
DATABASE_URL=postgresql://...
JWT_SECRET=your_jwt_secret
QR_SESSION_SECRET=your_qr_secret
ALLOWED_ORIGIN=https://your-frontend.vercel.app

# Frontend (.env)
VITE_API_URL=https://your-backend.railway.app
```

---

## 📝 개발 규칙

### Git 커밋 메시지
```
feat: 새 기능 추가
fix: 버그 수정
refactor: 리팩토링
docs: 문서 수정
test: 테스트 추가
chore: 빌드/설정 변경
```

### 코드 스타일
- ESLint + Prettier 사용
- Tailwind CSS 유틸리티 우선
- 컴포넌트는 기능별로 분리
- API는 역할별로 prefix 분리 (`/api/hq/*`, `/api/plant/*`, `/api/maker/*`)

---

## 📞 관련 문서

### 개발 계획
- [Week 1 계획](./WEEK1_PLAN.md) - 기반 구축 및 인증 시스템
- [Week 2 계획](./WEEK2_PLAN.md) - 협력사/제작처 핵심 기능
- [Week 3 계획](./WEEK3_PLAN.md) - 반출/입고 및 수리 관리
- [Week 4 계획](./WEEK4_PLAN.md) - UI/UX 완성 및 배포

### 기술 문서
- [데이터베이스 스키마](./DATABASE_SCHEMA.md) - 전체 테이블 구조 및 관계 (59개 테이블)
- [시스템 사양](./SYSTEM_SPECIFICATIONS.md) - 운영 규칙 및 기준
- [데이터 흐름 아키텍처](./DATA_FLOW_ARCHITECTURE.md) - 본사→제작처→마스터→생산처 자동 연동
- [점검 스케줄 가이드](./INSPECTION_SCHEDULE_GUIDE.md) - 생산수량 기반 점검 및 QR 알람
- [관리자 수정 가이드](./ADMIN_MODIFICATION_GUIDE.md) - 수정 이력 관리 및 자동 배포
- [생산수량 연동 가이드](./PRODUCTION_QUANTITY_WORKFLOW.md) - 일상점검 시 생산수량 입력 및 자동 연동
- [디자인 시스템](./DESIGN_SYSTEM.md) - Apple Design System 기반 UI/UX 가이드
- [UI/UX 상세 명세서](./UI_UX_SPECIFICATIONS.md) - 로그인, QR 스캔, 관리자 대시보드 UI/UX
- [관리자 대시보드 가이드](./ADMIN_DASHBOARD_GUIDE.md) - GPS 위치 추적 및 시스템 전체 관리
- [본사 담당자 대시보드 가이드](./HQ_DASHBOARD_GUIDE.md) - 협력사 관리 및 표준 마스터 설정

### 주요 내용
**시스템 사양 문서 포함 내용:**
- 금형 상태 코드 및 전환 규칙
- 긴급도 기준 및 대응 시간
- 점검 주기 및 상세 항목
- 알림 시스템 발송 규칙
- GPS 위치 정확도 기준
- QR 세션 관리 규칙
- 데이터 백업 정책
- 협력사 성과 평가 기준
