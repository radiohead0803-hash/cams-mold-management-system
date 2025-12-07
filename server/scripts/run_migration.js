const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/models');

async function runMigration() {
  try {
    console.log('=== Running Migration ===');
    
    const sqlPath = path.join(__dirname, '../src/migrations/20251208_create_mold_detail_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // SQL을 세미콜론으로 분리하여 실행
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        try {
          console.log(`Executing: ${trimmed.substring(0, 60)}...`);
          await sequelize.query(trimmed);
          console.log('  ✓ Success');
        } catch (err) {
          // 이미 존재하는 경우 무시
          if (err.message.includes('already exists') || err.message.includes('duplicate')) {
            console.log('  ⚠ Already exists, skipping');
          } else {
            console.error('  ✗ Error:', err.message);
          }
        }
      }
    }
    
    console.log('\n=== Migration Completed ===');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    process.exit();
  }
}

runMigration();
