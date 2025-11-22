# 데이터 흐름 핵심 요약

## 🔄 전체 데이터 흐름 구조

```
[본사(CAMS)] 금형제작사양 입력
    ↓ 자동 연동
[금형제작처] 제작전 체크리스트 작성 (81개 항목, 9개 카테고리)
    ↓ 도면검토회 D-7, D-5, D-3, D-1 알림
[CAMS 금형개발담당자] 점검 및 승인/반려
    ↓ 승인 시
[금형제작처] 12단계 공정 진행
    ├─ 1. 도면접수
    ├─ 2. 몰드베이스발주
    ├─ 3. 금형설계
    ├─ 4. 도면검토회
    ├─ 5. 상형가공
    ├─ 6. 하형가공
    ├─ 7. 상형열처리
    ├─ 8. 하형열처리
    ├─ 9. 상형경도측정 ← 경도측정
    ├─ 10. 하형경도측정 ← 경도측정
    ├─ 11. 조립
    └─ 12. 시운전
    ↓ 12단계 완료
[금형 마스터 자동 생성] QR 코드 발급
    ↓ 자동 연동
[생산처] QR 스캔 기반 모바일 대시보드
    ├─ 일상점검 + 생산수량 입력
    ├─ 정기점검 수행
    ├─ 수리 요청 생성
    └─ 이관 요청 생성
    ↓
[금형 마스터 자동 업데이트]
    ├─ 타수 누적
    ├─ 점검 이력 저장
    ├─ GPS 위치 업데이트
    └─ 알람 자동 생성
```

---

## 📋 제작전 체크리스트 (81개 항목, 9개 카테고리)

### 카테고리 구성

| 카테고리 | 항목 수 | 주요 점검 항목 |
|---------|--------|---------------|
| I. 원재료 | 9개 | 수축률, 재질 사양, 성적서 |
| II. 금형 | 13개 | 금형 구조, 냉각 시스템, 이젝션 |
| III. 가스 배기 | 6개 | 벤트 설계, 배기 위치 |
| IV. 성형 해석 | 11개 | Moldflow 분석, 충전 패턴 |
| V. 싱크마크 | 10개 | 싱크 발생 예측, 리브 설계 |
| VI. 취출 | 10개 | 이젝터 핀 배치, 언더컷 처리 |
| VII. MIC 제품 | 9개 | MICA 스펙률, 표면 품질 |
| VIII. 도금 | 7개 | 도금 전처리, 두께 관리 |
| IX. 리어 백빔 | 6개 | 금형 구배, 후기공 볼 |
| **총계** | **81개** | - |

### 도면검토회 연동 알림

| 알림 시점 | 대상 | 알림 내용 |
|----------|------|----------|
| D-7일 | 금형제작처 | "도면검토회 7일 전입니다. 제작전 체크리스트를 작성해주세요." |
| D-5일 | 금형제작처 | "⚠️ 도면검토회 5일 전입니다." |
| D-3일 | 제작처 + CAMS 담당자 | "🚨 도면검토회 3일 전입니다. 미작성 상태입니다." |
| D-1일 | 제작처 + CAMS + 관리자 | "🚨 긴급: 도면검토회 1일 전입니다. 미승인 상태입니다." |

---

## 🏭 12단계 공정 관리

### 공정 단계 (mold_process_steps)

```javascript
{
  step_number: 9,
  step_name: "상형경도측정",
  start_date: "2024-03-10",
  planned_completion_date: "2024-03-12",
  actual_completion_date: "2024-03-11",
  status: "completed",
  status_display: "완료",
  notes: "HRC 52.5 측정 완료",
  days_remaining: "D+00",
  assignee: "김기술"
}
```

### 경도측정 (9, 10단계) ⚠️ 제작완료 후 필수

#### 9단계: 상형경도측정
- 측정 위치: 상형 (캐비티, 코어)
- 경도값 (HRC) - `hardness_upper_mold`
- 목표 범위
- 적합성 판정 (적합/부적합/주의)
- 측정 사진 첨부 - `upper_mold_images`
- 경도 측정일 - `hardness_test_date`
- 경도 측정 성적서 - `hardness_test_report`

#### 10단계: 하형경도측정
- 측정 위치: 하형 (캐비티, 코어)
- 경도값 (HRC) - `hardness_lower_mold`
- 목표 범위
- 적합성 판정 (적합/부적합/주의)
- 측정 사진 첨부 - `lower_mold_images`
- 경도 측정일 - `hardness_test_date`
- 경도 측정 성적서 - `hardness_test_report`

#### 제작완료 필수 항목
✅ 상형 경도측정 완료 (`hardness_upper_mold`)
✅ 하형 경도측정 완료 (`hardness_lower_mold`)
✅ 경도 측정일 기록 (`hardness_test_date`)
✅ 경도 측정 성적서 첨부 (`hardness_test_report`)
✅ 상하형 사진 첨부 (`upper_mold_images`, `lower_mold_images`)
✅ 금형인자표 첨부 (`mold_parameter_sheet`)
✅ 성형해석 자료 첨부 (`molding_analysis`)
✅ 초도사출 T/O 결과 첨부 (`trial_shot_result`)

- 금형정보 요약(maker_info)에 자동 반영

---

## 📱 QR 스캔 기반 모바일 대시보드

### 생산처 모바일 대시보드

#### 1. 일상점검 + 생산수량 입력
```javascript
POST /api/mobile/daily-inspection
{
  mold_id: 123,
  production_quantity: 500,  // 타수 자동 누적
  inspection_items: [...],   // 10개 카테고리 점검
  gps_latitude: 37.5665,
  gps_longitude: 126.9780
}
```

#### 2. 수리 요청 생성
```javascript
POST /api/mobile/repair-request
{
  mold_id: 123,
  defect_type: "major",
  defect_description: "성형면 손상 발견",
  photos: ["defect1.jpg"],
  urgency: "urgent",
  target_maker_id: 5
}
```

#### 3. 이관 요청 생성
```javascript
POST /api/mobile/transfer-request
{
  mold_id: 123,
  transfer_reason: "repair",
  destination_id: 8,
  destination_type: "maker",
  checklist: {
    export_confirmed: true,
    photos_taken: true,
    gps_verified: true
  }
}
```

### 제작처 모바일 대시보드

#### 1. 제작 진행 등록
```javascript
POST /api/mobile/maker/production-progress
{
  mold_id: 123,
  progress_stage: "machining",
  progress_percentage: 75,
  work_description: "가공 작업 진행 중"
}
```

#### 2. 시운전 결과 입력
```javascript
POST /api/mobile/maker/trial-run
{
  mold_id: 123,
  result: "pass",
  checks: {
    appearance: true,
    dimension: true,
    function: true,
    performance: true
  }
}
```

---

## 📊 실시간 데이터 동기화

### WebSocket 이벤트

```javascript
// 금형 상태 변경
socket.on('mold:status:changed', (data) => {
  // {mold_id: 123, old_status: 'production', new_status: 'repair_required'}
});

// 타수 업데이트
socket.on('mold:shots:updated', (data) => {
  // {mold_id: 123, current_shots: 457289, progress: 45.7%}
});

// 알람 수신
socket.on('alarm:created', (data) => {
  // {type: 'inspection_required', mold_id: 123, priority: 'high'}
});

// GPS 위치 업데이트
socket.on('mold:location:updated', (data) => {
  // {mold_id: 123, latitude: 37.5665, longitude: 126.9780}
});
```

---

## 🎯 핵심 자동화 기능

### 1. 타수 자동 누적
- 생산수량 입력 시 `current_shots` 자동 증가
- 진행률 자동 계산 (current_shots / target_shots * 100)
- 다음 점검까지 남은 타수 계산

### 2. 점검 스케줄 자동 업데이트
- 타수 기반 정기점검 알림 (20K, 50K, 100K, 200K, 400K, 800K)
- 일상점검 미입력 시 알림
- 점검 기한 초과 시 경고

### 3. GPS 위치 자동 추적
- QR 스캔 시 GPS 위치 자동 저장
- 금형 이동 이력 추적
- 위치 기반 작업 권한 검증

### 4. 알람 자동 생성
- 타수 임계값 도달 시
- 점검 기한 임박 시
- 수리 요청 접수 시
- 이관 요청 접수 시

---

## 📝 문서 마스터 관리 및 리비젼 시스템

### 관리 대상 문서
1. **점검 관련**: 일상점검, 정기점검, 습합점검, 세척점검
2. **수리 관련**: 수리요청, 수리관리표, 수리진행현황
3. **이관 관련**: 이관요청, 이관관리, 이관체크리스트
4. **기타**: 금형체크리스트, 금형개발계획

### 문서 수정 및 배포 프로세스

```
[협력사 문서 작성]
    ↓ 본사 검토
[본사 관리자 수정]
    ↓ 리비젼 생성
[승인 프로세스]
    ↓ 승인 완료
[자동 배포]
    ↓ 전체 협력사 적용
[리비젼 관리]
```

### 리비젼 관리 기능
- 문서 변경 이력 추적
- 버전 비교 (before/after)
- 롤백 기능 (7일간 가능)
- 자동 배포 및 알림

---

## ✅ 시스템 통합 효과

- ✅ 체계적인 데이터 흐름 관리
- ✅ 자동 연동으로 효율성 향상
- ✅ 제작전 체크리스트로 품질 사전 확보
- ✅ 12단계 공정 관리로 진행률 가시화
- ✅ QR 스캔 기반 모바일 대시보드로 현장 작업 간소화
- ✅ 타수 자동 누적 및 점검 스케줄 자동 업데이트
- ✅ GPS 위치 추적으로 금형 이동 관리
- ✅ WebSocket 기반 실시간 알림 시스템
- ✅ 문서 마스터 관리 및 리비젼 시스템으로 일관성 유지
