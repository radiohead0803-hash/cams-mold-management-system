# CAMS 다음 개발 진행 계획

## 📅 작성일: 2025-12-16

---

## 🎯 목표: "실제로 현장/본사에서 매일 쓰는 수준"

---

## 📋 우선순위 Top 10

### 1. 배포 안정화 (Railway) ✅ 완료
| 항목 | 상태 | 설명 |
|------|------|------|
| Node 엔진 버전 고정 | ✅ 완료 | `engines: { node: "18.x", npm: ">=9.0.0" }` |
| 환경변수 표준화 | ✅ 완료 | `.env.example` 업데이트 (SMTP, Firebase, CLIENT_URL) |
| CORS 설정 | ✅ 완료 | Railway 도메인 허용 |
| 정적파일 서빙 | ✅ 완료 | `/uploads` 경로 설정 |

### 2. 권한/라우팅 완성 ✅ 완료
| 항목 | 상태 | 설명 |
|------|------|------|
| UI 메뉴 노출 + API 권한검사 일관화 | ✅ 완료 | `permissions.js` 권한 매핑 |
| 미들웨어 권한 체크 | ✅ 완료 | `authenticate` + `authorize` 미들웨어 |
| 권한 정보 API | ✅ 완료 | `/api/v1/auth/permissions` 엔드포인트 |

### 3. 기초정보(마스터) 관리 화면/API 완성 ✅ 완료
| 마스터 데이터 | 상태 | 설명 |
|--------------|------|------|
| 차종 (car_models) | ✅ 완료 | CRUD + 참조무결성 |
| 톤수 (tonnage) | ✅ 완료 | 선택형 콤보 |
| 재질 (material) | ✅ 완료 | 원재료 정보 |
| 제작처 (makers) | ✅ 완료 | 협력사 관리 |
| 생산처 (plants) | ✅ 완료 | 공장 관리 |

### 4. QR 세션 + GPS 기록 실데이터 품질 확보 ✅ 완료
| 항목 | 상태 | 설명 |
|------|------|------|
| QR 스캔 시점/좌표/정확도 저장 | ✅ 완료 | `gpsService.js` |
| GPS 이탈 감지 | ✅ 완료 | `checkGpsDeviation()` - 허용 반경 체크 |
| GPS 이탈 알람 | ✅ 완료 | `createGpsDeviationAlert()` |
| 8시간 세션 만료 | ✅ 완료 | 로직 구현됨 |
| GPS 통계 조회 | ✅ 완료 | `getGpsStatistics()` |

### 5. 생산처 일상/정기점검 입력 UX 마무리 ✅ 완료
| 항목 | 상태 | 설명 |
|------|------|------|
| 스캔 → 점검 → 생산수량 → 완료 | ✅ 완료 | `inspectionFlow.js` |
| 빠른 수리요청 | ✅ 완료 | `POST /inspection-flow/quick-repair` |
| 오늘 점검 현황 | ✅ 완료 | `GET /inspection-flow/today-status` |

### 6. 수리요청~완료~확인 종단 흐름 ✅ 완료
| 항목 | 상태 | 설명 |
|------|------|------|
| 접수 (제작처) | ✅ 완료 | `POST /repair-workflow/:id/accept` |
| 수리 시작/완료 | ✅ 완료 | `POST /repair-workflow/:id/start,complete` |
| 확인 (생산처) | ✅ 완료 | `POST /repair-workflow/:id/confirm` |
| 귀책협의 | ✅ 완료 | `POST /repair-workflow/:id/start-liability-discussion` |
| 워크플로우 이력 | ✅ 완료 | `GET /repair-workflow/:id/history` |
| TAT 통계 | ✅ 완료 | `GET /repair-workflow/stats/tat` |

### 7. 알람/이상발생 자동연계 ✅ 완료
| 이벤트 | 상태 | 설명 |
|--------|------|------|
| NG 발생 | ✅ 완료 | `createNgAlert()` |
| 점검 지연 | ✅ 완료 | `checkInspectionOverdueAlerts()` |
| 타수 초과 | ✅ 완료 | `checkShotsAlerts()` - 90% 경고, 100% 초과 |
| GPS 이탈 | ✅ 완료 | `createGpsDeviationAlert()` |
| 수리 요청 | ✅ 완료 | `createRepairRequestAlert()` |
| 이관 요청 | ✅ 완료 | `createTransferAlert()` |

### 8. 통계/리포트 (주간·월간) ✅ 완료
| 리포트 | 상태 | 설명 |
|--------|------|------|
| 점검 완료율 | ✅ 완료 | `GET /statistics-report/inspection-rate` |
| 수리 TAT | ✅ 완료 | `GET /statistics-report/repair-tat` |
| NG Top | ✅ 완료 | `GET /statistics-report/ng-top` |
| 제작처 성과 | ✅ 완료 | `GET /statistics-report/maker-performance` |
| 이관 리드타임 | ✅ 완료 | `GET /statistics-report/transfer-leadtime` |
| 종합 리포트 | ✅ 완료 | `GET /statistics-report/summary` |

### 9. 대시보드 데이터 API 묶음화 ✅ 완료
| API | 상태 | 설명 |
|-----|------|------|
| `/dashboard-summary/plant` | ✅ 완료 | 생산처 KPI + Action + Trends |
| `/dashboard-summary/maker` | ✅ 완료 | 제작처 KPI + Action + Trends |
| `/dashboard-summary/developer` | ✅ 완료 | 개발담당 KPI + Action + Trends |
| `/dashboard-summary/admin` | ✅ 완료 | 시스템 관리자 전체 현황 |

### 10. 운영감사/추적 (이력/변경로그) ✅ 완료
| 항목 | 상태 | 설명 |
|------|------|------|
| 감사 로그 조회 | ✅ 완료 | `GET /audit-log` |
| 엔티티별 이력 | ✅ 완료 | `GET /audit-log/entity/:type/:id` |
| 승인/반려 이력 | ✅ 완료 | `GET /audit-log/approvals` |
| 귀책비율 변경 이력 | ✅ 완료 | `GET /audit-log/liability-changes` |
| 마스터 수정 이력 | ✅ 완료 | `GET /audit-log/master-changes` |
| 감사 로그 통계 | ✅ 완료 | `GET /audit-log/stats` |

---

## 📊 대시보드 구성 제안

### A. 생산처 대시보드 (현장 "오늘 할 일" 중심)

**핵심**: QR 스캔을 안 하더라도 "오늘 해야 할 점검/이슈"가 한 화면에 표시

| 위젯 | 설명 |
|------|------|
| 오늘의 점검 일정 | 일상/정기 + 미완료 건 "즉시 시작" |
| 긴급 알람 | 타수 초과/점검 지연/NG 발생 (심각도 색상) |
| 금주 생산·NG 요약 | 생산수량, 평균가동률, NG율 추세 |
| 최근 스캔 TOP 금형 | 자주 쓰는 금형 빠른 진입 |
| 이관 요청 진행현황 | 반출/입고/사진/GPS 체크 진행률 |

### B. 협력사(제작처) 대시보드 ("작업 backlog + 납기/품질" 중심)

| 위젯 | 설명 |
|------|------|
| 진행중 작업 | 제작 단계별 수량 (설계/가공/조립/시운전) |
| 수리 요청함 | 신규/진행/검수대기/귀책협의중 |
| 금주 납품/시운전 일정 | 일정 지연 리스크 표시 |
| QR 작업 바로가기 | QR 재발급/부착확인/출고·입고 처리 |
| 성과 KPI | 평균 제작기간, 수리 TAT, 재발률 |

### C. 개발담당자(본사) 대시보드 ("승인/리스크/협력사 성과" 중심)

| 위젯 | 설명 |
|------|------|
| 승인 대기함 | 설계/시운전/귀책판정/이관승인 큐 |
| 리스크 금형 리스트 | 타수 임박, NG 반복, 점검지연, GPS 이탈 |
| 협력사 성과 비교 | 납기준수율/품질점수/수리비/귀책 분포 |
| 프로젝트/차종 필터 | 즉시 드릴다운 |
| 리포트 원클릭 | 월간 요약 PDF/엑셀 생성 |

---

## 🔧 대시보드 데이터 API 구조

역할별 3종 세트:

```javascript
// 1. KPI Summary
{
  inspections_due: 5,
  inspections_overdue: 2,
  repairs_pending: 3,
  alerts_unread: 8,
  ng_rate: 2.5
}

// 2. Action List (Top N)
{
  pending_approvals: [...],
  pending_inspections: [...],
  pending_repairs: [...]
}

// 3. Trends (7일/30일)
{
  inspection_completion_rate: [...],
  repair_count: [...],
  ng_count: [...]
}
```

---

## 📅 개발 일정 (예상)

| 주차 | 작업 |
|------|------|
| Week 1 | 배포 안정화, 권한/라우팅 완성 |
| Week 2 | 마스터 관리, QR 세션 품질 확보 |
| Week 3 | 점검 UX 마무리, 수리 종단 흐름 |
| Week 4 | 알람 자동연계, 통계/리포트 |
| Week 5 | 대시보드 API 묶음화, 운영감사 |

---

*이 문서는 2025-12-16 작성되었습니다.*
