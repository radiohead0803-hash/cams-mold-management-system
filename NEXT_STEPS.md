# 🎯 CAMS 금형관리시스템 다음 단계 계획

**작성일**: 2025-11-20  
**현재 진행률**: 47% (75/159+ 항목 완료)

---

## 📊 현재 상태 요약

### ✅ 완료 (47%)
- 프론트엔드: 15개 페이지 (60%)
- 백엔드 모델: 25개 (48%)
- API 라우트: 10개 (33%)
- 데이터베이스: 25개 테이블 (48%)

### ⏳ 진행 중
- Week 1: 기반 구축 (80% 완료)
- Week 2: QR 스캔 시스템 (70% 완료)

### ❌ 미완성
- Week 3: 수리·이관 관리 (40% 완료)
- Week 4: UI/UX 및 배포 (30% 완료)

---

## 🚀 즉시 수행 항목 (Week 1 완료)

### 1. 모델 통일 (우선순위: 최상)
**문제**: User.js와 Mold.js가 함수 기반 (구버전)

**해결**:
```javascript
// User.js와 Mold.js를 클래스 기반으로 변환
class User extends Model {
  static associate(models) {
    // associations
  }
}
```

### 2. QR 세션 관리 구현
**테이블**: `qr_sessions`
**API**: 
- POST /api/v1/qr-session
- GET /api/v1/qr-scan/:qr_code

### 3. 금형개발계획 시스템
**테이블**: 
- `mold_development_plans`
- `mold_process_steps`

**API**:
- POST /api/v1/development-plans
- PATCH /api/v1/development-plans/:id/step

### 4. 제작전 체크리스트 시스템
**테이블**: `pre_production_checklists`
**API**:
- POST /api/v1/pre-production-checklists
- POST /api/v1/pre-production-checklists/:id/approve

---

## 📅 Week 2: QR 스캔 및 점검 시스템

### 1. QR 스캔 API 구현
- QR 코드 검증
- 금형 정보 로드
- 사용자 유형별 메뉴 구분

### 2. 생산수량 입력 및 타수 자동 누적
- POST /api/v1/mobile/production-quantity
- `molds.current_shots` 자동 증가
- 점검 스케줄 자동 업데이트

### 3. 모바일 대시보드 (생산처)
- 일상점검 + 생산수량 통합 입력
- GPS 자동 기록
- 사진 첨부

---

## 📅 Week 3: 수리·이관 관리

### 1. 수리 귀책 협의 워크플로우
- 1차 협의 (생산처 ↔ 제작처)
- 2차 협의 (본사 개입)
- 귀책 유형 분류

### 2. 이관 4M 체크리스트
- 반출/입고 확인
- GPS 기반 위치 추적

### 3. 모바일 대시보드 (제작처)
- 제작 진행 등록
- 시운전 결과 입력

---

## 📅 Week 4: UI/UX 및 배포

### 1. 사용자 유형별 대시보드 (4개)
- /dashboard/system-admin
- /dashboard/mold-developer
- /dashboard/maker
- /dashboard/plant

### 2. 관리자 템플릿 관리 UI
- 템플릿 생성/수정
- 배포 및 롤백

### 3. Railway 배포
- CI/CD 파이프라인
- 환경 변수 설정

---

## 📝 개발 우선순위

### 🔴 긴급 (즉시)
1. User.js, Mold.js 모델 통일
2. QR 세션 관리
3. 생산수량 타수 자동 누적

### 🟡 중요 (1주일 내)
1. 금형개발계획 12단계
2. 제작전 체크리스트 81개 항목
3. 모바일 대시보드 (생산처)

### 🟢 보통 (2주일 내)
1. 수리 귀책 협의
2. 이관 4M 체크리스트
3. 모바일 대시보드 (제작처)

### 🔵 낮음 (3-4주일 내)
1. 사용자 유형별 대시보드
2. 관리자 템플릿 관리 UI
3. Railway 배포

---

**다음 작업**: User.js와 Mold.js 모델을 클래스 기반으로 변환
