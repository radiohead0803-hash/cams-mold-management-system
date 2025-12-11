/**
 * 모든 주요 테이블 스키마 확인 스크립트
 */

const { Client } = require('pg');

const RAILWAY_DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

const MAIN_TABLES = [
  'mold_specifications',
  'maker_specifications', 
  'plant_molds',
  'molds',
  'companies',
  'users',
  'daily_checklists',
  'inspections',
  'repair_requests',
  'tryout_issues',
  'production_transfer_checklist_master',
  'injection_conditions'
];

async function checkSchemas() {
  const client = new Client({
    connectionString: RAILWAY_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Railway DB 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!\n');

    for (const tableName of MAIN_TABLES) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 ${tableName} 테이블`);
      console.log('='.repeat(60));
      
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      if (columns.rows.length === 0) {
        console.log('  ❌ 테이블이 존재하지 않습니다.');
        continue;
      }

      columns.rows.forEach((col, i) => {
        const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL';
        console.log(`${(i+1).toString().padStart(2)}. ${col.column_name.padEnd(35)} ${col.data_type.padEnd(20)}${nullable}`);
      });
      
      console.log(`\n총 ${columns.rows.length}개 컬럼`);

      // 데이터 수 확인
      const count = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
      console.log(`데이터: ${count.rows[0].count}개`);
    }

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 DB 연결 종료');
  }
}

checkSchemas();
