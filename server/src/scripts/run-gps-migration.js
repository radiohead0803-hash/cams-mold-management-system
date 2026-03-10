const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const RAILWAY_DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

async function runMigration() {
  const client = new Client({ connectionString: RAILWAY_DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ DB 연결 성공\n');

  const sqlPath = path.join(__dirname, '..', 'migrations', '20260310_gps_location_tracking.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`📄 ${statements.length}개 SQL 문 실행 중...\n`);
  let success = 0, skipped = 0, failed = 0;

  for (const stmt of statements) {
    try {
      await client.query(stmt);
      success++;
      const first = stmt.split('\n').find(l => l.trim() && !l.trim().startsWith('--')) || stmt.substring(0, 60);
      console.log(`  ✅ ${first.trim().substring(0, 80)}`);
    } catch (err) {
      if (err.code === '42701' || err.code === '42P07') {
        skipped++;
        console.log(`  ⏭️  이미 존재: ${stmt.substring(0, 60).trim()}`);
      } else {
        failed++;
        console.error(`  ❌ ${stmt.substring(0, 60).trim()} → ${err.message}`);
      }
    }
  }

  console.log(`\n✅ 성공: ${success}, ⏭️ 스킵: ${skipped}, ❌ 실패: ${failed}`);

  // 확인
  console.log('\n📊 molds GPS 컬럼:');
  const mc = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='molds' AND (column_name LIKE '%gps%' OR column_name LIKE '%drift%' OR column_name='location_status') ORDER BY ordinal_position`);
  mc.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

  console.log('\n📊 mold_location_logs 컬럼:');
  const lc = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='mold_location_logs' ORDER BY ordinal_position`);
  lc.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

  await client.end();
  console.log('\n🔌 완료');
}

runMigration().catch(e => { console.error(e); process.exit(1); });
