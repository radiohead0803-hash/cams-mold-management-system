# Week 2: QR 스캔 및 점검 시스템

## 📋 목표
- QR 코드 생성 및 스캔 시스템 구현
- 일상점검 + 생산수량 입력 기능
- 정기점검 스케줄링 시스템
- GPS 위치 추적 기능

---

## 🔨 Week 2 핵심 기능

### 1. QR 코드 시스템
- 금형 등록 시 QR 자동 생성
- QR 스캔 API
- QR 세션 관리 (8시간)
- GPS 위치 자동 기록

### 2. 일상점검 시스템
- 생산수량 필수 입력
- 체크리스트 수행
- 사진 첨부 기능
- 자동 타수 업데이트

### 3. 정기점검 스케줄
- 1차: 100K, 2차: 500K, 3차: 1M
- 자동 알람 생성
- PASS/FAIL 판정

---

## 📊 추가 데이터베이스 테이블

```sql
-- 일상점검
CREATE TABLE daily_checks (
    id SERIAL PRIMARY KEY,
    mold_id INTEGER REFERENCES molds(id),
    checked_by INTEGER REFERENCES users(id),
    production_quantity INTEGER NOT NULL,
    check_result VARCHAR(20),
    notes TEXT,
    checked_at TIMESTAMP DEFAULT NOW()
);

-- 정기점검
CREATE TABLE inspections (
    id SERIAL PRIMARY KEY,
    mold_id INTEGER REFERENCES molds(id),
    inspection_type VARCHAR(20),
    inspection_result VARCHAR(20),
    inspector_id INTEGER REFERENCES users(id),
    inspected_at TIMESTAMP DEFAULT NOW()
);

-- 알람
CREATE TABLE qr_scan_alerts (
    id SERIAL PRIMARY KEY,
    mold_id INTEGER REFERENCES molds(id),
    alert_type VARCHAR(50),
    severity VARCHAR(20),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ✅ Week 2 체크리스트

- [ ] QR 생성 API
- [ ] QR 스캔 API
- [ ] GPS 위치 기록
- [ ] 일상점검 API
- [ ] 정기점검 API
- [ ] 알람 시스템
- [ ] 생산수량 연동

---

**다음 주**: Week 3 - 수리 및 이관 관리
