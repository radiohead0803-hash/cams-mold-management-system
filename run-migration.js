const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Railway PostgreSQL');

    // inspection_photos 테이블 생성
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS inspection_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mold_id INTEGER REFERENCES molds(id) ON DELETE SET NULL,
        checklist_id INTEGER,
        item_status_id INTEGER,
        file_url VARCHAR(500) NOT NULL,
        thumbnail_url VARCHAR(500),
        file_type VARCHAR(50),
        file_size INTEGER,
        uploaded_by INTEGER NOT NULL REFERENCES users(id),
        shot_count INTEGER,
        metadata JSONB,
        uploaded_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client.query(createTableSQL);
    console.log('✅ inspection_photos 테이블 생성 완료');

    // 인덱스 생성
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_inspection_photos_mold_id ON inspection_photos(mold_id);',
      'CREATE INDEX IF NOT EXISTS idx_inspection_photos_checklist_id ON inspection_photos(checklist_id);',
      'CREATE INDEX IF NOT EXISTS idx_inspection_photos_item_status_id ON inspection_photos(item_status_id);',
      'CREATE INDEX IF NOT EXISTS idx_inspection_photos_uploaded_at ON inspection_photos(uploaded_at);'
    ];

    for (const idx of indexes) {
      await client.query(idx);
    }
    console.log('✅ 인덱스 생성 완료');

    // 테이블 확인
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inspection_photos'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 inspection_photos 테이블 구조:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\nDisconnected from database');
  }
}

run();
