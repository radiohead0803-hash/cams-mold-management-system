/**
 * mold_specifications 테이블에 누락된 컬럼 추가
 */

const { Client } = require('pg');

const RAILWAY_DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

async function addMissingColumns() {
  const client = new Client({
    connectionString: RAILWAY_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Railway DB 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!\n');

    console.log('📄 mold_specifications 테이블에 누락된 컬럼 추가 중...');

    // 1. target_plant_id (목표 생산처)
    try {
      await client.query(`
        ALTER TABLE mold_specifications 
        ADD COLUMN IF NOT EXISTS target_plant_id INTEGER
      `);
      console.log('  ✅ target_plant_id 컬럼 추가됨');
    } catch (e) {
      console.log('  ⏭️ target_plant_id:', e.message);
    }

    // 2. mold_spec_type (제작사양: 시작금형/양산금형)
    try {
      await client.query(`
        ALTER TABLE mold_specifications 
        ADD COLUMN IF NOT EXISTS mold_spec_type VARCHAR(50) DEFAULT '시작금형'
      `);
      console.log('  ✅ mold_spec_type 컬럼 추가됨');
    } catch (e) {
      console.log('  ⏭️ mold_spec_type:', e.message);
    }

    // 3. maker_estimated_cost (업체 견적가) - vendor_quote_cost와 동일한 역할
    // 이미 vendor_quote_cost가 있으므로 별칭으로 사용하거나 추가
    try {
      await client.query(`
        ALTER TABLE mold_specifications 
        ADD COLUMN IF NOT EXISTS maker_estimated_cost NUMERIC(12, 2)
      `);
      console.log('  ✅ maker_estimated_cost 컬럼 추가됨');
    } catch (e) {
      console.log('  ⏭️ maker_estimated_cost:', e.message);
    }

    // 4. drawing_review_date (도면검토회 일정)
    try {
      await client.query(`
        ALTER TABLE mold_specifications 
        ADD COLUMN IF NOT EXISTS drawing_review_date DATE
      `);
      console.log('  ✅ drawing_review_date 컬럼 추가됨');
    } catch (e) {
      console.log('  ⏭️ drawing_review_date:', e.message);
    }

    // 5. actual_delivery_date (실제 납기일)
    try {
      await client.query(`
        ALTER TABLE mold_specifications 
        ADD COLUMN IF NOT EXISTS actual_delivery_date DATE
      `);
      console.log('  ✅ actual_delivery_date 컬럼 추가됨');
    } catch (e) {
      console.log('  ⏭️ actual_delivery_date:', e.message);
    }

    // 6. actual_cost (실제 비용)
    try {
      await client.query(`
        ALTER TABLE mold_specifications 
        ADD COLUMN IF NOT EXISTS actual_cost NUMERIC(12, 2)
      `);
      console.log('  ✅ actual_cost 컬럼 추가됨');
    } catch (e) {
      console.log('  ⏭️ actual_cost:', e.message);
    }

    // 7. external_sync_enabled (외부 시스템 연동 여부)
    try {
      await client.query(`
        ALTER TABLE mold_specifications 
        ADD COLUMN IF NOT EXISTS external_sync_enabled BOOLEAN DEFAULT FALSE
      `);
      console.log('  ✅ external_sync_enabled 컬럼 추가됨');
    } catch (e) {
      console.log('  ⏭️ external_sync_enabled:', e.message);
    }

    // 8. last_sync_date (마지막 동기화 일시)
    try {
      await client.query(`
        ALTER TABLE mold_specifications 
        ADD COLUMN IF NOT EXISTS last_sync_date TIMESTAMP
      `);
      console.log('  ✅ last_sync_date 컬럼 추가됨');
    } catch (e) {
      console.log('  ⏭️ last_sync_date:', e.message);
    }

    // 결과 확인
    console.log('\n📊 업데이트된 mold_specifications 테이블 컬럼 수:');
    const result = await client.query(`
      SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_name = 'mold_specifications'
    `);
    console.log(`   총 ${result.rows[0].count}개 컬럼`);

    // 새로 추가된 컬럼 확인
    const newColumns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'mold_specifications'
      AND column_name IN ('target_plant_id', 'mold_spec_type', 'maker_estimated_cost', 'drawing_review_date', 'actual_delivery_date', 'actual_cost')
      ORDER BY column_name
    `);

    console.log('\n📋 추가된 컬럼 확인:');
    newColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}${col.column_default ? ` (기본값: ${col.column_default})` : ''}`);
    });

    console.log('\n========================================');
    console.log('✅ 컬럼 추가 완료!');
    console.log('========================================');

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 DB 연결 종료');
  }
}

addMissingColumns();
