const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway'
});

async function check() {
  try {
    // 테이블 구조 확인
    const schema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'raw_materials' 
      ORDER BY ordinal_position
    `);
    console.log('=== raw_materials 테이블 구조 ===');
    console.table(schema.rows);

    // 데이터 확인
    const data = await pool.query('SELECT id, ms_spec, material_type, supplier FROM raw_materials ORDER BY id LIMIT 15');
    console.log('\n=== 현재 데이터 ===');
    console.table(data.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

check();
