/**
 * mold_specifications 테이블 스키마 확인 스크립트
 */

const { Client } = require('pg');

const RAILWAY_DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

async function checkSchema() {
  const client = new Client({
    connectionString: RAILWAY_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Railway DB 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!\n');

    // mold_specifications 테이블 컬럼 확인
    console.log('📊 mold_specifications 테이블 스키마:');
    console.log('='.repeat(60));
    
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'mold_specifications'
      ORDER BY ordinal_position
    `);

    columns.rows.forEach((col, i) => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default.substring(0, 30)}` : '';
      console.log(`${(i+1).toString().padStart(2)}. ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
    });

    console.log('='.repeat(60));
    console.log(`총 ${columns.rows.length}개 컬럼\n`);

    // 필요한 컬럼 목록 (금형신규등록 페이지에서 사용하는 필드)
    const requiredColumns = [
      'primary_part_number',  // 대표품번
      'primary_part_name',    // 대표품명
      'part_number',          // 품번
      'part_name',            // 품명
      'car_model',            // 차종
      'car_year',             // 연식
      'mold_type',            // 금형 타입
      'cavity_count',         // 캐비티 수
      'material',             // 재질
      'tonnage',              // 톤수
      'target_maker_id',      // 목표 제작처
      'target_plant_id',      // 목표 생산처
      'development_stage',    // 진행단계 (개발/양산)
      'mold_spec_type',       // 제작사양 (시작금형/양산금형)
      'order_date',           // 발주일
      'target_delivery_date', // 목표 납기일
      'estimated_cost',       // ICMS 비용
      'maker_estimated_cost', // 업체 견적가
      'notes',                // 비고
      'mold_id',              // 금형 ID (연동)
      'status'                // 상태
    ];

    const existingColumns = columns.rows.map(c => c.column_name);
    const missingColumns = requiredColumns.filter(c => !existingColumns.includes(c));

    if (missingColumns.length > 0) {
      console.log('⚠️ 누락된 컬럼:');
      missingColumns.forEach(c => console.log(`   - ${c}`));
    } else {
      console.log('✅ 모든 필수 컬럼이 존재합니다.');
    }

    // 샘플 데이터 확인
    console.log('\n📋 샘플 데이터 (최근 3개):');
    const samples = await client.query(`
      SELECT id, part_number, part_name, car_model, development_stage, mold_spec_type, status
      FROM mold_specifications
      ORDER BY id DESC
      LIMIT 3
    `);
    
    samples.rows.forEach(row => {
      console.log(`  ID: ${row.id}, 품번: ${row.part_number}, 품명: ${row.part_name}, 차종: ${row.car_model}, 단계: ${row.development_stage}, 사양: ${row.mold_spec_type}, 상태: ${row.status}`);
    });

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 DB 연결 종료');
  }
}

checkSchema();
