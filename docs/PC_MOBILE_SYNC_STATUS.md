# PC/모바일 동기화 현황표

## 동기화 원칙
- PC/모바일은 동일한 API 사용
- 동일한 DB 테이블 참조
- 입력값 상호 동기화

---

## 1. 사출조건 관리 ✅ 완료

| 구분 | PC | 모바일 | API | DB 테이블 |
|------|-----|--------|-----|-----------|
| 페이지 | InjectionCondition.jsx | MobileInjectionCondition.jsx | injectionConditionAPI | injection_conditions |
| 이력 | InjectionHistory.jsx | MobileInjectionHistory.jsx | injectionConditionAPI.getHistory | injection_condition_history |
| 통계 | InjectionStats.jsx | MobileInjectionStats.jsx | injectionConditionAPI.getStats | injection_conditions |

**동기화 상태**: ✅ 완료 - 동일 API, 동일 테이블

---

## 2. 금형이관 ✅ 완료

| 구분 | PC | 모바일 | API | DB 테이블 |
|------|-----|--------|-----|-----------|
| 목록 | TransferManagement.jsx | MobileTransferList.jsx | transferAPI | transfers |
| 요청 | TransferRequest.jsx | MobileTransferRequest.jsx | transferAPI | transfers |
| 승인 | TransferManagement.jsx | MobileTransferList.jsx | transferAPI.approve | transfer_approvals |

**동기화 상태**: ✅ 완료 - 동일 API, 동일 테이블

---

## 3. 금형수리 ✅ 완료

| 구분 | PC | 모바일 | API | DB 테이블 |
|------|-----|--------|-----|-----------|
| 목록 | HqRepairListPage.jsx | RepairRequestListPage.tsx | repairRequestAPI | repair_requests |
| 요청 | RepairRequestPage.jsx | MobileRepairRequestForm.jsx | repairRequestAPI | repair_requests |

**동기화 상태**: ✅ 완료 - 동일 API, 동일 테이블
- 2024-12-10: HqRepairListPage.jsx를 `/repair-requests` API로 통일
- 2024-12-10: MobileRepairRequestForm.jsx에 repairRequestAPI 적용

---

## 4. 금형정보 ✅ 완료

| 구분 | PC | 모바일 | API | DB 테이블 |
|------|-----|--------|-----|-----------|
| 상세 | MoldDetailNew.jsx | MobileMoldDetailNew.jsx | moldSpecificationAPI | mold_specifications |
| 사양 | MoldSpecification.jsx | MobileMoldSpecification.jsx | moldSpecificationAPI | mold_specifications |

**동기화 상태**: ✅ 완료 - 동일 API, 동일 테이블

---

## 5. 금형개발 ✅ 완료

| 구분 | PC | 모바일 | API | DB 테이블 |
|------|-----|--------|-----|-----------|
| 개발계획 | MoldDevelopmentPlan.jsx | MobileDevelopmentPlan.jsx | api.get/post('/dev-plans') | dev_plans |
| 체크리스트 | MoldChecklist.jsx | MobileMoldChecklist.jsx | api.get('/checklist-templates') | checklist_master_templates |
| 금형육성 | MoldDevelopmentPlan.jsx | MobileMoldNurturing.jsx | api.get/post('/dev-plans') | dev_plans |
| 경도측정 | HardnessMeasurement.jsx | MobileHardnessMeasurement.jsx | api.get/post('/hardness') | hardness_measurements |

**동기화 상태**: ✅ 완료 - 동일 API, 동일 테이블

---

## 6. 점검 관리 ✅ 완료

| 구분 | PC | 모바일 | API | DB 테이블 |
|------|-----|--------|-----|-----------|
| 일상점검 | DailyChecklistNew.jsx | ChecklistStartPage.jsx | checklistAPI | daily_checks |
| 정기점검 | PeriodicInspectionNew.jsx | ChecklistStartPage.jsx | api.get('/inspections') | periodic_inspections |

**동기화 상태**: ✅ 완료 - 동일 API, 동일 테이블

---

## 7. 중량/원재료 ✅ 완료

| 구분 | PC | 모바일 | API | DB 테이블 |
|------|-----|--------|-----|-----------|
| 중량 | InjectionCondition.jsx | MobileInjectionCondition.jsx | weightAPI | weight_history |
| 원재료 | InjectionCondition.jsx | MobileInjectionCondition.jsx | materialAPI | material_history |

**동기화 상태**: ✅ 완료 - 동일 API, 동일 테이블

---

## 수정 완료 항목

### 2024-12-10 완료
- [x] HqRepairListPage.jsx: `/hq/repairs` → `repairRequestAPI` 변경 완료
- [x] MobileRepairRequestForm.jsx: `repairRequestAPI` 적용 완료
- [x] MobileTransferRequest.jsx: 신규 생성 완료
- [x] MobileTransferList.jsx: 신규 생성 완료

---

## API 목록 (api.js)

| API | 용도 |
|-----|------|
| authAPI | 인증 |
| moldAPI | 금형 마스터 |
| moldSpecificationAPI | 금형 사양 |
| checklistAPI | 점검 |
| alertAPI | 알림 |
| transferAPI | 이관 |
| repairRequestAPI | 수리요청 |
| reportAPI | 리포트 |
| moldImageAPI | 이미지 |
| makerSpecificationAPI | 제작처 사양 |
| injectionConditionAPI | 사출조건 |
| weightAPI | 중량 |
| materialAPI | 원재료 |
| masterDataAPI | 기초데이터 |
