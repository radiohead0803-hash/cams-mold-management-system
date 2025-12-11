/**
 * 현재 시스템 DB 연결 상태 확인 스크립트
 */

const { Client } = require('pg');

// Railway DB 연결 정보
const RAILWAY_DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

async function checkConnection() {
  const client = new Client({
    connectionString: RAILWAY_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Railway DB 연결 확인 중...');
    console.log(`   URL: ${RAILWAY_DB_URL.replace(/:[^:@]+@/, ':****@')}\n`);
    
    await client.connect();
    console.log('✅ Railway DB 연결 성공!\n');

    // DB 정보 확인
    const dbInfo = await client.query('SELECT current_database(), current_user, version()');
    console.log('📊 데이터베이스 정보:');
    console.log(`   Database: ${dbInfo.rows[0].current_database}`);
    console.log(`   User: ${dbInfo.rows[0].current_user}`);
    console.log(`   Version: ${dbInfo.rows[0].version.split(',')[0]}\n`);

    // 테이블 수 확인
    const tableCount = await client.query(`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`📋 총 테이블 수: ${tableCount.rows[0].count}개\n`);

    // 주요 테이블 데이터 수 확인
    const mainTables = [
      'users',
      'companies', 
      'molds',
      'mold_specifications',
      'maker_specifications',
      'plant_molds',
      'inspections',
      'daily_checklists',
      'tryout_issues',
      'checklist_master_templates',
      'production_transfer_checklist_master'
    ];

    console.log('📊 주요 테이블 데이터 현황:');
    console.log('=' .repeat(45));
    
    for (const table of mainTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const count = result.rows[0].count;
        const status = count > 0 ? '✅' : '⚠️';
        console.log(`  ${status} ${table.padEnd(35)} ${count}개`);
      } catch (err) {
        console.log(`  ❌ ${table.padEnd(35)} 테이블 없음`);
      }
    }

    console.log('=' .repeat(45));

  } catch (error) {
    console.error('❌ Railway DB 연결 실패:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 DB 연결 종료');
  }
}

checkConnection();
