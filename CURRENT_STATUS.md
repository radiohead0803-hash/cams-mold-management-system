# 🎯 현재 상태 및 해결 방법

## ✅ 완료된 작업

1. ✅ 코드 수정 완료
   - `MoldSpecification` 모델에 `mold_id` 필드 추가
   - Controller 로직 수정
   - Git 커밋 및 푸시 완료

2. ✅ PostgreSQL 17.7 설치 완료

3. ✅ Railway 데이터베이스 연결 성공

4. ✅ 부분적 업데이트 완료
   - `mold_id` 컬럼 추가됨
   - 인덱스 생성됨

---

## ⚠️ 발견된 문제

### Railway 데이터베이스 상태

```
테이블 확인 결과:
- mold_specifications: ✅ 존재 (2개 레코드)
- molds: ❌ 존재하지 않음

컬럼 상태:
- mold_id: ✅ 추가됨
- 인덱스: ✅ 생성됨
- 데이터: ⚠️ mold_id가 모두 NULL (molds 테이블이 없어서 연동 불가)
```

### 근본 원인

**`molds` 테이블이 Railway 데이터베이스에 생성되지 않았습니다.**

이는 마이그레이션이 Railway에서 실행되지 않았기 때문입니다.

---

## 🎯 해결 방법

### 방법 1: Railway에서 마이그레이션 실행 (권장)

Railway 서비스 설정에서 빌드 명령에 마이그레이션 추가:

1. **Railway 대시보드**
   - abundant-freedom → backend 서비스 선택

2. **Settings 탭**
   - Build Command 또는 Start Command 확인

3. **Deploy 설정 수정**
   ```bash
   # Start Command에 추가
   npm run db:migrate && npm start
   ```

4. **재배포**
   - Railway가 자동으로 마이그레이션 실행 후 서버 시작

### 방법 2: Railway CLI로 마이그레이션 실행

```bash
cd server
railway run npm run db:migrate
```

### 방법 3: SQL로 직접 molds 테이블 생성

Railway 웹 대시보드 또는 psql로 직접 실행:

```sql
-- molds 테이블 생성
CREATE TABLE IF NOT EXISTS molds (
  id SERIAL PRIMARY KEY,
  mold_code VARCHAR(50) UNIQUE NOT NULL,
  mold_name VARCHAR(200) NOT NULL,
  car_model VARCHAR(100),
  part_name VARCHAR(200),
  cavity INTEGER,
  plant_id INTEGER,
  maker_id INTEGER,
  maker_company_id INTEGER REFERENCES companies(id),
  plant_company_id INTEGER REFERENCES companies(id),
  specification_id INTEGER REFERENCES mold_specifications(id),
  qr_token VARCHAR(255) UNIQUE,
  sop_date DATE,
  eop_date DATE,
  target_shots INTEGER,
  current_shots INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  location VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_molds_plant ON molds(plant_id);
CREATE INDEX IF NOT EXISTS idx_molds_maker ON molds(maker_id);
CREATE INDEX IF NOT EXISTS idx_molds_specification ON molds(specification_id);
CREATE INDEX IF NOT EXISTS idx_molds_qr_token ON molds(qr_token);
CREATE INDEX IF NOT EXISTS idx_molds_status ON molds(status);

-- 외래 키 추가 (mold_specifications → molds)
ALTER TABLE mold_specifications
ADD CONSTRAINT fk_mold_specifications_mold_id
FOREIGN KEY (mold_id) 
REFERENCES molds(id)
ON UPDATE CASCADE
ON DELETE SET NULL;
```

---

## 📊 현재 데이터베이스 상태

```sql
-- 확인된 상태
mold_specifications:
- 총 레코드: 2개
- mold_id 컬럼: 존재 (모두 NULL)
- 인덱스: 존재

molds:
- 상태: 테이블 없음 ❌
```

---

## 🚀 즉시 실행 가능한 해결책

### 옵션 A: Railway CLI로 마이그레이션

```bash
cd server
railway run npm run db:migrate
```

### 옵션 B: 배치 파일 실행 (molds 테이블 생성)

`server/create-molds-table.bat` 실행

---

## 📝 다음 단계

1. **molds 테이블 생성** (위의 방법 중 하나 선택)
2. **외래 키 제약 조건 추가**
3. **기존 데이터 연동 테스트**
4. **금형 등록 페이지 테스트**

---

**작성**: 2024-11-26  
**상태**: mold_id 컬럼 추가 완료, molds 테이블 생성 필요
