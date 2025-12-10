const { Sequelize } = require('sequelize');

// Railway PostgreSQL 연결
const DATABASE_URL = 'postgresql://postgres:wGDLaCKVdvhNnxOVsLSWayzEFfmCLHMa@autorack.proxy.rlwy.net:52053/railway';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: false
  },
  logging: console.log
});

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    console.log('\n📋 Updating repair_requests table...');
    
    // repair_requests 테이블에 컬럼 추가
    const columnsToAdd = [
      // 기본 정보
      { name: 'problem', type: 'TEXT' },
      { name: 'cause_and_reason', type: 'TEXT' },
      { name: 'problem_source', type: 'TEXT' },
      { name: 'occurred_date', type: 'DATE' },
      { name: 'manager_name', type: 'VARCHAR(100)' },
      // 금형/제품 정보
      { name: 'requester_name', type: 'VARCHAR(100)' },
      { name: 'car_model', type: 'VARCHAR(100)' },
      { name: 'part_number', type: 'VARCHAR(100)' },
      { name: 'part_name', type: 'VARCHAR(200)' },
      { name: 'occurrence_type', type: "VARCHAR(50) DEFAULT '신규'" },
      { name: 'production_site', type: 'VARCHAR(200)' },
      { name: 'production_manager', type: 'VARCHAR(100)' },
      { name: 'contact', type: 'VARCHAR(50)' },
      { name: 'production_shot', type: 'INTEGER' },
      { name: 'maker', type: 'VARCHAR(200)' },
      { name: 'operation_type', type: "VARCHAR(50) DEFAULT '양산'" },
      { name: 'problem_type', type: 'VARCHAR(100)' },
      { name: 'repair_category', type: 'VARCHAR(50)' },
      // 수리 정보
      { name: 'repair_cost', type: 'DECIMAL(12,0)' },
      { name: 'completion_date', type: 'DATE' },
      { name: 'temporary_action', type: 'TEXT' },
      { name: 'root_cause_action', type: 'TEXT' },
      { name: 'mold_arrival_date', type: 'DATE' },
      { name: 'repair_start_date', type: 'DATE' },
      { name: 'repair_end_date', type: 'DATE' },
      { name: 'stock_schedule_date', type: 'DATE' },
      { name: 'stock_quantity', type: 'INTEGER' },
      { name: 'stock_unit', type: "VARCHAR(20) DEFAULT 'EA'" },
      { name: 'repair_company', type: 'VARCHAR(200)' },
      { name: 'repair_duration', type: 'VARCHAR(50)' },
      { name: 'management_type', type: 'VARCHAR(50)' },
      { name: 'sign_off_status', type: "VARCHAR(100) DEFAULT '제출되지 않음'" },
      { name: 'representative_part_number', type: 'VARCHAR(100)' },
      { name: 'order_company', type: 'VARCHAR(200)' },
      { name: 'related_files', type: "JSONB DEFAULT '[]'::jsonb" },
      // 수리처 선정
      { name: 'repair_shop_type', type: 'VARCHAR(50)' },
      { name: 'repair_shop_selected_by', type: 'VARCHAR(100)' },
      { name: 'repair_shop_selected_date', type: 'DATE' },
      { name: 'repair_shop_approval_status', type: "VARCHAR(20) DEFAULT '대기'" },
      { name: 'repair_shop_approved_by', type: 'VARCHAR(100)' },
      { name: 'repair_shop_approved_date', type: 'DATE' },
      { name: 'repair_shop_rejection_reason', type: 'TEXT' },
      // 귀책 협의
      { name: 'liability_type', type: 'VARCHAR(50)' },
      { name: 'liability_ratio_maker', type: 'INTEGER' },
      { name: 'liability_ratio_plant', type: 'INTEGER' },
      { name: 'liability_reason', type: 'TEXT' },
      { name: 'liability_decided_by', type: 'VARCHAR(100)' },
      { name: 'liability_decided_date', type: 'DATE' }
    ];

    for (const col of columnsToAdd) {
      try {
        await sequelize.query(`ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`);
        console.log(`✅ Added column: ${col.name}`);
      } catch (err) {
        console.log(`⚠️  Column ${col.name}: ${err.message}`);
      }
    }

    console.log('\n📋 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_repair_requests_occurred_date ON repair_requests(occurred_date);',
      'CREATE INDEX IF NOT EXISTS idx_repair_requests_car_model ON repair_requests(car_model);',
      'CREATE INDEX IF NOT EXISTS idx_repair_requests_part_number ON repair_requests(part_number);',
      'CREATE INDEX IF NOT EXISTS idx_repair_requests_occurrence_type ON repair_requests(occurrence_type);',
      'CREATE INDEX IF NOT EXISTS idx_repair_requests_problem_type ON repair_requests(problem_type);',
      'CREATE INDEX IF NOT EXISTS idx_repair_requests_repair_category ON repair_requests(repair_category);',
      'CREATE INDEX IF NOT EXISTS idx_repair_requests_repair_shop_approval_status ON repair_requests(repair_shop_approval_status);'
    ];

    for (const idx of indexes) {
      try {
        await sequelize.query(idx);
        console.log('✅ Index created');
      } catch (err) {
        console.log(`⚠️  Index: ${err.message}`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    
    // 테이블 컬럼 확인
    const [results] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'repair_requests' 
      ORDER BY ordinal_position;
    `);
    console.log(`\n📊 repair_requests table has ${results.length} columns.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n👋 Database connection closed.');
  }
}

runMigration();
