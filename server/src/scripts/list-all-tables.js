/**
 * Railway DB 전체 테이블 목록 및 데이터 현황 확인
 */

const { Client } = require('pg');

const RAILWAY_DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

async function listAllTables() {
  const client = new Client({
    connectionString: RAILWAY_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Railway DB 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!\n');

    // 모든 테이블 조회
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log(`📊 Railway DB 전체 테이블 (${tables.rows.length}개)`);
    console.log('='.repeat(60));
    console.log('번호  테이블명                              데이터 수');
    console.log('-'.repeat(60));

    let totalRecords = 0;
    let emptyTables = [];
    let filledTables = [];

    for (let i = 0; i < tables.rows.length; i++) {
      const tableName = tables.rows[i].table_name;
      try {
        const count = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
        const recordCount = parseInt(count.rows[0].count);
        totalRecords += recordCount;
        
        const status = recordCount > 0 ? '✅' : '⚠️';
        console.log(`${(i+1).toString().padStart(2)}. ${status} ${tableName.padEnd(38)} ${recordCount.toString().padStart(6)}개`);
        
        if (recordCount === 0) {
          emptyTables.push(tableName);
        } else {
          filledTables.push({ name: tableName, count: recordCount });
        }
      } catch (e) {
        console.log(`${(i+1).toString().padStart(2)}. ❌ ${tableName.padEnd(38)} 오류`);
      }
    }

    console.log('='.repeat(60));
    console.log(`\n📈 요약:`);
    console.log(`   총 테이블: ${tables.rows.length}개`);
    console.log(`   데이터 있는 테이블: ${filledTables.length}개`);
    console.log(`   비어있는 테이블: ${emptyTables.length}개`);
    console.log(`   총 레코드 수: ${totalRecords.toLocaleString()}개`);

    if (emptyTables.length > 0) {
      console.log(`\n⚠️ 비어있는 테이블 (${emptyTables.length}개):`);
      emptyTables.forEach(t => console.log(`   - ${t}`));
    }

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 DB 연결 종료');
  }
}

listAllTables();
