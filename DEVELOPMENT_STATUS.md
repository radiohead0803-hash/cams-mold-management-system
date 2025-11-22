# 🚀 CAMS 금형관리시스템 개발 현황 분석

**분석일시**: 2025-11-20  
**프로젝트**: QR + GPS 기반 금형관리시스템 Ver.09

---

## 📊 현재 개발 상태 요약

### ✅ 완료된 항목

#### 1. **프론트엔드** (15개 페이지)
- ✅ Login.jsx - 로그인 (테스트 계정 버튼 포함)
- ✅ QRLogin.jsx - QR 로그인
- ✅ Dashboard.jsx - 대시보드
- ✅ DailyChecklist.jsx - 일상점검 (구버전)
- ✅ DailyChecklistNew.jsx - 일상점검 (신버전)
- ✅ PeriodicInspection.jsx - 정기점검 (구버전)
- ✅ PeriodicInspectionNew.jsx - 정기점검 (신버전)
- ✅ MoldList.jsx - 금형 목록
- ✅ MoldDetail.jsx - 금형 상세
- ✅ MoldDocuments.jsx - 금형 문서
- ✅ MoldPhotoGallery.jsx - 금형 사진
- ✅ RepairManagement.jsx - 수리 관리
- ✅ TransferManagement.jsx - 이관 관리
- ✅ ChecklistMaster.jsx - 체크리스트 마스터
- ✅ Alerts.jsx - 알람

#### 2. **백엔드 모델** (25개 Sequelize 모델)
- ✅ User.js - 사용자
- ✅ Mold.js - 금형 마스터
- ✅ MoldSpecification.js - 금형제작사양 (본사)
- ✅ MakerSpecification.js - 제작처 사양
- ✅ DailyCheck.js - 일상점검
- ✅ DailyCheckItem.js - 일상점검 항목
- ✅ DailyCheckItemStatus.js - 일상점검 항목 상태
- ✅ CheckItemMaster.js - 점검 항목 마스터
- ✅ CheckGuideMaterial.js - 점검 가이드 자료
- ✅ Inspection.js - 정기점검
- ✅ InspectionItem.js - 정기점검 항목
- ✅ InspectionPhoto.js - 정기점검 사진
- ✅ Repair.js - 수리
- ✅ Transfer.js - 이관
- ✅ Notification.js - 알림
- ✅ Shot.js - 타수 기록
- ✅ GPSLocation.js - GPS 위치
- ✅ Alert.js - 알람
- ✅ MoldIssue.js - 금형 이슈
- ✅ ChecklistMasterTemplate.js - 체크리스트 마스터 템플릿
- ✅ ChecklistTemplateItem.js - 체크리스트 템플릿 항목
- ✅ ChecklistTemplateDeployment.js - 체크리스트 배포
- ✅ ChecklistTemplateHistory.js - 체크리스트 변경 이력
- ✅ index.js - 모델 초기화
- ✅ newIndex.js - 새 모델 초기화

#### 3. **백엔드 라우트** (10개 API 라우트)
- ✅ auth.js - 인증 (로그인/로그아웃)
- ✅ users.js - 사용자 관리
- ✅ molds.js - 금형 관리
- ✅ dailyChecks.js - 일상점검
- ✅ inspections.js - 정기점검
- ✅ periodicInspections.js - 정기점검 (별도)
- ✅ checklists.js - 체크리스트
- ✅ alerts.js - 알람
- ✅ transfers.js - 이관
- ✅ reports.js - 리포트

#### 4. **데이터베이스 마이그레이션** (5개)
- ✅ 20251120100000-create-database-schema-v09.js
- ✅ 20251120100001-add-mold-specifications.js
- ✅ 20251120100002-add-checklist-master-templates.js
- ✅ 20251120100003-add-inspection-photos.js
- ✅ 20251120100004-add-mold-issues.js

#### 5. **시드 데이터** (1개)
- ✅ 20251120100001-demo-data-v09.js
  - 4개 테스트 계정 (admin, hq_manager, maker1, plant1)
  - 10개 샘플 금형 데이터

#### 6. **서버 설정**
- ✅ server.js - 메인 서버
- ✅ app.js - Express 앱
- ✅ testServer.js - 테스트 서버 (로그인 API 포함)
- ✅ config/database.js - DB 설정
- ✅ middleware/auth.js - JWT 인증 미들웨어
- ✅ middleware/errorHandler.js - 에러 핸들러

---

## ⚠️ 미완성 항목

### 1. **데이터베이스 스키마 (52개 중 25개 완료, 48%)**

#### ❌ 미구현 테이블 (27개)

**카테고리 2: 데이터 흐름 (1개 미구현)**
- ❌ plant_molds - 생산처 금형 (자동 연동)
- ❌ stage_change_history - 단계 변경 이력

**카테고리 3: 금형정보 관리 (8개 미구현)**
- ❌ mold_development - 금형개발 기본 정보
- ❌ mold_development_plans - 금형개발계획 (진도 관리)
- ❌ mold_process_steps - 공정 단계 (12단계)
- ❌ pre_production_checklists - 제작전 체크리스트 (81개 항목)
- ❌ development_progress_history - 개발 진행 이력
- ❌ mold_replication - 금형육성
- ❌ mold_drawings - 경도측정
- ❌ maker_info - 금형정보 요약

**카테고리 4: 사출정보 관리 (5개 미구현)**
- ❌ plant_info - 생산처 정보
- ❌ injection_conditions - 사출 조건
- ❌ production_lines - 생산 라인
- ❌ injection_machines - 사출기
- ❌ material_info - 재료 정보

**카테고리 5: 점검 관리 (1개 미구현)**
- ❌ inspection_history - 점검 이력

**카테고리 6: 수리 관리 (2개 미구현)**
- ❌ repair_management - 수리 관리 (귀책 협의)
- ❌ repair_progress - 수리 진행 단계

**카테고리 7: 이관 관리 (3개 미구현)**
- ❌ transfer_management - 이관 관리
- ❌ transfer_checklist - 4M 체크리스트
- ❌ transfer_approvals - 이관 승인

**카테고리 8: 금형 폐기 관리 (3개 미구현)**
- ❌ scrapping_requests - 폐기 요청
- ❌ scrapping_approvals - 폐기 승인
- ❌ scrapping_history - 폐기 이력

**카테고리 9: 관리자 수정 및 배포 관리 (2개 미구현)**
- ❌ document_master_templates - 문서 마스터 템플릿
- ❌ template_deployment_log - 템플릿 배포 로그

**카테고리 10: 기타 (4개 미구현)**
- ❌ production_quantities - 생산수량 기록
- ❌ production_progress - 제작 진행 기록
- ❌ trial_run_results - 시운전 결과
- ❌ comments - 협력사↔제작처 소통
- ❌ mold_images - 금형 이미지

### 2. **백엔드 API (미구현 엔드포인트)**

#### ❌ QR 스캔 및 GPS
- ❌ GET /api/qr-scan/:qr_code - QR 스캔 및 금형 정보 로드
- ❌ POST /api/qr-session - QR 세션 생성
- ❌ POST /api/gps-location - GPS 위치 기록

#### ❌ 모바일 대시보드 - 생산처
- ❌ POST /api/mobile/daily-inspection - 일상점검 + 생산수량
- ❌ POST /api/mobile/production-quantity - 생산수량만 입력
- ❌ POST /api/mobile/repair-request - 수리 요청
- ❌ POST /api/mobile/transfer-request - 이관 요청

#### ❌ 모바일 대시보드 - 제작처
- ❌ POST /api/mobile/maker/production-progress - 제작 진행
- ❌ POST /api/mobile/maker/trial-run - 시운전 결과

#### ❌ 금형개발계획
- ❌ POST /api/development-plans - 개발계획 생성
- ❌ GET /api/development-plans/:id - 개발계획 조회
- ❌ PATCH /api/development-plans/:id/step - 공정 단계 업데이트
- ❌ GET /api/development-plans/:id/progress - 진행률 조회

#### ❌ 제작전 체크리스트
- ❌ POST /api/pre-production-checklists - 체크리스트 생성
- ❌ GET /api/pre-production-checklists/:id - 체크리스트 조회
- ❌ PATCH /api/pre-production-checklists/:id - 체크리스트 수정
- ❌ POST /api/pre-production-checklists/:id/submit - 제출
- ❌ POST /api/pre-production-checklists/:id/approve - 승인

#### ❌ 체크리스트 마스터 관리
- ❌ POST /api/admin/checklist-templates - 템플릿 생성
- ❌ PATCH /api/admin/checklist-templates/:id - 템플릿 수정
- ❌ POST /api/admin/checklist-templates/:id/deploy - 템플릿 배포
- ❌ POST /api/admin/checklist-templates/:id/rollback - 롤백

### 3. **프론트엔드 (미구현 페이지)**

#### ❌ 사용자 유형별 대시보드 (4개)
- ❌ /dashboard/system-admin - CAMS 시스템 관리 담당
- ❌ /dashboard/mold-developer - 금형개발 담당
- ❌ /dashboard/maker - 금형제작처
- ❌ /dashboard/plant - 생산처

#### ❌ 금형개발 관리 (3개)
- ❌ /development-plans - 금형개발계획 목록
- ❌ /development-plans/:id - 개발계획 상세 (12단계 진도)
- ❌ /pre-production-checklist/:id - 제작전 체크리스트

#### ❌ 모바일 대시보드 (2개)
- ❌ /mobile/plant - 생산처 모바일 대시보드
- ❌ /mobile/maker - 제작처 모바일 대시보드

#### ❌ 관리자 기능 (2개)
- ❌ /admin/checklist-templates - 체크리스트 마스터 관리
- ❌ /admin/template-deployment - 템플릿 배포 관리

---

## 🎯 개발 우선순위 (Week 1-4 기준)

### Week 1: 기반 구축 완료 ✅ (80% 완료)

**완료된 항목:**
- ✅ PostgreSQL 데이터베이스 설정
- ✅ JWT 인증 시스템 (로그인/로그아웃)
- ✅ 사용자 모델 및 테이블
- ✅ 금형 마스터 모델 및 테이블
- ✅ 기본 API 구조

**미완성 항목:**
- ❌ QR 세션 관리 (qr_sessions 테이블)
- ❌ 금형개발계획 시스템 (2개 테이블)
- ❌ 제작전 체크리스트 시스템 (2개 테이블)

### Week 2: QR 스캔 및 점검 시스템 ✅ (70% 완료)

**완료된 항목:**
- ✅ 일상점검 모델 및 API
- ✅ 정기점검 모델 및 API
- ✅ GPS 위치 모델
- ✅ 알람 시스템

**미완성 항목:**
- ❌ QR 스캔 API
- ❌ 생산수량 입력 및 타수 자동 누적
- ❌ 점검 스케줄 자동 업데이트
- ❌ 모바일 대시보드 (생산처)

### Week 3: 수리·이관 관리 ⏳ (40% 완료)

**완료된 항목:**
- ✅ 수리 기본 모델
- ✅ 이관 기본 모델
- ✅ 수리 관리 페이지
- ✅ 이관 관리 페이지

**미완성 항목:**
- ❌ 수리 귀책 협의 워크플로우
- ❌ 이관 4M 체크리스트
- ❌ 제작 진행 기록
- ❌ 시운전 결과
- ❌ 모바일 대시보드 (제작처)

### Week 4: 프론트엔드 UI/UX ⏳ (30% 완료)

**완료된 항목:**
- ✅ 로그인 페이지 (Apple Design System)
- ✅ 기본 대시보드
- ✅ 금형 목록/상세 페이지

**미완성 항목:**
- ❌ 사용자 유형별 대시보드 (4개)
- ❌ 모바일 최적화
- ❌ 관리자 템플릿 관리 UI
- ❌ Railway 배포

---

## 📈 전체 진행률

| 카테고리 | 완료 | 전체 | 진행률 |
|---------|------|------|--------|
| 데이터베이스 테이블 | 25 | 52 | 48% |
| Sequelize 모델 | 25 | 52 | 48% |
| API 라우트 | 10 | 30+ | 33% |
| 프론트엔드 페이지 | 15 | 25+ | 60% |
| **전체** | **75** | **159+** | **47%** |

---

## 🚨 주요 이슈 및 개선 필요 사항

### 1. **모델 불일치**
- User.js와 Mold.js가 함수 기반 모델 (구버전)
- 나머지 모델은 클래스 기반 모델 (신버전)
- **해결 방법**: 모든 모델을 클래스 기반으로 통일

### 2. **API URL 불일치**
- 프론트엔드: `http://localhost:3001` (기본값)
- 백엔드: `http://localhost:5000` (실제 실행 포트)
- **해결 방법**: ✅ 이미 수정됨 (api.js 파일)

### 3. **테스트 서버 vs 실제 서버**
- testServer.js: 간단한 테스트용 (로그인 API만)
- server.js: 전체 기능 포함 (모델 충돌로 실행 불가)
- **해결 방법**: 모델 통일 후 server.js 사용

### 4. **미완성 핵심 기능**
- QR 스캔 및 세션 관리
- 생산수량 기반 타수 자동 누적
- 금형개발계획 12단계 공정 관리
- 제작전 체크리스트 81개 항목
- 모바일 대시보드 (생산처/제작처)

---

## 🎯 다음 단계 권장 사항

### 즉시 수행 (Week 1 완료)
1. ✅ User.js와 Mold.js를 클래스 기반 모델로 변환
2. ✅ QR 세션 관리 테이블 및 모델 생성
3. ✅ 금형개발계획 시스템 구축 (2개 테이블)
4. ✅ 제작전 체크리스트 시스템 구축 (2개 테이블)

### 단기 목표 (Week 2)
1. ❌ QR 스캔 API 구현
2. ❌ 생산수량 입력 및 타수 자동 누적
3. ❌ 점검 스케줄 자동 업데이트
4. ❌ 모바일 대시보드 (생산처) 구현

### 중기 목표 (Week 3)
1. ❌ 수리 귀책 협의 워크플로우
2. ❌ 이관 4M 체크리스트
3. ❌ 제작 진행 및 시운전 결과
4. ❌ 모바일 대시보드 (제작처) 구현

### 장기 목표 (Week 4)
1. ❌ 사용자 유형별 대시보드 (4개)
2. ❌ 관리자 템플릿 관리 UI
3. ❌ 모바일 최적화
4. ❌ Railway 배포

---

## 📝 결론

**현재 상태**: 기반 구축 단계 (Week 1) 80% 완료  
**다음 목표**: Week 1 완료 → Week 2 QR 스캔 및 점검 시스템 구축

**핵심 과제**:
1. 모델 통일 (클래스 기반)
2. QR 스캔 시스템 구현
3. 생산수량 기반 타수 관리
4. 모바일 대시보드 구축

**예상 완료 시점**: 4주 (Week 1-4 계획 기준)

---

**작성자**: Cascade AI  
**문서 버전**: 1.0  
**최종 업데이트**: 2025-11-20
