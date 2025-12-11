const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkHistoryTables() {
  try {
    // 1. history/audit 관련 테이블 확인
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%history%' OR table_name LIKE '%audit%' OR table_name LIKE '%log%')
      ORDER BY table_name
    `);
    
    console.log('=== History/Audit/Log 테이블 ===');
    tablesResult.rows.forEach(row => console.log('-', row.table_name));
    
    // 2. audit_logs 테이블 구조 확인
    const auditLogsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs'
      ORDER BY ordinal_position
    `);
    
    console.log('\n=== audit_logs 테이블 컬럼 ===');
    auditLogsResult.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    
    // 3. mold_specifications의 최근 데이터 확인 (id=64)
    const moldSpecResult = await pool.query(`
      SELECT id, part_number, part_name, status, created_at, updated_at
      FROM mold_specifications
      WHERE id = 64
    `);
    
    console.log('\n=== mold_specifications id=64 ===');
    if (moldSpecResult.rows.length > 0) {
      console.log(moldSpecResult.rows[0]);
    } else {
      console.log('데이터 없음');
    }
    
    // 4. audit_logs에서 mold_specifications 관련 로그 확인
    const auditResult = await pool.query(`
      SELECT * FROM audit_logs 
      WHERE table_name = 'mold_specifications' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n=== audit_logs (mold_specifications) ===');
    console.log('Total:', auditResult.rows.length, 'records');
    if (auditResult.rows.length > 0) {
      console.table(auditResult.rows);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkHistoryTables();
