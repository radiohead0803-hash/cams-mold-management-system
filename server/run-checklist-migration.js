const { Sequelize } = require('sequelize');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { ssl: false },
  logging: false
});

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected.\n');

    // 1. checklist_instances 테이블 생성 (없으면 새로 생성)
    console.log('=== checklist_instances 테이블 생성/업데이트 ===');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS checklist_instances (
        id BIGSERIAL PRIMARY KEY,
        template_id BIGINT,
        mold_id BIGINT NOT NULL,
        plant_id BIGINT,
        site_type VARCHAR(255),
        category VARCHAR(255) NOT NULL DEFAULT 'daily',
        shot_counter INTEGER,
        status VARCHAR(255) NOT NULL DEFAULT 'draft',
        inspected_by BIGINT,
        inspected_at TIMESTAMP,
        check_date TIMESTAMP,
        results JSONB,
        production_quantity INTEGER DEFAULT 0,
        summary JSONB,
        inspector_id BIGINT,
        inspector_name VARCHAR(100),
        approver_id BIGINT,
        approved_by BIGINT,
        approved_at TIMESTAMP,
        rejected_by BIGINT,
        rejected_at TIMESTAMP,
        rejection_reason TEXT,
        requested_at TIMESTAMP,
        created_by BIGINT
      );
    `);
    console.log('checklist_instances table created/exists.\n');

    // 인덱스
    const ciIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_ci_status ON checklist_instances(status);',
      'CREATE INDEX IF NOT EXISTS idx_ci_approver ON checklist_instances(approver_id);',
      'CREATE INDEX IF NOT EXISTS idx_ci_inspector ON checklist_instances(inspector_id);',
      'CREATE INDEX IF NOT EXISTS idx_ci_mold_id ON checklist_instances(mold_id);'
    ];
    for (const sql of ciIndexes) {
      try { await sequelize.query(sql); } catch (e) {}
    }
    console.log('Indexes created.\n');

    // 2. repair_requests 테이블에 누락 컬럼 추가
    console.log('=== repair_requests 테이블 업데이트 ===');
    const rrColumns = [
      { name: 'plant_id', type: 'BIGINT' },
      { name: 'workflow_status', type: 'VARCHAR(50)' },
      { name: 'developer_id', type: 'BIGINT' },
      { name: 'developer_name', type: 'VARCHAR(100)' },
      { name: 'maker_company_id', type: 'BIGINT' },
      { name: 'maker_company_name', type: 'VARCHAR(200)' },
      { name: 'first_approved_by', type: 'BIGINT' },
      { name: 'first_approved_at', type: 'TIMESTAMP' },
      { name: 'first_approval_notes', type: 'TEXT' },
      { name: 'final_approved_by', type: 'BIGINT' },
      { name: 'final_approved_at', type: 'TIMESTAMP' },
      { name: 'final_approval_notes', type: 'TEXT' },
      { name: 'maker_started_at', type: 'TIMESTAMP' },
      { name: 'maker_completed_at', type: 'TIMESTAMP' },
      { name: 'maker_notes', type: 'TEXT' },
      { name: 'plant_confirmed_by', type: 'BIGINT' },
      { name: 'plant_confirmed_at', type: 'TIMESTAMP' },
      { name: 'plant_confirmation_notes', type: 'TEXT' }
    ];

    for (const col of rrColumns) {
      try {
        await sequelize.query(`ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`);
        console.log(`+ ${col.name}`);
      } catch (e) { console.log(`SKIP ${col.name}: ${e.message.substring(0, 60)}`); }
    }

    // 인덱스
    try { await sequelize.query('CREATE INDEX IF NOT EXISTS idx_rr_plant_id ON repair_requests(plant_id);'); } catch (e) {}
    try { await sequelize.query('CREATE INDEX IF NOT EXISTS idx_rr_workflow_status ON repair_requests(workflow_status);'); } catch (e) {}
    console.log('Indexes created.\n');

    // 3. 결과 확인
    const [ciCols] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'checklist_instances' ORDER BY ordinal_position;
    `);
    console.log(`checklist_instances: ${ciCols.length} columns`);

    const [rrCols] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'repair_requests' ORDER BY ordinal_position;
    `);
    console.log(`repair_requests: ${rrCols.length} columns`);

    console.log('\nMigration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();
