const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway'
});

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'mold_types' 
      ORDER BY ordinal_position
    `);
    console.log('=== mold_types 테이블 현재 구조 ===\n');
    console.table(result.rows);
    
    const data = await pool.query('SELECT * FROM mold_types LIMIT 5');
    console.log('\n=== 현재 데이터 샘플 ===\n');
    console.table(data.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

checkSchema();
