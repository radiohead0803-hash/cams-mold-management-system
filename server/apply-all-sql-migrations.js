const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const sqlFiles = [
  '20241211_production_transfer.sql',
  '20241211_tryout_issues.sql',
  '20251208_add_mold_images.sql',
  '20251208_create_mold_detail_tables.sql',
  '20251210_add_weight_columns.sql',
  '20251210_fix_mold_images_columns.sql',
  '20251210_injection_conditions.sql',
  '20251210_repair_requests_update.sql'
];

async function applyMigrations() {
  console.log('=== Railway DB SQL 마이그레이션 적용 ===\n');
  
  for (const file of sqlFiles) {
    const filePath = path.join(__dirname, 'src', 'migrations', file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${file} - 파일 없음, 스킵`);
      continue;
    }
    
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      await pool.query(sql);
      console.log(`✅ ${file} - 적용 완료`);
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log(`⏭️  ${file} - 이미 적용됨`);
      } else {
        console.log(`❌ ${file} - 오류: ${error.message}`);
      }
    }
  }
  
  // 테이블 수 확인
  const result = await pool.query(`
    SELECT count(*) as cnt 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  
  console.log(`\n=== 총 ${result.rows[0].cnt}개 테이블 ===`);
  
  await pool.end();
}

applyMigrations();
