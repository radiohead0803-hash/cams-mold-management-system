# Week 3: 수리 및 이관 관리

## 📋 목표
- 수리 요청 및 진행 관리
- 귀책 협의 시스템
- 금형 이관 관리 (4M 준비)
- 금형 유지보전 기능

---

## 🔨 Week 3 핵심 기능

### 1. 수리 관리
- NG 발생 → 수리 요청
- 귀책 협의 (1차: 생산처↔제작처, 2차: 본사 개입)
- 수리 진행 상태 관리
- 수리 전/중/후 사진
- 비용 처리

### 2. 금형 이관
- 이관 요청 (공장 간 / 외주)
- 4M 준비 및 점검
  - Man (인력)
  - Machine (설비)
  - Material (원료)
  - Method (작업방법)
- 반출/입고 체크리스트
- GPS 이동 경로 추적

### 3. 금형 유지보전
- 품질 저하 예방
- 금형 성능 유지
- 정기 세척 / 습합
- 보전 이력 관리

---

## 📊 추가 데이터베이스 테이블

```sql
-- 수리 관리
CREATE TABLE repairs (
    id SERIAL PRIMARY KEY,
    mold_id INTEGER REFERENCES molds(id),
    repair_type VARCHAR(50),
    urgency VARCHAR(20),
    status VARCHAR(20),
    requested_by INTEGER REFERENCES users(id),
    requested_at TIMESTAMP DEFAULT NOW()
);

-- 귀책 협의
CREATE TABLE repair_liability (
    id SERIAL PRIMARY KEY,
    repair_id INTEGER REFERENCES repairs(id),
    liability_party VARCHAR(50),
    liability_ratio_plant INTEGER,
    liability_ratio_maker INTEGER,
    final_decision TEXT,
    decided_at TIMESTAMP DEFAULT NOW()
);

-- 금형 이관
CREATE TABLE mold_transfers (
    id SERIAL PRIMARY KEY,
    mold_id INTEGER REFERENCES molds(id),
    transfer_type VARCHAR(50),
    from_location VARCHAR(100),
    to_location VARCHAR(100),
    transfer_reason TEXT,
    status VARCHAR(20),
    requested_at TIMESTAMP DEFAULT NOW()
);

-- 4M 체크리스트
CREATE TABLE transfer_4m_checklist (
    id SERIAL PRIMARY KEY,
    transfer_id INTEGER REFERENCES mold_transfers(id),
    man_check BOOLEAN,
    machine_check BOOLEAN,
    material_check BOOLEAN,
    method_check BOOLEAN,
    checked_by INTEGER REFERENCES users(id),
    checked_at TIMESTAMP DEFAULT NOW()
);

-- 유지보전
CREATE TABLE maintenance_records (
    id SERIAL PRIMARY KEY,
    mold_id INTEGER REFERENCES molds(id),
    maintenance_type VARCHAR(50),
    description TEXT,
    performed_by INTEGER REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT NOW()
);
```

---

## ✅ Week 3 체크리스트

### 수리 관리
- [ ] 수리 요청 API
- [ ] 귀책 협의 API
- [ ] 수리 진행 관리
- [ ] 수리 사진 업로드
- [ ] 비용 처리 API

### 이관 관리
- [ ] 이관 요청 API
- [ ] 4M 체크리스트 API
- [ ] 반출/입고 관리
- [ ] GPS 경로 추적

### 유지보전
- [ ] 세척/습합 기록 API
- [ ] 보전 이력 조회
- [ ] 예방 보전 알람

---

**다음 주**: Week 4 - 프론트엔드 및 UI/UX 완성
