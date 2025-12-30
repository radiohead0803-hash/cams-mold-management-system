const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

const client = new Client({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // raw_materials 테이블에 specific_gravity 컬럼 추가
    console.log('🔄 Adding specific_gravity column to raw_materials...');
    try {
      await client.query(`
        ALTER TABLE raw_materials 
        ADD COLUMN IF NOT EXISTS specific_gravity DECIMAL(5,3);
      `);
      console.log('✅ specific_gravity 컬럼 추가 완료');
    } catch (e) {
      console.log('  - specific_gravity 컬럼 추가 스킵:', e.message);
    }

    // 테이블 확인
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'raw_materials'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 raw_materials 테이블 구조:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n✅ 마이그레이션 완료!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
