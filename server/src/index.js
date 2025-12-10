require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// CORS 설정 - 프로덕션 환경에서 프론트엔드 URL 허용
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://bountiful-nurturing-production-cd5c.up.railway.app',
  'https://spirited-liberation-production-1a4d.up.railway.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if CORS_ORIGIN is set to *
    if (process.env.CORS_ORIGIN === '*') {
      return callback(null, true);
    }
    
    // Railway 도메인 패턴 매칭 (*.up.railway.app)
    if (origin.includes('.up.railway.app')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/molds', require('./routes/molds'));
app.use('/api/v1/mold-specifications', require('./routes/moldSpecifications'));
app.use('/api/v1/checklists', require('./routes/checklists'));
app.use('/api/v1/inspections', require('./routes/inspections'));
app.use('/api/v1/transfers', require('./routes/transfers'));
app.use('/api/v1/alerts', require('./routes/alerts'));
app.use('/api/v1/reports', require('./routes/reports'));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found'
    }
  });
});

// repair_requests 테이블 마이그레이션
const runRepairRequestsMigration = async () => {
  const columnsToAdd = [
    { name: 'problem', type: 'TEXT' },
    { name: 'cause_and_reason', type: 'TEXT' },
    { name: 'problem_source', type: 'TEXT' },
    { name: 'occurred_date', type: 'DATE' },
    { name: 'manager_name', type: 'VARCHAR(100)' },
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
    { name: 'repair_shop_type', type: 'VARCHAR(50)' },
    { name: 'repair_shop_selected_by', type: 'VARCHAR(100)' },
    { name: 'repair_shop_selected_date', type: 'DATE' },
    { name: 'repair_shop_approval_status', type: "VARCHAR(20) DEFAULT '대기'" },
    { name: 'repair_shop_approved_by', type: 'VARCHAR(100)' },
    { name: 'repair_shop_approved_date', type: 'DATE' },
    { name: 'repair_shop_rejection_reason', type: 'TEXT' },
    { name: 'liability_type', type: 'VARCHAR(50)' },
    { name: 'liability_ratio_maker', type: 'INTEGER' },
    { name: 'liability_ratio_plant', type: 'INTEGER' },
    { name: 'liability_reason', type: 'TEXT' },
    { name: 'liability_decided_by', type: 'VARCHAR(100)' },
    { name: 'liability_decided_date', type: 'DATE' }
  ];

  for (const col of columnsToAdd) {
    try {
      await db.sequelize.query(`ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`);
    } catch (err) {
      // 컬럼이 이미 존재하면 무시
    }
  }
  logger.info('repair_requests migration completed.');
};

// injection_conditions 테이블 마이그레이션
const runInjectionConditionsMigration = async () => {
  // 테이블 생성
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS injection_conditions (
        id SERIAL PRIMARY KEY,
        mold_spec_id INTEGER,
        mold_id INTEGER,
        mold_code VARCHAR(100),
        mold_name VARCHAR(200),
        part_name VARCHAR(200),
        material VARCHAR(100),
        speed_1 DECIMAL(6,1), speed_2 DECIMAL(6,1), speed_3 DECIMAL(6,1), speed_4 DECIMAL(6,1), speed_cooling DECIMAL(6,1),
        position_pv DECIMAL(6,1), position_1 DECIMAL(6,1), position_2 DECIMAL(6,1), position_3 DECIMAL(6,1),
        pressure_1 DECIMAL(6,1), pressure_2 DECIMAL(6,1), pressure_3 DECIMAL(6,1), pressure_4 DECIMAL(6,1),
        time_injection DECIMAL(6,2), time_holding DECIMAL(6,2), time_holding_3 DECIMAL(6,2), time_holding_4 DECIMAL(6,2), time_cooling DECIMAL(6,2),
        metering_speed_vp DECIMAL(6,1), metering_speed_1 DECIMAL(6,1), metering_speed_2 DECIMAL(6,1), metering_speed_3 DECIMAL(6,1),
        metering_position_1 DECIMAL(6,1), metering_position_2 DECIMAL(6,1),
        metering_pressure_2 DECIMAL(6,1), metering_pressure_3 DECIMAL(6,1), metering_pressure_4 DECIMAL(6,1),
        holding_pressure_1 DECIMAL(6,1), holding_pressure_2 DECIMAL(6,1), holding_pressure_3 DECIMAL(6,1), holding_pressure_4 DECIMAL(6,1),
        holding_pressure_1h DECIMAL(6,1), holding_pressure_2h DECIMAL(6,1), holding_pressure_3h DECIMAL(6,1),
        barrel_temp_1 DECIMAL(6,1), barrel_temp_2 DECIMAL(6,1), barrel_temp_3 DECIMAL(6,1), barrel_temp_4 DECIMAL(6,1), barrel_temp_5 DECIMAL(6,1),
        barrel_temp_6 DECIMAL(6,1), barrel_temp_7 DECIMAL(6,1), barrel_temp_8 DECIMAL(6,1), barrel_temp_9 DECIMAL(6,1),
        hot_runner_installed BOOLEAN DEFAULT false, hot_runner_type VARCHAR(50),
        hr_temp_1 DECIMAL(6,1), hr_temp_2 DECIMAL(6,1), hr_temp_3 DECIMAL(6,1), hr_temp_4 DECIMAL(6,1),
        hr_temp_5 DECIMAL(6,1), hr_temp_6 DECIMAL(6,1), hr_temp_7 DECIMAL(6,1), hr_temp_8 DECIMAL(6,1),
        valve_gate_count INTEGER DEFAULT 0, valve_gate_data JSONB DEFAULT '[]'::jsonb,
        chiller_temp_main DECIMAL(6,1), chiller_temp_moving DECIMAL(6,1), chiller_temp_fixed DECIMAL(6,1),
        cycle_time DECIMAL(6,2),
        status VARCHAR(20) DEFAULT 'draft',
        registered_by INTEGER, registered_at TIMESTAMP DEFAULT NOW(),
        approved_by INTEGER, approved_at TIMESTAMP, rejection_reason TEXT,
        version INTEGER DEFAULT 1, is_current BOOLEAN DEFAULT true,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    logger.info('injection_conditions table created/verified.');
  } catch (err) {
    logger.warn('injection_conditions table creation:', err.message);
  }

  // 인덱스 생성
  try {
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_injection_conditions_mold_spec ON injection_conditions(mold_spec_id);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_injection_conditions_status ON injection_conditions(status);`);
  } catch (err) {
    // 무시
  }
  logger.info('injection_conditions migration completed.');
};

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    logger.info('Database connection established successfully.');
    
    // 마이그레이션 실행
    await runRepairRequestsMigration();
    await runInjectionConditionsMigration();
    
    // Sync database (only in development)
    if (process.env.NODE_ENV === 'development') {
      await db.sequelize.sync({ alter: false });
      logger.info('Database synchronized.');
    }
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
