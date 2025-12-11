const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkMoldSpec64() {
  try {
    // mold_specifications id=64 전체 데이터 확인
    const result = await pool.query(`
      SELECT * FROM mold_specifications WHERE id = 64
    `);
    
    console.log('=== mold_specifications id=64 ===');
    if (result.rows.length > 0) {
      const data = result.rows[0];
      console.log('created_at:', data.created_at);
      console.log('updated_at:', data.updated_at);
      console.log('status:', data.status);
      console.log('development_stage:', data.development_stage);
      console.log('production_stage:', data.production_stage);
      console.log('\nFull data:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('데이터 없음');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkMoldSpec64();
