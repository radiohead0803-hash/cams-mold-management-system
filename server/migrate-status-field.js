const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrateStatusField() {
  try {
    console.log('=== status 필드 마이그레이션 ===\n');
    
    // 1. 초안 → 임시저장
    const result1 = await pool.query(`
      UPDATE mold_specifications 
      SET status = '임시저장' 
      WHERE status = '초안'
    `);
    console.log(`✅ '초안' → '임시저장': ${result1.rowCount}건 업데이트`);
    
    // 2. draft → 임시저장 (혹시 남아있는 영문 데이터)
    const result2 = await pool.query(`
      UPDATE mold_specifications 
      SET status = '임시저장' 
      WHERE status = 'draft'
    `);
    console.log(`✅ 'draft' → '임시저장': ${result2.rowCount}건 업데이트`);
    
    // 결과 확인
    const checkResult = await pool.query(`
      SELECT status, count(*) as cnt
      FROM mold_specifications
      GROUP BY status
      ORDER BY status
    `);
    
    console.log('\n=== 마이그레이션 결과 ===');
    console.table(checkResult.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

migrateStatusField();
