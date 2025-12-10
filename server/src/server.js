const app = require('./app');
const { sequelize } = require('./models/newIndex');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 5000;

// Run migrations
const runMigrations = () => {
  return new Promise((resolve, reject) => {
    console.log('🔄 Running database migrations...');
    const migrationsPath = path.join(__dirname, '..');
    exec('npx sequelize-cli db:migrate', { cwd: migrationsPath }, (error, stdout, stderr) => {
      if (error) {
        console.error('⚠️ Migration warning:', stderr || error.message);
        // Don't reject - migrations might already be applied
        resolve();
      } else {
        console.log('✅ Migrations completed:', stdout);
        resolve();
      }
    });
  });
};

// Run SQL migrations for mold_images table
const runMoldImagesMigration = async () => {
  console.log('🔄 Running mold_images table migration...');
  try {
    // 테이블 생성 (없으면)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS mold_images (
        id SERIAL PRIMARY KEY,
        mold_id INTEGER,
        mold_spec_id INTEGER,
        image_type VARCHAR(50) NOT NULL DEFAULT 'mold',
        image_url TEXT NOT NULL,
        original_filename VARCHAR(255),
        file_size INTEGER,
        mime_type VARCHAR(100),
        description TEXT,
        display_order INTEGER DEFAULT 0,
        is_primary BOOLEAN DEFAULT FALSE,
        uploaded_by INTEGER,
        reference_type VARCHAR(50),
        reference_id INTEGER,
        checklist_id INTEGER,
        checklist_item_id INTEGER,
        repair_id INTEGER,
        transfer_id INTEGER,
        maker_spec_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ mold_images table created/verified.');

    // 인덱스 생성 (없으면)
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_mold_images_mold_id ON mold_images(mold_id)',
      'CREATE INDEX IF NOT EXISTS idx_mold_images_mold_spec_id ON mold_images(mold_spec_id)',
      'CREATE INDEX IF NOT EXISTS idx_mold_images_image_type ON mold_images(image_type)'
    ];
    for (const idx of indexes) {
      try {
        await sequelize.query(idx);
      } catch (e) {
        // 인덱스 이미 존재하면 무시
      }
    }
    console.log('✅ mold_images indexes created/verified.');

    // mold_specifications에 이미지 URL 컬럼 추가
    try {
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS mold_image_url TEXT`);
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS product_image_url TEXT`);
      console.log('✅ mold_specifications image columns added/verified.');
    } catch (e) {
      console.log('⚠️ mold_specifications columns may already exist:', e.message);
    }

  } catch (error) {
    console.error('⚠️ mold_images migration warning:', error.message);
    // Don't throw - table might already exist with correct structure
  }
};

// Run SQL migrations for injection_conditions table
const runInjectionConditionsMigration = async () => {
  console.log('🔄 Running injection_conditions table migration...');
  try {
    const sqlPath = path.join(__dirname, 'migrations', '20251210_injection_conditions.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await sequelize.query(sql);
      console.log('✅ injection_conditions table migration completed.');
    } else {
      console.log('⚠️ injection_conditions migration file not found, skipping...');
    }
  } catch (error) {
    console.error('⚠️ injection_conditions migration warning:', error.message);
  }
};

// Run SQL migrations for weight columns
const runWeightColumnsMigration = async () => {
  console.log('🔄 Running weight columns migration...');
  try {
    // mold_specifications에 중량 컬럼 추가
    const columns = [
      { name: 'design_weight', sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS design_weight DECIMAL(10,2)' },
      { name: 'design_weight_unit', sql: "ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS design_weight_unit VARCHAR(10) DEFAULT 'g'" },
      { name: 'actual_weight', sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS actual_weight DECIMAL(10,2)' },
      { name: 'actual_weight_unit', sql: "ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS actual_weight_unit VARCHAR(10) DEFAULT 'g'" },
      { name: 'design_weight_registered_by', sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS design_weight_registered_by INTEGER' },
      { name: 'design_weight_registered_at', sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS design_weight_registered_at TIMESTAMP WITH TIME ZONE' },
      { name: 'actual_weight_registered_by', sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS actual_weight_registered_by INTEGER' },
      { name: 'actual_weight_registered_at', sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS actual_weight_registered_at TIMESTAMP WITH TIME ZONE' }
    ];
    
    for (const col of columns) {
      try {
        await sequelize.query(col.sql);
      } catch (e) {
        // 컬럼 이미 존재하면 무시
      }
    }
    console.log('✅ Weight columns migration completed.');
  } catch (error) {
    console.error('⚠️ Weight columns migration warning:', error.message);
  }
};

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Run migrations automatically
    await runMigrations();
    
    // Run mold_images table migration
    await runMoldImagesMigration();
    
    // Run injection_conditions table migration
    await runInjectionConditionsMigration();
    
    // Run weight columns migration
    await runWeightColumnsMigration();
    
    // Sync models (development only)
    if (process.env.NODE_ENV === 'development') {
      // await sequelize.sync({ alter: true });
      console.log('📊 Database models synced.');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log('🚀 CAMS API Server started');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 Daily Checks API: http://localhost:${PORT}/api/daily-checks`);
      console.log(`🔍 Periodic Inspections API: http://localhost:${PORT}/api/periodic-inspections`);
      console.log(`\n⏰ Server started at: ${new Date().toLocaleString('ko-KR')}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await sequelize.close();
  console.log('✅ Database connection closed.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await sequelize.close();
  console.log('✅ Database connection closed.');
  process.exit(0);
});

// Start the server
startServer();
