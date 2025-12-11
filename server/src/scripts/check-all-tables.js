/**
 * Railway DB 테이블 현황 확인 스크립트
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

async function checkTables() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Railway DB 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!\n');

    // 모든 테이블 조회
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📊 현재 Railway DB 테이블 (${result.rows.length}개):`);
    console.log('=' .repeat(50));
    result.rows.forEach((row, i) => {
      console.log(`${(i+1).toString().padStart(2)}. ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 DB 연결 종료');
  }
}

checkTables();
