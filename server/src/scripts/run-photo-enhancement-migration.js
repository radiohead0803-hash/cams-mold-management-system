/**
 * 사진 시스템 마이그레이션 실행 스크립트
 * 20260310_photo_system_enhancement.sql 실행
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const RAILWAY_DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

async function runMigration() {
  const client = new Client({ connectionString: RAILWAY_DB_URL, ssl: { rejectUnauthorized: false } });
  
  try {
    console.log('🔗 Railway DB 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!\n');

    const sqlPath = path.join(__dirname, '..', 'migrations', '20260310_photo_system_enhancement.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 주석과 빈 줄 제거 후 세미콜론으로 분할
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`📄 ${statements.length}개 SQL 문 실행 중...\n`);

    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (const stmt of statements) {
      try {
        await client.query(stmt);
        success++;
        // 첫 줄만 로그
        const firstLine = stmt.split('\n').find(l => l.trim() && !l.trim().startsWith('--')) || stmt.substring(0, 60);
        console.log(`  ✅ ${firstLine.trim().substring(0, 80)}`);
      } catch (err) {
        if (err.code === '42701') {
          // column already exists
          skipped++;
          console.log(`  ⏭️  이미 존재: ${stmt.substring(0, 60).trim()}`);
        } else if (err.code === '42P07') {
          // table/index already exists
          skipped++;
          console.log(`  ⏭️  이미 존재: ${stmt.substring(0, 60).trim()}`);
        } else {
          failed++;
          console.error(`  ❌ ${stmt.substring(0, 60).trim()}`);
          console.error(`     오류: ${err.message}`);
        }
      }
    }

    console.log('\n========================================');
    console.log(`✅ 성공: ${success}, ⏭️ 스킵: ${skipped}, ❌ 실패: ${failed}`);
    console.log('========================================');

    // 결과 확인
    console.log('\n📊 마이그레이션 후 inspection_photos 컬럼 목록:');
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inspection_photos' 
      ORDER BY ordinal_position
    `);
    cols.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 DB 연결 종료');
  }
}

runMigration();
