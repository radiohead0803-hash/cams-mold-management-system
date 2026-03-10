const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'server/src/migrations/20260310_scrapping_step_save.sql'),
      'utf8'
    );
    console.log('Running scrapping migration...');
    const result = await client.query(sql);
    console.log('Migration completed successfully.');
    if (Array.isArray(result)) {
      const last = result[result.length - 1];
      if (last && last.rows) console.log(last.rows);
    } else if (result.rows) {
      console.log(result.rows);
    }
  } catch (error) {
    console.error('Migration error:', error.message);
    // Try running statements one by one
    console.log('\nRetrying individual statements...');
    const sql = fs.readFileSync(
      path.join(__dirname, 'server/src/migrations/20260310_scrapping_step_save.sql'),
      'utf8'
    );
    const statements = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));
    for (let i = 0; i < statements.length; i++) {
      try {
        await client.query(statements[i]);
        console.log(`  [OK] Statement ${i + 1}`);
      } catch (e) {
        console.log(`  [SKIP] Statement ${i + 1}: ${e.message}`);
      }
    }
    console.log('Individual migration completed.');
  } finally {
    client.release();
    await pool.end();
  }
}

run();
