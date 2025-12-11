const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrateProductionStage() {
  try {
    console.log('=== production_stage 데이터 마이그레이션 ===\n');
    
    // 1. 시제 → 시작금형
    const result1 = await pool.query(`
      UPDATE mold_specifications 
      SET production_stage = '시작금형' 
      WHERE production_stage = '시제'
    `);
    console.log(`✅ '시제' → '시작금형': ${result1.rowCount}건 업데이트`);
    
    // 2. 양산 → 양산금형
    const result2 = await pool.query(`
      UPDATE mold_specifications 
      SET production_stage = '양산금형' 
      WHERE production_stage = '양산'
    `);
    console.log(`✅ '양산' → '양산금형': ${result2.rowCount}건 업데이트`);
    
    // 3. status 한글화: draft → 초안
    const result3 = await pool.query(`
      UPDATE mold_specifications 
      SET status = '초안' 
      WHERE status = 'draft'
    `);
    console.log(`✅ 'draft' → '초안': ${result3.rowCount}건 업데이트`);
    
    // 4. status 한글화: pending → 승인대기
    const result4 = await pool.query(`
      UPDATE mold_specifications 
      SET status = '승인대기' 
      WHERE status = 'pending'
    `);
    console.log(`✅ 'pending' → '승인대기': ${result4.rowCount}건 업데이트`);
    
    // 5. status 한글화: approved → 승인완료
    const result5 = await pool.query(`
      UPDATE mold_specifications 
      SET status = '승인완료' 
      WHERE status = 'approved'
    `);
    console.log(`✅ 'approved' → '승인완료': ${result5.rowCount}건 업데이트`);
    
    // 6. status 한글화: rejected → 반려
    const result6 = await pool.query(`
      UPDATE mold_specifications 
      SET status = '반려' 
      WHERE status = 'rejected'
    `);
    console.log(`✅ 'rejected' → '반려': ${result6.rowCount}건 업데이트`);
    
    // 결과 확인
    const checkResult = await pool.query(`
      SELECT development_stage, production_stage, status, count(*) as cnt
      FROM mold_specifications
      GROUP BY development_stage, production_stage, status
      ORDER BY development_stage, production_stage, status
    `);
    
    console.log('\n=== 마이그레이션 결과 ===');
    console.table(checkResult.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

migrateProductionStage();
