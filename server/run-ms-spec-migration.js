const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'src/migrations/20251212_ms_spec_materials.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running MS SPEC materials migration...');
    await pool.query(sql);
    console.log('Migration completed successfully!');
    
    // 확인
    const result = await pool.query('SELECT COUNT(*) as count FROM ms_spec_materials');
    console.log(`Inserted ${result.rows[0].count} records`);
    
    // 샘플 데이터 출력
    const sample = await pool.query('SELECT ms_spec, spec_code FROM ms_spec_materials LIMIT 5');
    console.log('\nSample data:');
    sample.rows.forEach(row => console.log(`- ${row.ms_spec} (${row.spec_code || 'N/A'})`));
    
    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
