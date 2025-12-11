/**
 * checklist_master_templates 테이블 생성 스크립트
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

const sql = `
-- 1. 체크리스트 마스터 템플릿
CREATE TABLE IF NOT EXISTS checklist_master_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(100) NOT NULL,
  template_type VARCHAR(50) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 체크리스트 템플릿 항목
CREATE TABLE IF NOT EXISTS checklist_template_items (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES checklist_master_templates(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  item_description TEXT,
  order_index INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT TRUE,
  field_type VARCHAR(50) DEFAULT 'boolean',
  field_options JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. 체크리스트 템플릿 배포 이력
CREATE TABLE IF NOT EXISTS checklist_template_deployments (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES checklist_master_templates(id) ON DELETE CASCADE,
  deployed_date TIMESTAMP DEFAULT NOW(),
  deployed_by VARCHAR(100),
  target_type VARCHAR(50),
  target_id INTEGER,
  scope JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. 체크리스트 템플릿 변경 이력
CREATE TABLE IF NOT EXISTS checklist_template_history (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES checklist_master_templates(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  changes TEXT,
  changed_by VARCHAR(100),
  changed_at TIMESTAMP DEFAULT NOW()
);
`;

async function createTables() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Railway DB 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!');

    console.log('📄 테이블 생성 중...');
    await client.query(sql);
    console.log('✅ 테이블 생성 완료!');

    // 테이블 확인
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'checklist%'
      ORDER BY table_name
    `);
    
    console.log('\n생성된 테이블:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 DB 연결 종료');
  }
}

createTables();
