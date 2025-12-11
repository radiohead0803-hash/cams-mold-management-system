const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkMoldSpecifications() {
  try {
    // 1. mold_specifications 테이블 컬럼 확인
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'mold_specifications' 
      ORDER BY ordinal_position
    `);
    
    console.log('=== mold_specifications 테이블 컬럼 ===');
    console.log('Total:', columnsResult.rows.length, 'columns\n');
    columnsResult.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    
    // 2. mold_specifications 데이터 확인
    const dataResult = await pool.query(`
      SELECT id, part_number, part_name, car_model, development_stage, production_stage, status, created_at
      FROM mold_specifications 
      ORDER BY id DESC
      LIMIT 10
    `);
    
    console.log('\n\n=== mold_specifications 데이터 (최근 10개) ===');
    console.log('Total rows:', dataResult.rows.length);
    if (dataResult.rows.length > 0) {
      console.table(dataResult.rows);
    } else {
      console.log('No data found');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkMoldSpecifications();
