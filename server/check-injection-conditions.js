const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkInjectionConditions() {
  try {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'injection_conditions' 
      ORDER BY ordinal_position
    `);
    
    console.log('=== injection_conditions 테이블 컬럼 ===');
    console.log('Total:', result.rows.length, 'columns');
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.column_name}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkInjectionConditions();
