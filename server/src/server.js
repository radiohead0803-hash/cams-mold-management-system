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
    const sqlPath = path.join(__dirname, 'migrations', '20251210_fix_mold_images_columns.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await sequelize.query(sql);
      console.log('✅ mold_images table migration completed.');
    } else {
      console.log('⚠️ mold_images migration file not found, skipping...');
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
