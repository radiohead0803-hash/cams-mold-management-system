# 시스템 통합 점검 문서

**QR + GPS 기반 금형관리시스템 Ver.09**

최종 업데이트: 2024-01-18

---

## 📋 문서 개요

이 문서는 전체 시스템의 데이터 흐름, 스키마, 대시보드 구성의 일관성을 점검하고 검증하는 문서입니다.

---

## ✅ 1. 사용자 유형 일관성 점검

### 1.1 사용자 유형 정의 (4가지)

| 유형 코드 | 한글명 | 영문 설명 | 대시보드 라우트 |
|----------|--------|----------|----------------|
| `system_admin` | CAMS 시스템 관리 담당 (본사) | System Administrator | `/dashboard/system-admin` |
| `mold_developer` | 금형개발 담당 (본사) | Mold Developer | `/dashboard/mold-developer` |
| `maker` | 금형제작처 | Mold Maker | `/dashboard/maker` |
| `plant` | 생산처 | Production Plant | `/dashboard/plant` |

### 1.2 데이터베이스 스키마 일치 확인

**users 테이블**:
```sql
user_type VARCHAR(20) NOT NULL
-- 'system_admin', 'mold_developer', 'maker', 'plant'
```

**적용 문서**:
- ✅ `DATABASE_SCHEMA.md` - users 테이블
- ✅ `LOGIN_AND_PERMISSIONS.md` - 사용자 유형 정의
- ✅ `DASHBOARD_GUIDE.md` - 대시보드 매핑
- ✅ `WORKFLOW_SUMMARY.md` - 4단 역할 구조
- ✅ `DATA_FLOW_ARCHITECTURE.md` - JWT 토큰 구조
- ✅ `README.md` - 개발 일정

---

## ✅ 2. 데이터 흐름 일관성 점검

### 2.1 전체 데이터 흐름

```
[본사 CAMS] 금형제작사양 입력
    ↓ 자동 연동
[제작처] 제작전 체크리스트 작성 → 승인
    ↓ 제작 시작
[제작처] 제작 진행 등록 → 시운전 → 제작완료 체크리스트
    ↓ 승인 후 자동 생성
[금형 마스터] molds 테이블 생성 + QR 코드 발급
    ↓ 자동 연동
[생산처] QR 스캔 → 일상점검 + 생산수량 입력
    ↓ 타수 누적
[금형 마스터] current_shots 자동 업데이트
    ↓ 임계값 도달 시
[알람 시스템] 정기점검 알람 자동 생성
```

### 2.2 주요 테이블 연동 관계

| 단계 | 입력 테이블 | 출력 테이블 | 자동 처리 |
|------|-----------|-----------|----------|
| 본사 입력 | `mold_specifications` | `maker_specifications` | 자동 연동 |
| 제작 완료 | `maker_specifications` | `molds` | 승인 후 자동 생성 |
| 생산 시작 | `molds` | `plant_molds` | 자동 연동 |
| 일상점검 | `daily_checks` | `production_quantities` | 생산수량 필수 |
| 생산수량 입력 | `production_quantities` | `molds.current_shots` | 자동 누적 |
| 타수 임계값 | `molds.current_shots` | `notifications` | 알람 자동 생성 |

### 2.3 적용 문서

- ✅ `DATA_FLOW_ARCHITECTURE.md` - 전체 데이터 흐름 정의
- ✅ `DATABASE_SCHEMA.md` - 테이블 구조 및 관계
- ✅ `WORKFLOW_SUMMARY.md` - 10단계 Lifecycle
- ✅ `DASHBOARD_GUIDE.md` - 대시보드 데이터 연동

---

## ✅ 3. 모바일 대시보드 구성 점검

### 3.1 제작처 모바일 대시보드

**화면 구성**:
1. 금형 정보 카드 (QR 스캔 후 로드)
2. 제작 진행 등록
3. 시운전 결과 입력
4. QR 코드 재발급
5. 수리 작업 시작
6. 귀책 협의 참여
7. 작업 이력 조회

**데이터 흐름**:
```javascript
QR 스캔 → GET /api/qr-scan/:qr_code
제작 진행 → POST /api/mobile/maker/production-progress
시운전 → POST /api/mobile/maker/trial-run
```

**관련 테이블**:
- `molds` - 금형 마스터
- `production_progress` - 제작 진행 기록
- `trial_run_results` - 시운전 결과
- `gps_locations` - GPS 위치 이력

### 3.2 생산처 모바일 대시보드

**화면 구성**:
1. 금형 정보 카드 (타수 현황 포함)
2. 일상점검 + 생산수량 입력
3. 정기점검
4. 생산수량만 빠르게 입력
5. 세척/습합
6. 수리 요청
7. 이관 요청
8. 점검 이력 조회

**데이터 흐름**:
```javascript
QR 스캔 → GET /api/qr-scan/:qr_code
일상점검 → POST /api/mobile/daily-inspection
생산수량 → POST /api/mobile/production-quantity
수리요청 → POST /api/mobile/repair-request
이관요청 → POST /api/mobile/transfer-request
```

**관련 테이블**:
- `molds` - 금형 마스터 (타수 누적)
- `daily_checks` - 일상점검 기록
- `production_quantities` - 생산수량 기록
- `repairs` - 수리 요청
- `transfer_logs` - 이관 요청
- `gps_locations` - GPS 위치 이력
- `notifications` - 알람

### 3.3 적용 문서

- ✅ `DASHBOARD_GUIDE.md` - 모바일 대시보드 UI/UX
- ✅ `DATA_FLOW_ARCHITECTURE.md` - 모바일 API 및 자동 처리
- ✅ `DATABASE_SCHEMA.md` - 관련 테이블 정의
- ✅ `UI_UX_SPECIFICATIONS.md` - 모바일 최적화 스타일

---

## ✅ 4. 데이터베이스 스키마 점검

### 4.1 총 테이블 수: 52개

**주요 변경사항**: 습합점검(`fitting_checks`)과 세척점검(`cleaning_checks`)은 정기점검(`inspections`) 내 체크리스트 항목으로 통합

**카테고리별 분류**:

| 카테고리 | 테이블 수 | 주요 테이블 |
|---------|----------|-----------|
| 1. 사용자 및 권한 | 2 | `users`, `qr_sessions` |
| 2. 데이터 흐름 및 자동 연동 | 4 | `mold_specifications`, `maker_specifications`, `plant_molds`, `stage_change_history` |
| 3. 금형정보 관리 | 13 | `molds`, `mold_development`, `development_plan`, **체크리스트 시스템 4개**: `mold_project`, `mold_project_items`, `checklist_master_templates`, `checklist_template_items` |
| 4. 사출정보 관리 | 5 | `plant_info`, `injection_conditions`, `production_lines` |
| 5. 점검 관리 | 4 | `daily_checks`, `inspections` (정기점검: 1차/2차/3차, 습합/세척 통합), `inspection_items`, `inspection_history` |
| 6. 수리 관리 | 3 | `repairs`, `repair_management`, `repair_progress` |
| 7. 이관 관리 | 4 | `transfer_logs`, `transfer_management`, `transfer_checklist`, `transfer_approvals` |
| 8. 금형 폐기 관리 | 3 | `scrapping_requests`, `scrapping_approvals`, `scrapping_history` |
| 9. 관리자 수정 및 배포 관리 | 4 | `document_master_templates`, `checklist_template_deployment`, `checklist_template_history`, `template_deployment_log` |
| 10. 기타 | 8 | `shots`, `notifications`, `production_quantities`, `production_progress`, `trial_run_results`, `gps_locations` |

### 4.2 체크리스트 시스템 (카테고리 3)

**체크리스트 유형**: 제작완료, 수리완료, 정기점검, 이관전

**8개 카테고리**: 외관, 치수, 기능, 안전, 구조, 부품, 성능, 문서

**테이블 구조**:

1. **checklist_master_templates** - 체크리스트 마스터 템플릿
   - 템플릿 유형별 표준 정의
   - 버전 관리 (v1.0, v1.1, v2.0)
   - 8개 카테고리별 템플릿 (JSONB)

2. **checklist_template_items** - 템플릿 항목 마스터
   - 각 템플릿의 상세 항목 정의
   - 점검 기준, 합격 기준
   - 필수 항목 여부, 중요도

3. **mold_project** - 금형 체크리스트 (실제 점검 기록)
   - 템플릿 기반 자동 생성
   - 8개 카테고리별 점검 결과 (JSONB)
   - 종합 결과 및 승인 프로세스

4. **mold_project_items** - 체크리스트 상세 항목
   - 각 항목별 점검 결과
   - 측정값, 기준값, 상태 (OK/NG/N/A)
   - 불량 내용 및 조치 방법

**연동 흐름**:
```
[템플릿 생성]
checklist_master_templates → checklist_template_items

[체크리스트 생성]
템플릿 선택 → mold_project 자동 생성 → mold_project_items 자동 생성

[점검 수행]
mold_project_items 입력 → mold_project 종합 결과 자동 계산

[승인 프로세스]
mold_project.approval_required = true → 본사 승인 → 상태 변경
```

### 4.3 모바일 대시보드 전용 테이블 (신규 추가)

1. **production_quantities** - 생산수량 기록
   - 일상점검과 연동
   - GPS 위치 자동 기록
   - 타수 자동 누적

2. **production_progress** - 제작 진행 기록
   - 제작처 작업 단계 관리
   - 진행률 자동 계산

3. **trial_run_results** - 시운전 결과
   - PASS/FAIL 판정
   - 본사 승인 프로세스

4. **gps_locations** - GPS 위치 이력
   - 모든 작업의 GPS 기록
   - 위치 추적 및 이력 관리

### 4.3 적용 문서

- ✅ `DATABASE_SCHEMA.md` - 전체 테이블 정의
- ✅ `README.md` - 테이블 수 및 카테고리

---

## ✅ 5. API 엔드포인트 일관성 점검

### 5.1 QR 스캔 관련 API

| API | 메서드 | 설명 | 관련 문서 |
|-----|--------|------|----------|
| `/api/qr-scan/:qr_code` | GET | QR 스캔 후 금형 정보 로드 | DATA_FLOW_ARCHITECTURE.md |
| `/api/qr/generate` | POST | QR 코드 생성 | API_SPEC.md |

### 5.2 생산처 모바일 API

| API | 메서드 | 설명 | 테이블 |
|-----|--------|------|--------|
| `/api/mobile/daily-inspection` | POST | 일상점검 + 생산수량 입력 | `daily_checks`, `production_quantities` |
| `/api/mobile/production-quantity` | POST | 생산수량만 입력 | `production_quantities` |
| `/api/mobile/repair-request` | POST | 수리 요청 생성 | `repairs` |
| `/api/mobile/transfer-request` | POST | 이관 요청 생성 | `transfer_logs` |

### 5.3 제작처 모바일 API

| API | 메서드 | 설명 | 테이블 |
|-----|--------|------|--------|
| `/api/mobile/maker/production-progress` | POST | 제작 진행 등록 | `production_progress` |
| `/api/mobile/maker/trial-run` | POST | 시운전 결과 입력 | `trial_run_results` |

### 5.4 적용 문서

- ✅ `DATA_FLOW_ARCHITECTURE.md` - 모바일 API 정의
- ✅ `API_SPEC.md` - 전체 API 명세

---

## ✅ 6. 자동 처리 로직 점검

### 6.1 타수 자동 누적

**트리거**: 생산수량 입력 시
```javascript
await Mold.update(
  { current_shots: sequelize.literal(`current_shots + ${quantity}`) },
  { where: { id: mold_id } }
);
```

**관련 테이블**:
- `production_quantities` → `molds.current_shots`

### 6.2 점검 스케줄 자동 업데이트

**트리거**: 타수 누적 후
```javascript
if (mold.current_shots >= mold.next_inspection_shots) {
  await createAlarm({
    type: 'inspection_required',
    priority: 'high'
  });
}
```

**관련 테이블**:
- `molds.current_shots` → `notifications`

### 6.3 금형 마스터 자동 생성

**트리거**: 제작완료 체크리스트 승인 시
```javascript
await Mold.create({
  mold_code: generateMoldCode(),
  qr_token: generateQRToken(),
  ...makerSpecData
});
```

**관련 테이블**:
- `maker_specifications` → `molds`

### 6.4 GPS 위치 자동 기록

**트리거**: 모든 QR 스캔 작업 시
```javascript
await GPSLocation.create({
  mold_id: data.mold_id,
  latitude: data.gps_latitude,
  longitude: data.gps_longitude,
  recorded_by: user_id
});
```

**관련 테이블**:
- 모든 모바일 작업 → `gps_locations`

### 6.5 적용 문서

- ✅ `DATA_FLOW_ARCHITECTURE.md` - 자동 처리 로직
- ✅ `PRODUCTION_QUANTITY_WORKFLOW.md` - 생산수량 워크플로우

---

## ✅ 7. 실시간 동기화 점검

### 7.1 WebSocket 이벤트

| 이벤트명 | 트리거 | 구독 대상 |
|---------|--------|----------|
| `mold:status:changed` | 금형 상태 변경 시 | 본사, 관련 생산처/제작처 |
| `mold:shots:updated` | 타수 업데이트 시 | 본사, 해당 생산처 |
| `alarm:created` | 알람 생성 시 | 해당 사용자 |
| `mold:location:updated` | GPS 위치 업데이트 시 | 본사, 관련 담당자 |

### 7.2 적용 문서

- ✅ `DATA_FLOW_ARCHITECTURE.md` - WebSocket 이벤트 정의

---

## ✅ 8. 문서 간 일관성 검증

### 8.1 핵심 개념 일치 확인

| 개념 | 정의 | 적용 문서 수 | 일관성 |
|------|------|-------------|--------|
| 사용자 유형 4가지 | system_admin, mold_developer, maker, plant | 6개 | ✅ 일치 |
| 금형 Lifecycle 10단계 | 개발→설계→제작→시운전→양산→수리→유지보전→이관→보관→폐기 | 3개 | ✅ 일치 |
| QR + GPS 기반 운영 | 모든 작업 QR 스캔 시작 + GPS 자동 기록 | 5개 | ✅ 일치 |
| 일상점검 10개 카테고리 | 정결관리, 작동부, 냉각, 온도전기, 재결, 취출, 윤활, 이상, 외관, 방청 | 3개 | ✅ 일치 |
| 정기점검 3단계 | 1차(100K), 2차(500K), 3차(1M) | 4개 | ✅ 일치 |

### 8.2 데이터 흐름 일치 확인

| 흐름 | 시작 | 종료 | 문서 수 | 일관성 |
|------|------|------|---------|--------|
| 본사→제작처 | mold_specifications | maker_specifications | 2개 | ✅ 일치 |
| 제작처→마스터 | maker_specifications | molds | 2개 | ✅ 일치 |
| 마스터→생산처 | molds | plant_molds | 2개 | ✅ 일치 |
| QR 스캔→작업 | qr_scan | daily_checks/production_progress | 2개 | ✅ 일치 |
| 생산수량→타수 | production_quantities | molds.current_shots | 2개 | ✅ 일치 |

---

## ✅ 9. 개발 일정 점검

### 9.1 Week 1-4 일정과 데이터베이스 카테고리 매핑

| 주차 | 주요 작업 | 데이터베이스 카테고리 | 테이블 수 | 핵심 테이블 |
|------|----------|---------------------|----------|-----------|
| Week 1 | 기반 구축 및 인증 | 카테고리 1-3 (일부) | 11개 | `users`, `qr_sessions`, `mold_specifications`, `maker_specifications`, `plant_molds`, `molds` |
| Week 2 | QR 스캔 및 점검 | 카테고리 4-5, 10 (일부) | 13개 | `daily_checks`, `inspections` (습합/세척 통합), `production_quantities`, `gps_locations`, `notifications` |
| Week 3 | 수리·이관·유지보전 | 카테고리 6-8, 10 (일부) | 12개 | `repairs`, `transfer_logs`, `production_progress`, `trial_run_results` |
| Week 4 | UI/UX 및 배포 | 카테고리 9, 3 (나머지), 10 (나머지) | 16개 | `document_master_templates`, `template_deployment_log`, `comments`, `mold_images` |

**총 52개 테이블 = 11 (Week 1) + 13 (Week 2) + 12 (Week 3) + 16 (Week 4)**

**변경사항**: Week 2에서 `fitting_checks`와 `cleaning_checks` 테이블 제거 (정기점검 내 체크리스트로 통합), 15개 → 13개

### 9.2 적용 문서

- ✅ `README.md` - 개발 일정 요약
- ✅ `WEEK1_DEVELOPMENT.md` ~ `WEEK4_DEVELOPMENT.md` - 주차별 상세

---

## ✅ 10. 최종 검증 결과

### 10.1 점검 항목별 결과

| 점검 항목 | 상태 | 비고 |
|----------|------|------|
| 사용자 유형 일관성 | ✅ 통과 | user_type 필드명 통일 완료 |
| 데이터 흐름 일관성 | ✅ 통과 | 본사→제작처→마스터→생산처 흐름 일치 |
| 모바일 대시보드 구성 | ✅ 통과 | 제작처/생산처 대시보드 완전 정의 |
| 데이터베이스 스키마 | ✅ 통과 | 54개 테이블, 모바일 전용 테이블 추가 |
| API 엔드포인트 | ✅ 통과 | 모바일 API 완전 정의 |
| 자동 처리 로직 | ✅ 통과 | 타수 누적, 알람 생성 등 자동화 |
| 실시간 동기화 | ✅ 통과 | WebSocket 이벤트 정의 |
| 문서 간 일관성 | ✅ 통과 | 핵심 개념 및 데이터 흐름 일치 |
| 개발 일정 | ✅ 통과 | Week 1-4 문서 매핑 완료 |

### 10.2 개선 사항

1. ✅ **완료**: users 테이블 필드명 `role_group` → `user_type` 통일
2. ✅ **완료**: 모바일 대시보드 전용 테이블 4개 추가
3. ✅ **완료**: DATA_FLOW_ARCHITECTURE.md에 모바일 데이터 흐름 추가
4. ✅ **완료**: DASHBOARD_GUIDE.md에 QR 스캔 후 모바일 대시보드 추가

### 10.3 권장 사항

1. **API 문서 업데이트**: `API_SPEC.md`에 모바일 API 엔드포인트 추가
2. **테스트 시나리오 작성**: 각 사용자 유형별 E2E 테스트 시나리오
3. **성능 최적화**: 타수 누적 시 대량 데이터 처리 최적화
4. **보안 강화**: JWT 토큰 갱신 로직 및 세션 관리 강화

---

## 📊 문서 참조 매트릭스

| 문서명 | 사용자 유형 | 데이터 흐름 | 대시보드 | 스키마 | API |
|--------|-----------|-----------|---------|--------|-----|
| README.md | ✅ | ✅ | ✅ | ✅ | - |
| DATABASE_SCHEMA.md | ✅ | ✅ | - | ✅ | - |
| DATA_FLOW_ARCHITECTURE.md | ✅ | ✅ | ✅ | - | ✅ |
| DASHBOARD_GUIDE.md | ✅ | - | ✅ | - | - |
| LOGIN_AND_PERMISSIONS.md | ✅ | - | ✅ | - | - |
| WORKFLOW_SUMMARY.md | ✅ | ✅ | - | - | - |
| UI_UX_SPECIFICATIONS.md | - | - | ✅ | - | - |
| WEEK1-4_DEVELOPMENT.md | ✅ | ✅ | ✅ | ✅ | ✅ |

---

**최종 검증 완료**: 2024-01-18
**검증자**: Cascade AI
**상태**: ✅ 전체 시스템 일관성 확인 완료
