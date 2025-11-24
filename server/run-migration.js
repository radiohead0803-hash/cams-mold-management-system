const { Sequelize } = require('sequelize');
const config = require('./src/config/database');

const env = process.env.NODE_ENV || 'production';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.url, {
  ...dbConfig,
  logging: console.log
});

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    console.log('\n📋 Creating companies table...');
    
    // companies 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        company_code VARCHAR(50) UNIQUE NOT NULL,
        company_name VARCHAR(200) NOT NULL,
        company_type VARCHAR(20) NOT NULL CHECK (company_type IN ('maker', 'plant')),
        business_number VARCHAR(50),
        representative VARCHAR(100),
        phone VARCHAR(20),
        fax VARCHAR(20),
        email VARCHAR(100),
        address VARCHAR(500),
        address_detail VARCHAR(200),
        postal_code VARCHAR(20),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        manager_name VARCHAR(100),
        manager_phone VARCHAR(20),
        manager_email VARCHAR(100),
        contract_start_date DATE,
        contract_end_date DATE,
        contract_status VARCHAR(20) DEFAULT 'active',
        rating DECIMAL(3, 2),
        quality_score DECIMAL(5, 2),
        delivery_score DECIMAL(5, 2),
        production_capacity INTEGER,
        equipment_list JSONB,
        certifications JSONB,
        specialties JSONB,
        production_lines INTEGER,
        injection_machines JSONB,
        daily_capacity INTEGER,
        total_molds INTEGER DEFAULT 0,
        active_molds INTEGER DEFAULT 0,
        completed_projects INTEGER DEFAULT 0,
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        registered_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Companies table created.');

    console.log('\n📋 Creating indexes...');
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_companies_company_code ON companies(company_code);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_companies_company_type ON companies(company_type);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_companies_company_name ON companies(company_name);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);`);
    console.log('✅ Indexes created.');

    console.log('\n📋 Adding columns to existing tables...');
    
    // users 테이블에 company_id 추가
    try {
      await sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);`);
      await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);`);
      console.log('✅ Added company_id to users table.');
    } catch (err) {
      console.log('⚠️  users.company_id already exists or error:', err.message);
    }

    // molds 테이블에 company_id 추가
    try {
      await sequelize.query(`ALTER TABLE molds ADD COLUMN IF NOT EXISTS maker_company_id INTEGER REFERENCES companies(id);`);
      await sequelize.query(`ALTER TABLE molds ADD COLUMN IF NOT EXISTS plant_company_id INTEGER REFERENCES companies(id);`);
      await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_molds_maker_company_id ON molds(maker_company_id);`);
      await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_molds_plant_company_id ON molds(plant_company_id);`);
      console.log('✅ Added company_id columns to molds table.');
    } catch (err) {
      console.log('⚠️  molds company_id columns already exist or error:', err.message);
    }

    // mold_specifications 테이블에 company_id 추가
    try {
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS maker_company_id INTEGER REFERENCES companies(id);`);
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS plant_company_id INTEGER REFERENCES companies(id);`);
      await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_mold_specifications_maker_company_id ON mold_specifications(maker_company_id);`);
      await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_mold_specifications_plant_company_id ON mold_specifications(plant_company_id);`);
      console.log('✅ Added company_id columns to mold_specifications table.');
    } catch (err) {
      console.log('⚠️  mold_specifications company_id columns already exist or error:', err.message);
    }

    console.log('\n📋 Updating migration status...');
    try {
      await sequelize.query(`
        INSERT INTO "SequelizeMeta" (name) 
        VALUES ('20251124000000-create-companies-table.js')
        ON CONFLICT (name) DO NOTHING;
      `);
      console.log('✅ Migration status updated.');
    } catch (err) {
      console.log('⚠️  Migration status update error:', err.message);
    }

    console.log('\n🎉 Migration completed successfully!');
    
    // 테이블 확인
    const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM companies;`);
    console.log(`\n📊 Companies table has ${results[0].count} rows.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n👋 Database connection closed.');
  }
}

runMigration();
