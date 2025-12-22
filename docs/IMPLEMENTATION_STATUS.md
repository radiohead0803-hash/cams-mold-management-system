# CAMS 금형관리 시스템 - 구현 현황

## 📅 최종 업데이트: 2025-12-22

이 문서는 구현 현황 요약 문서입니다. 실제 동작 기준은 `server/src/app.js`의 라우팅 설정을 따릅니다.

---

## ✅ 백엔드 API 구현 현황

### 1. 금형 관리
| API | 경로 | 상태 |
|-----|------|------|
| 금형 목록 | GET /api/v1/molds | ✅ |
| 금형 상세 | GET /api/v1/molds/:id | ✅ |
| 금형 등록 | POST /api/v1/molds | ✅ |
| 금형 수정 | PUT /api/v1/molds/:id | ✅ |
| 금형 삭제 | DELETE /api/v1/molds/:id | ✅ |
| 금형 사양 | GET /api/v1/mold-specifications | ✅ |

### 2. 점검 관리
| API | 경로 | 상태 |
|-----|------|------|
| 일상점검 목록 | GET /api/v1/daily-checks | ✅ |
| 일상점검 등록 | POST /api/v1/daily-checks | ✅ |
| 정기점검 목록 | GET /api/v1/periodic-inspections | ✅ |
| 정기점검 등록 | POST /api/v1/periodic-inspections | ✅ |
| 정기점검 상세 | GET /api/v1/periodic-inspections/:id | ✅ |
| 다음 정기점검 정보 | GET /api/v1/periodic-inspections/mold/:moldId/next | ✅ |

### 2-1. 점검 승인/워크플로우
| API | 경로 | 상태 |
|-----|------|------|
| 점검 목록 | GET /api/v1/inspections | ✅ |
| 승인 대기 목록 | GET /api/v1/inspections/pending | ✅ |
| 점검 상세 | GET /api/v1/inspections/:id | ✅ |
| 일상점검 제출 | POST /api/v1/inspections/daily | ✅ |
| 정기점검 제출 | POST /api/v1/inspections/periodic | ✅ |
| 점검 수정 | PATCH /api/v1/inspections/:id | ✅ |
| 점검 승인 | POST /api/v1/inspections/:id/approve | ✅ |
| 점검 반려 | POST /api/v1/inspections/:id/reject | ✅ |

### 3. 체크리스트 관리
| API | 경로 | 상태 |
|-----|------|------|
| 제작전 체크리스트 목록 | GET /api/v1/pre-production-checklist | ✅ |
| 제작전 체크리스트 상세 | GET /api/v1/pre-production-checklist/:id | ✅ |
| 제작전 체크리스트 생성 | POST /api/v1/pre-production-checklist | ✅ |
| 체크리스트 결과 저장 | PATCH /api/v1/pre-production-checklist/:id/results | ✅ |
| 체크리스트 제출 | POST /api/v1/pre-production-checklist/:id/submit | ✅ |
| 체크리스트 승인 | POST /api/v1/pre-production-checklist/:id/approve | ✅ |
| 체크리스트 반려 | POST /api/v1/pre-production-checklist/:id/reject | ✅ |
| 이관 4M 체크리스트 | GET /api/v1/transfers/:id/4m-checklist | ✅ |
| 반출/입고 체크리스트 | GET /api/v1/transfers/:id/shipping-checklist | ✅ |

### 4. 유지보전 관리
| API | 경로 | 상태 |
|-----|------|------|
| 유지보전 목록 | GET /api/v1/maintenance | ✅ |
| 유지보전 상세 | GET /api/v1/maintenance/:id | ✅ |
| 유지보전 등록 | POST /api/v1/maintenance | ✅ |
| 유지보전 수정 | PUT /api/v1/maintenance/:id | ✅ |
| 유지보전 통계 | GET /api/v1/maintenance/statistics | ✅ |

### 5. 금형 폐기 관리
| API | 경로 | 상태 |
|-----|------|------|
| 폐기 요청 목록 | GET /api/v1/scrapping | ✅ |
| 폐기 요청 상세 | GET /api/v1/scrapping/:id | ✅ |
| 폐기 요청 등록 | POST /api/v1/scrapping | ✅ |
| 1차 승인 | POST /api/v1/scrapping/:id/first-approve | ✅ |
| 최종 승인 | POST /api/v1/scrapping/:id/approve | ✅ |
| 폐기 완료 | POST /api/v1/scrapping/:id/complete | ✅ |
| 폐기 통계 | GET /api/v1/scrapping/statistics | ✅ |

### 6. 알림 관리
| API | 경로 | 상태 |
|-----|------|------|
| 알림 목록 | GET /api/v1/alerts | ✅ |
| 알림 상세 | GET /api/v1/alerts/:id | ✅ |
| 알림 읽음 처리 | PATCH /api/v1/alerts/:id/read | ✅ |
| 알림 트리거 | POST /api/v1/alerts/trigger | ✅ |
| 예방 알람 체크 | POST /api/v1/alerts/check-all | ✅ |

### 6-1. 내 알림함
| API | 경로 | 상태 |
|-----|------|------|
| 내 알림 목록 | GET /api/v1/notifications | ✅ |
| 읽지 않은 알림 개수 | GET /api/v1/notifications/unread-count | ✅ |
| 모든 알림 읽음 처리 | PATCH /api/v1/notifications/read-all | ✅ |
| 알림 읽음 처리 | PATCH /api/v1/notifications/:id/read | ✅ |
| 알림 삭제 | DELETE /api/v1/notifications/:id | ✅ |

### 7. 통계 API
| API | 경로 | 상태 |
|-----|------|------|
| 금형 통계 | GET /api/v1/statistics/molds | ✅ |
| 점검 통계 | GET /api/v1/statistics/inspections | ✅ |
| 수리 통계 | GET /api/v1/statistics/repairs | ✅ |
| 체크리스트 통계 | GET /api/v1/statistics/checklists | ✅ |
| 대시보드 통계 | GET /api/v1/statistics/dashboard | ✅ |

### 8. 인증 및 사용자 관리
| API | 경로 | 상태 |
|-----|------|------|
| 로그인 | POST /api/v1/auth/login | ✅ |
| 토큰 갱신 | POST /api/v1/auth/refresh | ✅ |
| 로그아웃 | POST /api/v1/auth/logout | ✅ |
| 사용자 목록 | GET /api/v1/users | ✅ |
| 사용자 상세 | GET /api/v1/users/:id | ✅ |
| 사용자 등록 | POST /api/v1/users | ✅ |
| 사용자 수정 | PUT /api/v1/users/:id | ✅ |

### 9. QR 및 모바일
| API | 경로 | 상태 |
|-----|------|------|
| QR 스캔 | POST /api/v1/mobile/qr/scan | ✅ |
| QR 로그인 | POST /api/v1/mobile/qr/login | ✅ |
| QR 세션 확인 | GET /api/v1/mobile/qr/session/:token | ✅ |
| 모바일 금형 목록 | GET /api/v1/mobile/molds | ✅ |
| 모바일 금형 상세 | GET /api/v1/mobile/molds/:id | ✅ |

### 10. 이관 관리
| API | 경로 | 상태 |
|-----|------|------|
| 이관 목록 | GET /api/v1/transfers | ✅ |
| 이관 상세 | GET /api/v1/transfers/:id | ✅ |
| 이관 요청 | POST /api/v1/transfers | ✅ |
| 이관 승인 | POST /api/v1/transfers/:id/approve | ✅ |
| 4M 체크리스트 | GET /api/v1/transfers/:id/4m-checklist | ✅ |
| 반출/입고 체크리스트 | GET /api/v1/transfers/:id/shipping-checklist | ✅ |

### 11. 수리 요청
| API | 경로 | 상태 |
|-----|------|------|
| 수리요청 목록 | GET /api/v1/repair-requests | ✅ |
| 수리요청 상세 | GET /api/v1/repair-requests/:id | ✅ |
| 수리요청 등록 | POST /api/v1/repair-requests | ✅ |
| 수리요청 수정 | PUT /api/v1/repair-requests/:id | ✅ |

### 12. 기타 API
| API | 경로 | 상태 |
|-----|------|------|
| 승인 워크플로우 | /api/v1/workflow/* | ✅ |
| 사출조건 관리 | /api/v1/injection-conditions/* | ✅ |
| 중량 관리 | /api/v1/weight/* | ✅ |
| 원재료 관리 | /api/v1/material/* | ✅ |
| T/O 문제점 | /api/v1/tryout-issues/* | ✅ |
| 파일 업로드 | /api/v1/files/* | ✅ |
| 회사 관리 | /api/v1/companies/* | ✅ |

### 13. 리포트 및 알림 발송 (신규)
| API | 경로 | 상태 |
|-----|------|------|
| 점검 리포트 PDF | GET /api/v1/reports/pdf/inspection/:moldId | ✅ |
| 통계 리포트 PDF | GET /api/v1/reports/pdf/statistics | ✅ |
| 이메일 테스트 발송 | POST /api/v1/email/test | ✅ |
| 일일 요약 이메일 | POST /api/v1/email/send-daily-summary | ✅ |
| 이메일 설정 확인 | GET /api/v1/email/config | ✅ |
| 푸시 토큰 등록 | POST /api/v1/push/register | ✅ |
| 푸시 토큰 해제 | POST /api/v1/push/unregister | ✅ |
| 푸시 알림 발송 | POST /api/v1/push/send | ✅ |
| 푸시 설정 확인 | GET /api/v1/push/config | ✅ |

### 14. 캐시 관리 (신규)
| API | 경로 | 상태 |
|-----|------|------|
| 캐시 통계 | GET /api/v1/cache/stats | ✅ |
| 캐시 클리어 | POST /api/v1/cache/clear | ✅ |
| 캐시 무효화 | POST /api/v1/cache/invalidate | ✅ |

### 15. 대시보드 요약 API (신규)
| API | 경로 | 상태 |
|-----|------|------|
| 생산처 대시보드 | GET /api/v1/dashboard-summary/plant | ✅ |
| 제작처 대시보드 | GET /api/v1/dashboard-summary/maker | ✅ |
| 개발담당 대시보드 | GET /api/v1/dashboard-summary/developer | ✅ |
| 관리자 대시보드 | GET /api/v1/dashboard-summary/admin | ✅ |

### 16. 점검 플로우 API (신규)
| API | 경로 | 상태 |
|-----|------|------|
| 점검 시작 | POST /api/v1/inspection-flow/start | ✅ |
| 점검 완료 | POST /api/v1/inspection-flow/complete | ✅ |
| 빠른 수리요청 | POST /api/v1/inspection-flow/quick-repair | ✅ |
| 오늘 점검 현황 | GET /api/v1/inspection-flow/today-status | ✅ |

### 17. 수리 워크플로우 API (신규)
| API | 경로 | 상태 |
|-----|------|------|
| 수리 접수 | POST /api/v1/repair-workflow/:id/accept | ✅ |
| 수리 시작 | POST /api/v1/repair-workflow/:id/start | ✅ |
| 수리 완료 | POST /api/v1/repair-workflow/:id/complete | ✅ |
| 수리 확인 | POST /api/v1/repair-workflow/:id/confirm | ✅ |
| 귀책 협의 시작 | POST /api/v1/repair-workflow/:id/start-liability-discussion | ✅ |
| 귀책 협의 완료 | POST /api/v1/repair-workflow/:id/resolve-liability | ✅ |
| 워크플로우 이력 | GET /api/v1/repair-workflow/:id/history | ✅ |
| TAT 통계 | GET /api/v1/repair-workflow/stats/tat | ✅ |

### 18. 통계/리포트 API (신규)
| API | 경로 | 상태 |
|-----|------|------|
| 점검 완료율 | GET /api/v1/statistics-report/inspection-rate | ✅ |
| 수리 TAT | GET /api/v1/statistics-report/repair-tat | ✅ |
| NG Top | GET /api/v1/statistics-report/ng-top | ✅ |
| 제작처 성과 | GET /api/v1/statistics-report/maker-performance | ✅ |
| 이관 리드타임 | GET /api/v1/statistics-report/transfer-leadtime | ✅ |
| 종합 리포트 | GET /api/v1/statistics-report/summary | ✅ |

### 19. 알람 자동 연계 API (신규)
| API | 경로 | 상태 |
|-----|------|------|
| 모든 알람 체크 | POST /api/v1/alerts/auto/run-all | ✅ |
| 점검 지연 알람 | POST /api/v1/alerts/auto/inspection-overdue | ✅ |
| 타수 경고 알람 | POST /api/v1/alerts/auto/shots-warning | ✅ |
| 알람 유형 목록 | GET /api/v1/alerts/auto/types | ✅ |

### 20. 운영감사/추적 API (신규)
| API | 경로 | 상태 |
|-----|------|------|
| 감사 로그 조회 | GET /api/v1/audit-log | ✅ |
| 엔티티별 이력 | GET /api/v1/audit-log/entity/:type/:id | ✅ |
| 승인/반려 이력 | GET /api/v1/audit-log/approvals | ✅ |
| 귀책비율 변경 이력 | GET /api/v1/audit-log/liability-changes | ✅ |
| 마스터 수정 이력 | GET /api/v1/audit-log/master-changes | ✅ |
| 감사 로그 통계 | GET /api/v1/audit-log/stats | ✅ |

### 21. 권한 관리 API (신규)
| API | 경로 | 상태 |
|-----|------|------|
| 권한 정보 조회 | GET /api/v1/auth/permissions | ✅ |

---

## ✅ 프론트엔드 구현 현황

### 1. PC 페이지
| 페이지 | 경로 | 상태 |
|--------|------|------|
| 대시보드 (시스템 관리자) | /dashboard/admin | ✅ |
| 대시보드 (금형개발 담당) | /dashboard/developer | ✅ |
| 대시보드 (생산처) | /dashboard/plant | ✅ |
| 대시보드 (제작처) | /dashboard/maker | ✅ |
| 금형 목록 | /molds | ✅ |
| 금형 상세 | /molds/:id | ✅ |
| 금형 등록 | /molds/new | ✅ |
| 제작전 체크리스트 | /pre-production-checklist | ✅ |
| 유지보전 관리 | /maintenance | ✅ |
| 금형 폐기 관리 | /scrapping | ✅ |
| 알림 목록 | /alerts | ✅ |
| 알림 설정 | /notification-settings | ✅ |
| 통계 리포트 | /reports | ✅ |
| 금형 이력 | /mold-history/:id | ✅ |
| 금형 이관 | /transfers | ✅ |
| 이관 요청 | /transfers/new | ✅ |

### 2. 모바일 페이지
| 페이지 | 경로 | 상태 |
|--------|------|------|
| 모바일 홈 | /mobile | ✅ |
| 금형 상세 | /mobile/mold/:id | ✅ |
| 일상점검 | /mobile/mold/:id/daily-check | ✅ |
| 정기점검 | /mobile/mold/:id/periodic-check | ✅ |
| 유지보전 | /mobile/maintenance | ✅ |
| 제작전 체크리스트 | /mobile/pre-production-checklist | ✅ |
| 금형 폐기 | /mobile/scrapping | ✅ |
| 수리 요청 | /mobile/repair-request | ✅ |
| 이관 관리 | /mobile/mold/:id/transfer | ✅ |

### 3. 대시보드 위젯
| 위젯 | 설명 | 상태 |
|------|------|------|
| PreProductionChecklistWidget | 제작전 체크리스트 현황 | ✅ |
| MaintenanceWidget | 유지보전 현황 | ✅ |
| ScrappingWidget | 금형 폐기 현황 | ✅ |
| AlertSummaryWidget | 최근 알림 | ✅ |
| InspectionDueWidget | 점검 예정 | ✅ |

### 4. 사이드바 메뉴
| 사용자 유형 | 메뉴 항목 |
|-------------|-----------|
| 시스템 관리자 | 대시보드, 금형개발, 사용자 관리, 알림, 통계 리포트, 제작전 체크리스트, 유지보전, 금형 폐기, 금형 이관 |
| 금형개발 담당 | 대시보드, 금형개발, 사용자 관리, 알림, 통계 리포트, 제작전 체크리스트, 유지보전, 금형 폐기, 금형 이관 |
| 제작처 | 대시보드, 담당 금형, QR 코드 관리, 수리 현황, 알림 |
| 생산처 | 대시보드, 보유 금형, 일상점검, 정기점검, 수리 요청, 알림, 금형 이관 |

### 5. 금형 상세 바로가기 (6개)
| 버튼 | 경로 |
|------|------|
| 일상점검 | /checklist/daily?moldId= |
| 정기점검 | /inspection/periodic?moldId= |
| 유지보전 | /maintenance?moldId= |
| 폐기요청 | /scrapping?moldId= |
| 변경이력 | /mold-history/:id |
| 이관관리 | /mobile/mold/:id/transfer |

---

## ✅ 알림 시스템

### 알림 유형 (16개)
| 유형 | 설명 |
|------|------|
| inspection_due_shots | 타수 기준 점검 예정 |
| inspection_due_date | 일자 기준 점검 예정 |
| inspection_overdue | 점검 지연 |
| maintenance_due | 유지보전 예정 |
| maintenance_completed | 유지보전 완료 |
| pre_production_checklist_reminder | 제작전 체크리스트 알림 |
| pre_production_checklist_submitted | 체크리스트 제출 |
| pre_production_checklist_approved | 체크리스트 승인 |
| pre_production_checklist_rejected | 체크리스트 반려 |
| scrapping_requested | 폐기 요청 |
| scrapping_approved | 폐기 승인 |
| repair_requested | 수리 요청 |
| repair_status | 수리 상태 변경 |
| liability_negotiation | 귀책 협의 |
| transfer_requested | 이관 요청 |
| transfer_4m_required | 4M 체크리스트 필요 |

---

## ✅ 체크리스트 항목

### 1. 제작전 체크리스트 (81개 항목, 9개 카테고리)
- I. 원재료 (9개)
- II. 금형 (10개)
- III. 가스 배기 (9개)
- IV. 성형 해석 (9개)
- V. 싱크마크 (9개)
- VI. 취출 (9개)
- VII. MIC 제품 (9개)
- VIII. 도금 (9개)
- IX. 리어 백빔 (8개)

### 2. 정기점검 항목 (31개 항목, 11개 카테고리)
- 금형 외관 (3개)
- 파팅면 (3개)
- 슬라이드 (3개)
- 이젝터 (3개)
- 냉각 (3개)
- 핫러너 (3개)
- 유압/공압 (3개)
- 센서 (2개)
- 안전장치 (2개)
- 문서 (3개)
- 종합 (3개)

### 3. 이관 4M 체크리스트 (16개 항목)
- Man (4개): 담당자 지정, 교육 완료, 연락처 확인, 인수인계
- Machine (4개): 설비 호환성, 톤수 확인, 인터페이스, 시운전
- Material (4개): 원료 확보, 색상 확인, 건조 조건, 재고 확인
- Method (4개): 작업 표준서, 품질 기준, 검사 방법, 포장 사양

### 4. 반출/입고 체크리스트 (12개 항목)
- 반출 (6개): 외관 점검, 부품 확인, 포장 상태, 문서 준비, 운송 준비, 최종 확인
- 입고 (6개): 외관 검사, 부품 확인, 손상 여부, 문서 확인, 설치 준비, 시운전 준비

---

## 📊 데이터베이스 테이블

### 신규 추가 테이블
- `pre_production_checklists` - 제작전 체크리스트
- `pre_production_checklist_items` - 체크리스트 항목 마스터
- `pre_production_checklist_results` - 체크리스트 결과
- `mold_scrapping_requests` - 금형 폐기 요청
- `maintenance_records` - 유지보전 기록
- `periodic_inspection_items` - 정기점검 항목 마스터
- `transfer_4m_checklist` - 이관 4M 체크리스트
- `shipping_checklist` - 반출/입고 체크리스트

---

## 🔄 예방 알람 서비스

### maintenanceAlertService.js
- `checkMaintenanceAlerts()`: 유지보전 예정 알림 체크
  - 일자 기준: D-7, D-3, D-1
  - 타수 기준: 90% 도달 시
- `checkPeriodicInspectionAlerts()`: 정기점검 예정 알림 체크
  - 타수 기준: 90% 도달 시
  - 일자 기준: D-7 이내
- `runAllAlertChecks()`: 전체 알람 체크 실행

---

## 📱 모바일 빠른 작업 (8개)
1. QR 스캔
2. 일상점검
3. 정기점검
4. 유지보전
5. 수리요청
6. 폐기관리
7. 체크리스트
8. 알림

---

---

## 📊 개발 현황 요약

### ✅ 개발 완료 (Production Ready)
| 기능 | 상태 | 설명 |
|------|------|------|
| 금형 관리 | ✅ 완료 | CRUD, 사양, 이미지 업로드 |
| 점검 관리 | ✅ 완료 | 일상/정기점검, 승인 워크플로우 |
| 체크리스트 | ✅ 완료 | 제작전(81), 정기점검(31), 4M(16), 반출/입고(12) |
| 유지보전 관리 | ✅ 완료 | CRUD, 통계 |
| 폐기 관리 | ✅ 완료 | 요청, 1차/최종 승인, 완료 처리 |
| 알림 시스템 | ✅ 완료 | 16종 알림, 예방 알람 서비스 |
| 통계 API | ✅ 완료 | 금형/점검/수리/체크리스트/대시보드 |
| 인증 시스템 | ✅ 완료 | JWT 로그인, 토큰 갱신, 사용자 관리 |
| QR/모바일 | ✅ 완료 | QR 스캔, 세션 관리, 모바일 페이지 |
| 이관 관리 | ✅ 완료 | 요청, 승인, 4M/반출입고 체크리스트 |
| 수리 요청 | ✅ 완료 | CRUD, 귀책 협의 |
| 대시보드 | ✅ 완료 | 시스템관리자, 금형개발, 생산처, 제작처 (4종) |
| 데이터베이스 | ✅ 완료 | 52개 테이블, 10개 카테고리 |
| Railway 배포 | ✅ 완료 | PostgreSQL, Nixpacks 빌드 |
| 리포트 PDF 다운로드 | ✅ 완료 | |

### 🔄 개발 중 (In Progress)
| 기능 | 상태 | 예상 완료 |
|------|------|------|
| 이메일 알림 발송 | ✅ 완료 | - |
| 푸시 알림 연동 | ✅ 완료 | - |
| 성능 최적화 | ✅ 완료 | - |
| 테스트 코드 작성 | ✅ 완료 | - |

### 📊 개발 완료율
| 구분 | 완료 | 전체 | 완료율 |
|------|------|------|--------|
| 백엔드 API | 120+ | 120+ | **100%** |
| 프론트엔드 페이지 | 80+ | 80+ | **100%** |
| 데이터베이스 테이블 | 53 | 53 | **100%** |
| 알림 유형 | 16 | 16 | **100%** |
| 체크리스트 항목 | 140 | 140 | **100%** |
| 테스트 코드 | 20 | 20 | **100%** |

**전체 개발 진행률: 100%** 🎉

### 📅 최근 업데이트 (2025-12-22)
- **car_models 테이블 project_name 필드 추가**
  - 프로젝트명(개발 코드): DL3, KA4, NQ5, CV, MV 등
  - 차종코드: OS, 5X, 3K, TH, EV 등
- CarModel 모델 project_name 필드 정의 추가
- 마이그레이션 파일 업데이트
- 기초정보 관리 페이지 프로젝트명 입력/표시 기능
- 금형 신규등록 페이지 연쇄 필터링 구현
  - 차종 → 프로젝트명(선택) → 코드(자동) → 사양(선택) → 연식(자동)

### 📅 이전 업데이트 (2025-12-16)
- 대시보드 요약 API (4개)
- 점검 플로우 API (4개)
- 수리 워크플로우 API (8개)
- 통계/리포트 API (6개)
- 알람 자동 연계 API (4개)
- 운영감사/추적 API (6개)
- 권한 관리 API (1개)
- GPS 서비스 강화 (이탈 감지, 알람)
- 프론트엔드 대시보드 훅 추가
