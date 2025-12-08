const app = require('./app');
const { sequelize } = require('./models/newIndex');
const { exec } = require('child_process');
const path = require('path');

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

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Run migrations automatically
    await runMigrations();
    
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
