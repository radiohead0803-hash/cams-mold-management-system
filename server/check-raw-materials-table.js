const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTables() {
  try {
    // Material 관련 테이블 확인
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%material%'
      ORDER BY table_name
    `);
    
    console.log('Material 관련 테이블:');
    result.rows.forEach(row => console.log('-', row.table_name));
    
    // raw_materials 테이블 존재 여부 확인
    const rawCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'raw_materials'
      ) as exists
    `);
    
    console.log('\nraw_materials 테이블 존재:', rawCheck.rows[0].exists);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

checkTables();
