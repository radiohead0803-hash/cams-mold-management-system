const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway'
});

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tonnages' 
      ORDER BY ordinal_position
    `);
    console.log('=== tonnages (사출기 사양) 테이블 컬럼 구조 ===\n');
    console.table(result.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

checkSchema();
