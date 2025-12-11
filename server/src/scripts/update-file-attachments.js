/**
 * file_attachments 테이블에 file_data 컬럼 추가
 */

const { Client } = require('pg');

const RAILWAY_DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

async function updateTable() {
  const client = new Client({
    connectionString: RAILWAY_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Railway DB 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!\n');

    // file_data 컬럼 추가
    console.log('📄 file_attachments 테이블 업데이트 중...');
    
    await client.query(`
      ALTER TABLE file_attachments 
      ADD COLUMN IF NOT EXISTS file_data BYTEA
    `);
    console.log('  ✅ file_data 컬럼 추가됨');

    await client.query(`
      ALTER TABLE file_attachments 
      ADD COLUMN IF NOT EXISTS original_name VARCHAR(255)
    `);
    console.log('  ✅ original_name 컬럼 추가됨');

    await client.query(`
      ALTER TABLE file_attachments 
      ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500)
    `);
    console.log('  ✅ thumbnail_url 컬럼 추가됨');

    await client.query(`
      ALTER TABLE file_attachments 
      ADD COLUMN IF NOT EXISTS category VARCHAR(100)
    `);
    console.log('  ✅ category 컬럼 추가됨');

    await client.query(`
      ALTER TABLE file_attachments 
      ADD COLUMN IF NOT EXISTS description TEXT
    `);
    console.log('  ✅ description 컬럼 추가됨');

    // 컬럼 확인
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'file_attachments'
      ORDER BY ordinal_position
    `);

    console.log('\n📊 file_attachments 테이블 구조:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    console.log('\n========================================');
    console.log('✅ 테이블 업데이트 완료!');
    console.log('========================================');

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 DB 연결 종료');
  }
}

updateTable();
