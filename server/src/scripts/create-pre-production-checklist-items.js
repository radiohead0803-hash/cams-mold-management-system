const { Client } = require('pg');

const RAILWAY_DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

// 제작전 체크리스트 81개 항목 (9개 카테고리)
const CHECKLIST_ITEMS = [
  // 1. 금형 기본정보 (10개)
  { category_code: 'BASIC', category_name: '금형 기본정보', item_code: 'BASIC-01', item_name: '금형번호 확인', default_spec: '금형번호 일치', sort_order: 1 },
  { category_code: 'BASIC', category_name: '금형 기본정보', item_code: 'BASIC-02', item_name: '품번 확인', default_spec: '품번 일치', sort_order: 2 },
  { category_code: 'BASIC', category_name: '금형 기본정보', item_code: 'BASIC-03', item_name: '품명 확인', default_spec: '품명 일치', sort_order: 3 },
  { category_code: 'BASIC', category_name: '금형 기본정보', item_code: 'BASIC-04', item_name: '차종 확인', default_spec: '차종 일치', sort_order: 4 },
  { category_code: 'BASIC', category_name: '금형 기본정보', item_code: 'BASIC-05', item_name: '캐비티 수량', default_spec: '도면 대비 일치', sort_order: 5 },
  { category_code: 'BASIC', category_name: '금형 기본정보', item_code: 'BASIC-06', item_name: '금형 재질', default_spec: 'NAK80/SKD61', sort_order: 6 },
  { category_code: 'BASIC', category_name: '금형 기본정보', item_code: 'BASIC-07', item_name: '금형 중량', default_spec: '설계 대비 ±5%', sort_order: 7 },
  { category_code: 'BASIC', category_name: '금형 기본정보', item_code: 'BASIC-08', item_name: '금형 외형치수', default_spec: '설계 대비 일치', sort_order: 8 },
  { category_code: 'BASIC', category_name: '금형 기본정보', item_code: 'BASIC-09', item_name: '제작처 확인', default_spec: '계약서 대비 일치', sort_order: 9 },
  { category_code: 'BASIC', category_name: '금형 기본정보', item_code: 'BASIC-10', item_name: '납기일 확인', default_spec: '계약 납기 준수', sort_order: 10 },
  
  // 2. 금형 구조 (10개)
  { category_code: 'STRUCT', category_name: '금형 구조', item_code: 'STRUCT-01', item_name: '파팅라인 상태', default_spec: '버 발생 없음', sort_order: 11 },
  { category_code: 'STRUCT', category_name: '금형 구조', item_code: 'STRUCT-02', item_name: '이젝터 핀 상태', default_spec: '작동 원활', sort_order: 12 },
  { category_code: 'STRUCT', category_name: '금형 구조', item_code: 'STRUCT-03', item_name: '슬라이드 코어 작동', default_spec: '작동 원활', sort_order: 13 },
  { category_code: 'STRUCT', category_name: '금형 구조', item_code: 'STRUCT-04', item_name: '가이드 핀/부시 상태', default_spec: '마모 없음', sort_order: 14 },
  { category_code: 'STRUCT', category_name: '금형 구조', item_code: 'STRUCT-05', item_name: '냉각수 라인 상태', default_spec: '누수 없음', sort_order: 15 },
  { category_code: 'STRUCT', category_name: '금형 구조', item_code: 'STRUCT-06', item_name: '핫러너 상태', default_spec: '온도 제어 정상', sort_order: 16 },
  { category_code: 'STRUCT', category_name: '금형 구조', item_code: 'STRUCT-07', item_name: '게이트 상태', default_spec: '게이트 크기 적정', sort_order: 17 },
  { category_code: 'STRUCT', category_name: '금형 구조', item_code: 'STRUCT-08', item_name: '러너 상태', default_spec: '러너 밸런스 양호', sort_order: 18 },
  { category_code: 'STRUCT', category_name: '금형 구조', item_code: 'STRUCT-09', item_name: '벤트 상태', default_spec: '가스 배출 양호', sort_order: 19 },
  { category_code: 'STRUCT', category_name: '금형 구조', item_code: 'STRUCT-10', item_name: '금형 표면 상태', default_spec: '스크래치 없음', sort_order: 20 },
  
  // 3. 치수 검사 (9개)
  { category_code: 'DIMENSION', category_name: '치수 검사', item_code: 'DIM-01', item_name: '주요 치수 A', default_spec: '도면 공차 내', sort_order: 21 },
  { category_code: 'DIMENSION', category_name: '치수 검사', item_code: 'DIM-02', item_name: '주요 치수 B', default_spec: '도면 공차 내', sort_order: 22 },
  { category_code: 'DIMENSION', category_name: '치수 검사', item_code: 'DIM-03', item_name: '주요 치수 C', default_spec: '도면 공차 내', sort_order: 23 },
  { category_code: 'DIMENSION', category_name: '치수 검사', item_code: 'DIM-04', item_name: '구멍 위치', default_spec: '도면 공차 내', sort_order: 24 },
  { category_code: 'DIMENSION', category_name: '치수 검사', item_code: 'DIM-05', item_name: '구멍 직경', default_spec: '도면 공차 내', sort_order: 25 },
  { category_code: 'DIMENSION', category_name: '치수 검사', item_code: 'DIM-06', item_name: '두께', default_spec: '도면 공차 내', sort_order: 26 },
  { category_code: 'DIMENSION', category_name: '치수 검사', item_code: 'DIM-07', item_name: '평탄도', default_spec: '0.5mm 이내', sort_order: 27 },
  { category_code: 'DIMENSION', category_name: '치수 검사', item_code: 'DIM-08', item_name: '직각도', default_spec: '0.3mm 이내', sort_order: 28 },
  { category_code: 'DIMENSION', category_name: '치수 검사', item_code: 'DIM-09', item_name: '동심도', default_spec: '0.2mm 이내', sort_order: 29 },
  
  // 4. 외관 검사 (9개)
  { category_code: 'APPEARANCE', category_name: '외관 검사', item_code: 'APP-01', item_name: '표면 광택', default_spec: '균일한 광택', sort_order: 30 },
  { category_code: 'APPEARANCE', category_name: '외관 검사', item_code: 'APP-02', item_name: '웰드라인', default_spec: '육안 식별 불가', sort_order: 31 },
  { category_code: 'APPEARANCE', category_name: '외관 검사', item_code: 'APP-03', item_name: '플로우마크', default_spec: '육안 식별 불가', sort_order: 32 },
  { category_code: 'APPEARANCE', category_name: '외관 검사', item_code: 'APP-04', item_name: '싱크마크', default_spec: '육안 식별 불가', sort_order: 33 },
  { category_code: 'APPEARANCE', category_name: '외관 검사', item_code: 'APP-05', item_name: '버(Burr)', default_spec: '버 없음', sort_order: 34 },
  { category_code: 'APPEARANCE', category_name: '외관 검사', item_code: 'APP-06', item_name: '이젝터 자국', default_spec: '허용 범위 내', sort_order: 35 },
  { category_code: 'APPEARANCE', category_name: '외관 검사', item_code: 'APP-07', item_name: '색상', default_spec: '기준 색상 일치', sort_order: 36 },
  { category_code: 'APPEARANCE', category_name: '외관 검사', item_code: 'APP-08', item_name: '이물질', default_spec: '이물질 없음', sort_order: 37 },
  { category_code: 'APPEARANCE', category_name: '외관 검사', item_code: 'APP-09', item_name: '변형', default_spec: '변형 없음', sort_order: 38 },
  
  // 5. 기능 검사 (9개)
  { category_code: 'FUNCTION', category_name: '기능 검사', item_code: 'FUNC-01', item_name: '조립성', default_spec: '조립 용이', sort_order: 39 },
  { category_code: 'FUNCTION', category_name: '기능 검사', item_code: 'FUNC-02', item_name: '체결부 강도', default_spec: '규격 토크 적용', sort_order: 40 },
  { category_code: 'FUNCTION', category_name: '기능 검사', item_code: 'FUNC-03', item_name: '클립 체결력', default_spec: '규격 내', sort_order: 41 },
  { category_code: 'FUNCTION', category_name: '기능 검사', item_code: 'FUNC-04', item_name: '스냅핏 작동', default_spec: '작동 원활', sort_order: 42 },
  { category_code: 'FUNCTION', category_name: '기능 검사', item_code: 'FUNC-05', item_name: '힌지 작동', default_spec: '작동 원활', sort_order: 43 },
  { category_code: 'FUNCTION', category_name: '기능 검사', item_code: 'FUNC-06', item_name: '밀폐성', default_spec: '누수 없음', sort_order: 44 },
  { category_code: 'FUNCTION', category_name: '기능 검사', item_code: 'FUNC-07', item_name: '내구성', default_spec: '규격 횟수 통과', sort_order: 45 },
  { category_code: 'FUNCTION', category_name: '기능 검사', item_code: 'FUNC-08', item_name: '내열성', default_spec: '규격 온도 통과', sort_order: 46 },
  { category_code: 'FUNCTION', category_name: '기능 검사', item_code: 'FUNC-09', item_name: '내한성', default_spec: '규격 온도 통과', sort_order: 47 },
  
  // 6. 사출 조건 (9개)
  { category_code: 'INJECTION', category_name: '사출 조건', item_code: 'INJ-01', item_name: '사출 압력', default_spec: '설정값 ±10%', sort_order: 48 },
  { category_code: 'INJECTION', category_name: '사출 조건', item_code: 'INJ-02', item_name: '보압', default_spec: '설정값 ±10%', sort_order: 49 },
  { category_code: 'INJECTION', category_name: '사출 조건', item_code: 'INJ-03', item_name: '사출 속도', default_spec: '설정값 ±10%', sort_order: 50 },
  { category_code: 'INJECTION', category_name: '사출 조건', item_code: 'INJ-04', item_name: '금형 온도', default_spec: '설정값 ±5°C', sort_order: 51 },
  { category_code: 'INJECTION', category_name: '사출 조건', item_code: 'INJ-05', item_name: '수지 온도', default_spec: '설정값 ±10°C', sort_order: 52 },
  { category_code: 'INJECTION', category_name: '사출 조건', item_code: 'INJ-06', item_name: '냉각 시간', default_spec: '설정값 ±2초', sort_order: 53 },
  { category_code: 'INJECTION', category_name: '사출 조건', item_code: 'INJ-07', item_name: '사이클 타임', default_spec: '목표 CT 이내', sort_order: 54 },
  { category_code: 'INJECTION', category_name: '사출 조건', item_code: 'INJ-08', item_name: '쿠션량', default_spec: '5~10mm', sort_order: 55 },
  { category_code: 'INJECTION', category_name: '사출 조건', item_code: 'INJ-09', item_name: '형체력', default_spec: '설정값 확인', sort_order: 56 },
  
  // 7. 재료 검사 (8개)
  { category_code: 'MATERIAL', category_name: '재료 검사', item_code: 'MAT-01', item_name: '수지 종류', default_spec: '규격 수지 사용', sort_order: 57 },
  { category_code: 'MATERIAL', category_name: '재료 검사', item_code: 'MAT-02', item_name: '수지 등급', default_spec: '규격 등급 사용', sort_order: 58 },
  { category_code: 'MATERIAL', category_name: '재료 검사', item_code: 'MAT-03', item_name: '색상 마스터배치', default_spec: '규격 MB 사용', sort_order: 59 },
  { category_code: 'MATERIAL', category_name: '재료 검사', item_code: 'MAT-04', item_name: '건조 조건', default_spec: '규격 조건 준수', sort_order: 60 },
  { category_code: 'MATERIAL', category_name: '재료 검사', item_code: 'MAT-05', item_name: '재생재 비율', default_spec: '규격 비율 이내', sort_order: 61 },
  { category_code: 'MATERIAL', category_name: '재료 검사', item_code: 'MAT-06', item_name: '수분 함량', default_spec: '0.02% 이하', sort_order: 62 },
  { category_code: 'MATERIAL', category_name: '재료 검사', item_code: 'MAT-07', item_name: 'LOT 관리', default_spec: 'LOT 추적 가능', sort_order: 63 },
  { category_code: 'MATERIAL', category_name: '재료 검사', item_code: 'MAT-08', item_name: '성적서 확인', default_spec: '성적서 보유', sort_order: 64 },
  
  // 8. 포장/식별 (8개)
  { category_code: 'PACKAGE', category_name: '포장/식별', item_code: 'PKG-01', item_name: '제품 라벨', default_spec: '라벨 부착', sort_order: 65 },
  { category_code: 'PACKAGE', category_name: '포장/식별', item_code: 'PKG-02', item_name: '포장 상태', default_spec: '포장 양호', sort_order: 66 },
  { category_code: 'PACKAGE', category_name: '포장/식별', item_code: 'PKG-03', item_name: '수량 확인', default_spec: '수량 일치', sort_order: 67 },
  { category_code: 'PACKAGE', category_name: '포장/식별', item_code: 'PKG-04', item_name: '바코드/QR', default_spec: '스캔 가능', sort_order: 68 },
  { category_code: 'PACKAGE', category_name: '포장/식별', item_code: 'PKG-05', item_name: '출하 검사표', default_spec: '검사표 부착', sort_order: 69 },
  { category_code: 'PACKAGE', category_name: '포장/식별', item_code: 'PKG-06', item_name: '보호재', default_spec: '보호재 적용', sort_order: 70 },
  { category_code: 'PACKAGE', category_name: '포장/식별', item_code: 'PKG-07', item_name: '적재 방법', default_spec: '적재 기준 준수', sort_order: 71 },
  { category_code: 'PACKAGE', category_name: '포장/식별', item_code: 'PKG-08', item_name: '운송 조건', default_spec: '운송 조건 명시', sort_order: 72 },
  
  // 9. 문서/기록 (9개)
  { category_code: 'DOCUMENT', category_name: '문서/기록', item_code: 'DOC-01', item_name: '금형 도면', default_spec: '최신 도면 보유', sort_order: 73 },
  { category_code: 'DOCUMENT', category_name: '문서/기록', item_code: 'DOC-02', item_name: '제품 도면', default_spec: '최신 도면 보유', sort_order: 74 },
  { category_code: 'DOCUMENT', category_name: '문서/기록', item_code: 'DOC-03', item_name: '사출 조건표', default_spec: '조건표 작성', sort_order: 75 },
  { category_code: 'DOCUMENT', category_name: '문서/기록', item_code: 'DOC-04', item_name: '검사 성적서', default_spec: '성적서 작성', sort_order: 76 },
  { category_code: 'DOCUMENT', category_name: '문서/기록', item_code: 'DOC-05', item_name: '초물 검사 기록', default_spec: '기록 보유', sort_order: 77 },
  { category_code: 'DOCUMENT', category_name: '문서/기록', item_code: 'DOC-06', item_name: '금형 이력 카드', default_spec: '이력 카드 작성', sort_order: 78 },
  { category_code: 'DOCUMENT', category_name: '문서/기록', item_code: 'DOC-07', item_name: '보전 매뉴얼', default_spec: '매뉴얼 보유', sort_order: 79 },
  { category_code: 'DOCUMENT', category_name: '문서/기록', item_code: 'DOC-08', item_name: '트러블슈팅 가이드', default_spec: '가이드 보유', sort_order: 80 },
  { category_code: 'DOCUMENT', category_name: '문서/기록', item_code: 'DOC-09', item_name: '승인 서명', default_spec: '승인자 서명', sort_order: 81 }
];

async function createTable() {
  const client = new Client({
    connectionString: RAILWAY_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Railway DB');
    
    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pre_production_checklist_items (
        id SERIAL PRIMARY KEY,
        category_code VARCHAR(20) NOT NULL,
        category_name VARCHAR(100) NOT NULL,
        item_code VARCHAR(20) NOT NULL UNIQUE,
        item_name VARCHAR(200) NOT NULL,
        default_spec VARCHAR(200),
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Table created');
    
    // Insert items
    for (const item of CHECKLIST_ITEMS) {
      await client.query(`
        INSERT INTO pre_production_checklist_items 
        (category_code, category_name, item_code, item_name, default_spec, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (item_code) DO NOTHING
      `, [item.category_code, item.category_name, item.item_code, item.item_name, item.default_spec, item.sort_order]);
    }
    
    const count = await client.query('SELECT COUNT(*) as count FROM pre_production_checklist_items');
    console.log(`✅ Inserted ${count.rows[0].count} items`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

createTable();
