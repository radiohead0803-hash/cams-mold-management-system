require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Creative Auto Module System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      molds: '/api/molds',
      qr: '/api/qr-sessions',
      inspections: '/api/inspections'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found'
    }
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'An internal server error occurred'
    }
  });
});

// Start Server
const startServer = async () => {
  try {
    // Test database connection (non-blocking)
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed. Server will start without database.');
      console.warn('⚠️  Please check DATABASE_URL environment variable.');
    }

    // Start listening
    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('🚀 ═══════════════════════════════════════════════════════');
      console.log('   Creative Auto Module System - Backend Server');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Server:      http://0.0.0.0:${PORT}`);
      console.log(`   Health:      http://0.0.0.0:${PORT}/health`);
      console.log(`   API:         http://0.0.0.0:${PORT}/api`);
      console.log(`   Database:    ${dbConnected ? '✅ Connected' : '⚠️  Not Connected'}`);
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack:', error.stack);
  }
};

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

startServer();

module.exports = app;
