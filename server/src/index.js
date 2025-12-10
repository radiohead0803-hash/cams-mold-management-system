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
app.use('/api/v1/periodic-inspection', require('./routes/periodicInspection'));
app.use('/api/v1/production', require('./routes/production'));
app.use('/api/v1/pre-production-checklist', require('./routes/preProductionChecklist'));
app.use('/api/v1/scrapping', require('./routes/scrapping'));
app.use('/api/v1/maintenance', require('./routes/maintenance'));
app.use('/api/v1/statistics', require('./routes/statistics'));
app.use('/api/v1/mold-images', require('./routes/moldImages'));
app.use('/api/v1/daily-checks', require('./routes/dailyChecks'));
app.use('/api/v1/repair-requests', require('./routes/repairRequests'));
app.use('/api/v1/injection-conditions', require('./routes/injectionConditions'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));
app.use('/api/v1/companies', require('./routes/companies'));
app.use('/api/v1/master-data', require('./routes/masterData'));

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
    { name: 'liability_decided_date', type: 'DATE' },
    // 1차/2차 귀책 협의 워크플로우
    { name: 'liability_negotiation_status', type: "VARCHAR(50) DEFAULT 'pending'" },
    { name: 'first_proposal_type', type: 'VARCHAR(50)' },
    { name: 'first_proposal_ratio_maker', type: 'INTEGER DEFAULT 0' },
    { name: 'first_proposal_ratio_plant', type: 'INTEGER DEFAULT 0' },
    { name: 'first_proposal_reason', type: 'TEXT' },
    { name: 'first_proposal_by', type: 'INTEGER' },
    { name: 'first_proposal_by_type', type: 'VARCHAR(20)' },
    { name: 'first_proposal_date', type: 'TIMESTAMP' },
    { name: 'first_response', type: 'VARCHAR(20)' },
    { name: 'first_response_by', type: 'INTEGER' },
    { name: 'first_response_date', type: 'TIMESTAMP' },
    { name: 'counter_proposal_type', type: 'VARCHAR(50)' },
    { name: 'counter_ratio_maker', type: 'INTEGER DEFAULT 0' },
    { name: 'counter_ratio_plant', type: 'INTEGER DEFAULT 0' },
    { name: 'counter_reason', type: 'TEXT' },
    { name: 'second_decision_by', type: 'INTEGER' },
    { name: 'second_decision_date', type: 'TIMESTAMP' },
    { name: 'cost_allocation_maker', type: 'DECIMAL(12,0) DEFAULT 0' },
    { name: 'cost_allocation_plant', type: 'DECIMAL(12,0) DEFAULT 0' },
    { name: 'cost_allocation_hq', type: 'DECIMAL(12,0) DEFAULT 0' },
    { name: 'blame_party', type: 'VARCHAR(50)' },
    { name: 'blame_percentage', type: 'INTEGER DEFAULT 100' },
    { name: 'blame_reason', type: 'TEXT' },
    { name: 'blame_confirmed', type: 'BOOLEAN DEFAULT false' },
    { name: 'blame_confirmed_by', type: 'INTEGER' },
    { name: 'blame_confirmed_at', type: 'TIMESTAMP' }
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

// raw_materials 테이블 마이그레이션
const runRawMaterialsMigration = async () => {
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS raw_materials (
        id SERIAL PRIMARY KEY,
        material_name VARCHAR(100) NOT NULL,
        material_code VARCHAR(50),
        material_grade VARCHAR(100),
        supplier VARCHAR(200),
        category VARCHAR(50),
        color VARCHAR(50),
        shrinkage_rate DECIMAL(5,3),
        mold_shrinkage DECIMAL(5,3),
        melt_temp_min INTEGER,
        melt_temp_max INTEGER,
        mold_temp_min INTEGER,
        mold_temp_max INTEGER,
        drying_temp INTEGER,
        drying_time INTEGER,
        density DECIMAL(5,3),
        mfi DECIMAL(6,2),
        tensile_strength DECIMAL(6,2),
        flexural_modulus DECIMAL(8,2),
        impact_strength DECIMAL(6,2),
        hdt INTEGER,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    logger.info('raw_materials table created/verified.');
  } catch (err) {
    logger.warn('raw_materials table creation:', err.message);
  }

  // 인덱스 생성
  try {
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_raw_materials_category ON raw_materials(category);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_raw_materials_is_active ON raw_materials(is_active);`);
  } catch (err) {
    // 무시
  }
  
  // 기존 빈 데이터 삭제 후 MS SPEC 기준 원재료 기본 데이터 삽입
  try {
    // 빈 데이터(material_grade가 null인 데이터) 삭제
    await db.sequelize.query(`DELETE FROM raw_materials WHERE material_grade IS NULL OR material_grade = ''`);
    
    const [existing] = await db.sequelize.query(`SELECT COUNT(*) as count FROM raw_materials WHERE material_grade IS NOT NULL`);
    if (parseInt(existing[0].count) < 10) {
        // 기존 데이터 모두 삭제 후 새로 삽입
        await db.sequelize.query(`DELETE FROM raw_materials`);
        const rawMaterialsData = [
          // ABS 계열
          { material_name: 'ABS', material_code: 'ABS-001', material_grade: 'HI-121H', supplier: 'LG화학', category: '범용수지', shrinkage_rate: 0.5, density: 1.05, mold_shrinkage: 0.5 },
          { material_name: 'ABS', material_code: 'ABS-002', material_grade: 'AF-312', supplier: '금호석유화학', category: '범용수지', shrinkage_rate: 0.5, density: 1.04, mold_shrinkage: 0.5 },
          { material_name: 'ABS', material_code: 'ABS-003', material_grade: 'HP-181', supplier: 'LG화학', category: '범용수지', shrinkage_rate: 0.4, density: 1.05, mold_shrinkage: 0.45 },
          { material_name: 'ABS', material_code: 'ABS-004', material_grade: 'SD-0150', supplier: '삼성SDI', category: '범용수지', shrinkage_rate: 0.5, density: 1.05, mold_shrinkage: 0.5 },
          // ABS+PC 계열
          { material_name: 'ABS+PC', material_code: 'ABSPC-001', material_grade: 'LUPOY HI5002', supplier: 'LG화학', category: '엔지니어링수지', shrinkage_rate: 0.5, density: 1.15, mold_shrinkage: 0.5 },
          { material_name: 'ABS+PC', material_code: 'ABSPC-002', material_grade: 'STAREX WP-0160', supplier: '삼성SDI', category: '엔지니어링수지', shrinkage_rate: 0.5, density: 1.14, mold_shrinkage: 0.5 },
          { material_name: 'ABS+PC', material_code: 'ABSPC-003', material_grade: 'BAYBLEND T65', supplier: 'Covestro', category: '엔지니어링수지', shrinkage_rate: 0.5, density: 1.13, mold_shrinkage: 0.5 },
          // PP 계열
          { material_name: 'PP', material_code: 'PP-001', material_grade: 'SEETEC H7700', supplier: 'LG화학', category: '범용수지', shrinkage_rate: 1.5, density: 0.91, mold_shrinkage: 1.5 },
          { material_name: 'PP', material_code: 'PP-002', material_grade: 'HJ730', supplier: '한화토탈', category: '범용수지', shrinkage_rate: 1.5, density: 0.90, mold_shrinkage: 1.5 },
          { material_name: 'PP', material_code: 'PP-003', material_grade: 'J-170', supplier: '롯데케미칼', category: '범용수지', shrinkage_rate: 1.8, density: 0.91, mold_shrinkage: 1.8 },
          { material_name: 'PP-TD20', material_code: 'PPTD-001', material_grade: 'SEETEC H7520', supplier: 'LG화학', category: '범용수지', shrinkage_rate: 0.8, density: 1.04, mold_shrinkage: 0.8 },
          { material_name: 'PP-GF30', material_code: 'PPGF-001', material_grade: 'KOPLEN GP3030', supplier: '코오롱플라스틱', category: '엔지니어링수지', shrinkage_rate: 0.4, density: 1.14, mold_shrinkage: 0.4 },
          // PC 계열
          { material_name: 'PC', material_code: 'PC-001', material_grade: 'LUPOY PC1303AH', supplier: 'LG화학', category: '엔지니어링수지', shrinkage_rate: 0.6, density: 1.20, mold_shrinkage: 0.6 },
          { material_name: 'PC', material_code: 'PC-002', material_grade: 'MAKROLON 2805', supplier: 'Covestro', category: '엔지니어링수지', shrinkage_rate: 0.6, density: 1.20, mold_shrinkage: 0.6 },
          { material_name: 'PC', material_code: 'PC-003', material_grade: 'LEXAN 141R', supplier: 'SABIC', category: '엔지니어링수지', shrinkage_rate: 0.6, density: 1.20, mold_shrinkage: 0.6 },
          // PA (나일론) 계열
          { material_name: 'PA6', material_code: 'PA6-001', material_grade: 'KOPLA PA6 1011', supplier: '코오롱플라스틱', category: '엔지니어링수지', shrinkage_rate: 1.2, density: 1.13, mold_shrinkage: 1.2 },
          { material_name: 'PA6-GF30', material_code: 'PA6GF-001', material_grade: 'KOPLA PA6 GF30', supplier: '코오롱플라스틱', category: '엔지니어링수지', shrinkage_rate: 0.4, density: 1.36, mold_shrinkage: 0.4 },
          { material_name: 'PA66', material_code: 'PA66-001', material_grade: 'ZYTEL 101L', supplier: 'DuPont', category: '엔지니어링수지', shrinkage_rate: 1.5, density: 1.14, mold_shrinkage: 1.5 },
          { material_name: 'PA66-GF30', material_code: 'PA66GF-001', material_grade: 'ZYTEL 70G30', supplier: 'DuPont', category: '엔지니어링수지', shrinkage_rate: 0.3, density: 1.37, mold_shrinkage: 0.3 },
          // POM 계열
          { material_name: 'POM', material_code: 'POM-001', material_grade: 'KEPITAL F20-03', supplier: '코오롱플라스틱', category: '엔지니어링수지', shrinkage_rate: 2.0, density: 1.41, mold_shrinkage: 2.0 },
          { material_name: 'POM', material_code: 'POM-002', material_grade: 'DELRIN 500P', supplier: 'DuPont', category: '엔지니어링수지', shrinkage_rate: 2.1, density: 1.42, mold_shrinkage: 2.1 },
          // PBT 계열
          { material_name: 'PBT', material_code: 'PBT-001', material_grade: 'LUPOX HI1006F', supplier: 'LG화학', category: '엔지니어링수지', shrinkage_rate: 1.8, density: 1.31, mold_shrinkage: 1.8 },
          { material_name: 'PBT-GF30', material_code: 'PBTGF-001', material_grade: 'LUPOX GP2300', supplier: 'LG화학', category: '엔지니어링수지', shrinkage_rate: 0.4, density: 1.53, mold_shrinkage: 0.4 },
          // PMMA 계열
          { material_name: 'PMMA', material_code: 'PMMA-001', material_grade: 'LG PMMA IF850', supplier: 'LG MMA', category: '엔지니어링수지', shrinkage_rate: 0.5, density: 1.19, mold_shrinkage: 0.5 },
          // TPO/TPE 계열
          { material_name: 'TPO', material_code: 'TPO-001', material_grade: 'SEETEC TPO', supplier: 'LG화학', category: '엔지니어링수지', shrinkage_rate: 1.2, density: 0.90, mold_shrinkage: 1.2 },
          { material_name: 'TPE', material_code: 'TPE-001', material_grade: 'KEYFLEX BT-1035D', supplier: 'LG화학', category: '엔지니어링수지', shrinkage_rate: 1.5, density: 1.05, mold_shrinkage: 1.5 },
          // ASA 계열
          { material_name: 'ASA', material_code: 'ASA-001', material_grade: 'LURAN S 757R', supplier: 'BASF', category: '엔지니어링수지', shrinkage_rate: 0.5, density: 1.07, mold_shrinkage: 0.5 },
          { material_name: 'ASA+PC', material_code: 'ASAPC-001', material_grade: 'LURAN SC', supplier: 'BASF', category: '엔지니어링수지', shrinkage_rate: 0.5, density: 1.12, mold_shrinkage: 0.5 },
          // PPS 계열
          { material_name: 'PPS-GF40', material_code: 'PPSGF-001', material_grade: 'FORTRON 1140L4', supplier: 'Celanese', category: '슈퍼엔지니어링수지', shrinkage_rate: 0.2, density: 1.65, mold_shrinkage: 0.2 },
          // PEEK 계열
          { material_name: 'PEEK', material_code: 'PEEK-001', material_grade: 'VICTREX 450G', supplier: 'Victrex', category: '슈퍼엔지니어링수지', shrinkage_rate: 1.2, density: 1.30, mold_shrinkage: 1.2 }
        ];

        for (let i = 0; i < rawMaterialsData.length; i++) {
          const m = rawMaterialsData[i];
          await db.sequelize.query(`
            INSERT INTO raw_materials (material_name, material_code, material_grade, supplier, category, shrinkage_rate, density, mold_shrinkage, sort_order, is_active, created_at, updated_at)
            VALUES (:material_name, :material_code, :material_grade, :supplier, :category, :shrinkage_rate, :density, :mold_shrinkage, :sort_order, true, NOW(), NOW())
          `, {
            replacements: { ...m, sort_order: i + 1, mold_shrinkage: m.mold_shrinkage }
          });
        }
        logger.info('MS SPEC raw materials data inserted: ' + rawMaterialsData.length + ' items');
    }
  } catch (err) {
    logger.warn('Raw materials seed data:', err.message);
  }

  logger.info('raw_materials migration completed.');
};

// 기초정보 테이블 시드 데이터 마이그레이션
const runMasterDataMigration = async () => {
  // 차종 기본 데이터
  try {
    const [carModels] = await db.sequelize.query(`SELECT COUNT(*) as count FROM car_models`);
    if (parseInt(carModels[0].count) === 0) {
      const carModelData = [
        { model_name: 'GV70', model_code: 'JK1', description: '제네시스 GV70', sort_order: 1 },
        { model_name: 'GV80', model_code: 'JX1', description: '제네시스 GV80', sort_order: 2 },
        { model_name: 'G80', model_code: 'RG3', description: '제네시스 G80', sort_order: 3 },
        { model_name: 'G90', model_code: 'RS4', description: '제네시스 G90', sort_order: 4 },
        { model_name: '아반떼', model_code: 'CN7', description: '현대 아반떼', sort_order: 5 },
        { model_name: '쏘나타', model_code: 'DN8', description: '현대 쏘나타', sort_order: 6 },
        { model_name: '그랜저', model_code: 'GN7', description: '현대 그랜저', sort_order: 7 },
        { model_name: '투싼', model_code: 'NX4', description: '현대 투싼', sort_order: 8 },
        { model_name: '싼타페', model_code: 'MX5', description: '현대 싼타페', sort_order: 9 },
        { model_name: '팰리세이드', model_code: 'LX2', description: '현대 팰리세이드', sort_order: 10 },
        { model_name: 'K5', model_code: 'DL3', description: '기아 K5', sort_order: 11 },
        { model_name: 'K8', model_code: 'GL3', description: '기아 K8', sort_order: 12 },
        { model_name: 'K9', model_code: 'RJ', description: '기아 K9', sort_order: 13 },
        { model_name: '스포티지', model_code: 'NQ5', description: '기아 스포티지', sort_order: 14 },
        { model_name: '쏘렌토', model_code: 'MQ4', description: '기아 쏘렌토', sort_order: 15 },
        { model_name: '카니발', model_code: 'KA4', description: '기아 카니발', sort_order: 16 },
        { model_name: 'EV6', model_code: 'CV', description: '기아 EV6', sort_order: 17 },
        { model_name: 'EV9', model_code: 'MV', description: '기아 EV9', sort_order: 18 },
        { model_name: '아이오닉5', model_code: 'NE', description: '현대 아이오닉5', sort_order: 19 },
        { model_name: '아이오닉6', model_code: 'CE', description: '현대 아이오닉6', sort_order: 20 }
      ];
      for (const c of carModelData) {
        await db.sequelize.query(`INSERT INTO car_models (model_name, model_code, description, sort_order, is_active, created_at, updated_at) VALUES (:model_name, :model_code, :description, :sort_order, true, NOW(), NOW())`, { replacements: c });
      }
      logger.info('Car models seed data inserted: ' + carModelData.length + ' items');
    }
  } catch (err) {
    logger.warn('Car models seed:', err.message);
  }

  // 재질 기본 데이터
  try {
    const [materials] = await db.sequelize.query(`SELECT COUNT(*) as count FROM materials`);
    if (parseInt(materials[0].count) === 0) {
      const materialData = [
        { material_name: 'ABS', description: 'Acrylonitrile Butadiene Styrene', sort_order: 1 },
        { material_name: 'ABS+PC', description: 'ABS + Polycarbonate Blend', sort_order: 2 },
        { material_name: 'PP', description: 'Polypropylene', sort_order: 3 },
        { material_name: 'PP-TD20', description: 'Polypropylene + Talc 20%', sort_order: 4 },
        { material_name: 'PP-GF30', description: 'Polypropylene + Glass Fiber 30%', sort_order: 5 },
        { material_name: 'PC', description: 'Polycarbonate', sort_order: 6 },
        { material_name: 'PA6', description: 'Polyamide 6 (Nylon 6)', sort_order: 7 },
        { material_name: 'PA6-GF30', description: 'Polyamide 6 + Glass Fiber 30%', sort_order: 8 },
        { material_name: 'PA66', description: 'Polyamide 66 (Nylon 66)', sort_order: 9 },
        { material_name: 'PA66-GF30', description: 'Polyamide 66 + Glass Fiber 30%', sort_order: 10 },
        { material_name: 'POM', description: 'Polyoxymethylene (Acetal)', sort_order: 11 },
        { material_name: 'PBT', description: 'Polybutylene Terephthalate', sort_order: 12 },
        { material_name: 'PBT-GF30', description: 'PBT + Glass Fiber 30%', sort_order: 13 },
        { material_name: 'PMMA', description: 'Polymethyl Methacrylate (Acrylic)', sort_order: 14 },
        { material_name: 'TPO', description: 'Thermoplastic Polyolefin', sort_order: 15 },
        { material_name: 'TPE', description: 'Thermoplastic Elastomer', sort_order: 16 },
        { material_name: 'ASA', description: 'Acrylonitrile Styrene Acrylate', sort_order: 17 },
        { material_name: 'ASA+PC', description: 'ASA + Polycarbonate Blend', sort_order: 18 },
        { material_name: 'PPS-GF40', description: 'Polyphenylene Sulfide + GF 40%', sort_order: 19 },
        { material_name: 'PEEK', description: 'Polyether Ether Ketone', sort_order: 20 }
      ];
      for (const m of materialData) {
        await db.sequelize.query(`INSERT INTO materials (material_name, description, sort_order, is_active, created_at, updated_at) VALUES (:material_name, :description, :sort_order, true, NOW(), NOW())`, { replacements: m });
      }
      logger.info('Materials seed data inserted: ' + materialData.length + ' items');
    }
  } catch (err) {
    logger.warn('Materials seed:', err.message);
  }

  // 금형타입 기본 데이터
  try {
    const [moldTypes] = await db.sequelize.query(`SELECT COUNT(*) as count FROM mold_types`);
    if (parseInt(moldTypes[0].count) === 0) {
      const moldTypeData = [
        { type_name: '2단금형', description: '2 Plate Mold', sort_order: 1 },
        { type_name: '3단금형', description: '3 Plate Mold', sort_order: 2 },
        { type_name: '핫런너', description: 'Hot Runner Mold', sort_order: 3 },
        { type_name: '콜드런너', description: 'Cold Runner Mold', sort_order: 4 },
        { type_name: '슬라이드', description: 'Slide Core Mold', sort_order: 5 },
        { type_name: '언더컷', description: 'Undercut Mold', sort_order: 6 },
        { type_name: '스택', description: 'Stack Mold', sort_order: 7 },
        { type_name: '인서트', description: 'Insert Mold', sort_order: 8 },
        { type_name: '오버몰드', description: 'Overmold', sort_order: 9 },
        { type_name: '가스사출', description: 'Gas Injection Mold', sort_order: 10 }
      ];
      for (const t of moldTypeData) {
        await db.sequelize.query(`INSERT INTO mold_types (type_name, description, sort_order, is_active, created_at, updated_at) VALUES (:type_name, :description, :sort_order, true, NOW(), NOW())`, { replacements: t });
      }
      logger.info('Mold types seed data inserted: ' + moldTypeData.length + ' items');
    }
  } catch (err) {
    logger.warn('Mold types seed:', err.message);
  }

  // 톤수 기본 데이터
  try {
    const [tonnages] = await db.sequelize.query(`SELECT COUNT(*) as count FROM tonnages`);
    if (parseInt(tonnages[0].count) === 0) {
      const tonnageData = [
        { tonnage_value: 80, description: '80톤 사출기', sort_order: 1 },
        { tonnage_value: 120, description: '120톤 사출기', sort_order: 2 },
        { tonnage_value: 150, description: '150톤 사출기', sort_order: 3 },
        { tonnage_value: 180, description: '180톤 사출기', sort_order: 4 },
        { tonnage_value: 220, description: '220톤 사출기', sort_order: 5 },
        { tonnage_value: 280, description: '280톤 사출기', sort_order: 6 },
        { tonnage_value: 350, description: '350톤 사출기', sort_order: 7 },
        { tonnage_value: 450, description: '450톤 사출기', sort_order: 8 },
        { tonnage_value: 550, description: '550톤 사출기', sort_order: 9 },
        { tonnage_value: 650, description: '650톤 사출기', sort_order: 10 },
        { tonnage_value: 850, description: '850톤 사출기', sort_order: 11 },
        { tonnage_value: 1000, description: '1000톤 사출기', sort_order: 12 },
        { tonnage_value: 1300, description: '1300톤 사출기', sort_order: 13 },
        { tonnage_value: 1600, description: '1600톤 사출기', sort_order: 14 },
        { tonnage_value: 2000, description: '2000톤 사출기', sort_order: 15 },
        { tonnage_value: 2500, description: '2500톤 사출기', sort_order: 16 },
        { tonnage_value: 3000, description: '3000톤 사출기', sort_order: 17 },
        { tonnage_value: 3500, description: '3500톤 사출기', sort_order: 18 }
      ];
      for (const t of tonnageData) {
        await db.sequelize.query(`INSERT INTO tonnages (tonnage_value, description, sort_order, is_active, created_at, updated_at) VALUES (:tonnage_value, :description, :sort_order, true, NOW(), NOW())`, { replacements: t });
      }
      logger.info('Tonnages seed data inserted: ' + tonnageData.length + ' items');
    }
  } catch (err) {
    logger.warn('Tonnages seed:', err.message);
  }

  logger.info('Master data migration completed.');
};

// GPS 위치 및 알람 테이블 마이그레이션
const runGpsAlertsMigration = async () => {
  // gps_locations 테이블 생성
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS gps_locations (
        id SERIAL PRIMARY KEY,
        mold_id INTEGER REFERENCES molds(id),
        user_id INTEGER REFERENCES users(id),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        accuracy DECIMAL(6, 2),
        action_type VARCHAR(50),
        recorded_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_gps_locations_mold ON gps_locations(mold_id);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_gps_locations_user ON gps_locations(user_id);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_gps_locations_recorded ON gps_locations(recorded_at);`);
    logger.info('gps_locations table created/verified.');
  } catch (err) {
    logger.warn('gps_locations table:', err.message);
  }

  // alerts 테이블 생성
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        mold_id INTEGER REFERENCES molds(id),
        user_id INTEGER REFERENCES users(id),
        alert_type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'active',
        trigger_type VARCHAR(20),
        trigger_value INTEGER,
        read_at TIMESTAMP,
        resolved_at TIMESTAMP,
        resolved_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_alerts_mold ON alerts(mold_id);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_alerts_priority ON alerts(priority);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type);`);
    // trigger_type, trigger_value 컬럼 추가 (기존 테이블용)
    await db.sequelize.query(`ALTER TABLE alerts ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(20);`);
    await db.sequelize.query(`ALTER TABLE alerts ADD COLUMN IF NOT EXISTS trigger_value INTEGER;`);
    logger.info('alerts table created/verified.');
  } catch (err) {
    logger.warn('alerts table:', err.message);
  }

  // molds 테이블에 last_inspection_date 컬럼 추가
  try {
    await db.sequelize.query(`ALTER TABLE molds ADD COLUMN IF NOT EXISTS last_inspection_date TIMESTAMP;`);
    await db.sequelize.query(`ALTER TABLE molds ADD COLUMN IF NOT EXISTS next_inspection_shots INTEGER;`);
    await db.sequelize.query(`ALTER TABLE molds ADD COLUMN IF NOT EXISTS next_inspection_date DATE;`);
    logger.info('molds inspection columns added.');
  } catch (err) {
    logger.warn('molds inspection columns:', err.message);
  }

  // production_quantities 테이블 생성
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS production_quantities (
        id SERIAL PRIMARY KEY,
        mold_id INTEGER NOT NULL REFERENCES molds(id),
        daily_check_id INTEGER,
        production_date DATE NOT NULL,
        shift VARCHAR(20),
        quantity INTEGER NOT NULL DEFAULT 0,
        shots_increment INTEGER DEFAULT 0,
        cavity_count INTEGER DEFAULT 1,
        previous_shots INTEGER DEFAULT 0,
        current_shots INTEGER DEFAULT 0,
        recorded_by INTEGER REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_production_quantities_mold ON production_quantities(mold_id);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_production_quantities_date ON production_quantities(production_date);`);
    logger.info('production_quantities table created/verified.');
  } catch (err) {
    logger.warn('production_quantities table:', err.message);
  }

  // stage_change_history 테이블 생성 (단계 변경 이력)
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS stage_change_history (
        id SERIAL PRIMARY KEY,
        mold_id INTEGER NOT NULL REFERENCES molds(id),
        from_stage VARCHAR(50),
        to_stage VARCHAR(50) NOT NULL,
        changed_by INTEGER REFERENCES users(id),
        change_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_stage_change_mold ON stage_change_history(mold_id);`);
    logger.info('stage_change_history table created/verified.');
  } catch (err) {
    logger.warn('stage_change_history table:', err.message);
  }

  // plant_molds 테이블 생성 (생산처 금형 자동 연동)
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS plant_molds (
        id SERIAL PRIMARY KEY,
        mold_id INTEGER NOT NULL REFERENCES molds(id),
        specification_id INTEGER REFERENCES mold_specifications(id),
        plant_id INTEGER REFERENCES users(id),
        plant_code VARCHAR(50),
        plant_name VARCHAR(200),
        received_date DATE,
        current_shots INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        location VARCHAR(200),
        production_line VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_plant_molds_mold ON plant_molds(mold_id);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_plant_molds_plant ON plant_molds(plant_id);`);
    logger.info('plant_molds table created/verified.');
  } catch (err) {
    logger.warn('plant_molds table:', err.message);
  }

  logger.info('GPS and alerts migration completed.');
};

// 체크리스트 템플릿 및 정기점검 항목 마이그레이션
const runChecklistTemplateMigration = async () => {
  // checklist_template_versions 테이블 (버전 관리)
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS checklist_template_versions (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL,
        version_number INTEGER NOT NULL DEFAULT 1,
        version_name VARCHAR(100),
        status VARCHAR(20) DEFAULT 'draft',
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_by INTEGER REFERENCES users(id),
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,
        deployed_at TIMESTAMP,
        deployed_by INTEGER REFERENCES users(id),
        rollback_from INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_template_versions_template ON checklist_template_versions(template_id);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_template_versions_status ON checklist_template_versions(status);`);
    logger.info('checklist_template_versions table created/verified.');
  } catch (err) {
    logger.warn('checklist_template_versions table:', err.message);
  }

  // periodic_inspection_items 테이블 (정기점검 항목)
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS periodic_inspection_items (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        item_name VARCHAR(200) NOT NULL,
        item_code VARCHAR(50),
        description TEXT,
        inspection_method TEXT,
        acceptance_criteria TEXT,
        shot_thresholds JSONB DEFAULT '[]'::jsonb,
        is_required BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_periodic_items_category ON periodic_inspection_items(category);`);
    logger.info('periodic_inspection_items table created/verified.');
  } catch (err) {
    logger.warn('periodic_inspection_items table:', err.message);
  }

  // 정기점검 항목 시드 데이터 삽입
  try {
    const [existing] = await db.sequelize.query(`SELECT COUNT(*) as count FROM periodic_inspection_items`);
    if (parseInt(existing[0].count) === 0) {
      const periodicItems = [
        // 1. 파팅면/성형면 (20K부터)
        { category: '파팅면/성형면', item_name: '파팅면 단차 확인', item_code: 'PI-001', description: '파팅면 단차 ±0.02mm 이내', inspection_method: '게이지 측정', acceptance_criteria: '±0.02mm', shot_thresholds: [20000, 50000, 80000, 100000, 120000, 150000], sort_order: 1 },
        { category: '파팅면/성형면', item_name: '성형면 손상 여부', item_code: 'PI-002', description: '성형면 스크래치, 마모, 손상 확인', inspection_method: '육안검사', acceptance_criteria: '손상 없음', shot_thresholds: [20000, 50000, 80000, 100000, 120000, 150000], sort_order: 2 },
        { category: '파팅면/성형면', item_name: '표면 이상 여부', item_code: 'PI-003', description: '표면 오염, 변색, 코팅 상태', inspection_method: '육안검사', acceptance_criteria: '이상 없음', shot_thresholds: [20000, 50000, 80000, 100000, 120000, 150000], sort_order: 3 },
        
        // 2. 벤트/게이트 (20K부터)
        { category: '벤트/게이트', item_name: '벤트홀 막힘 확인', item_code: 'PI-004', description: '벤트홀 막힘, 오염 여부', inspection_method: '육안검사/에어건', acceptance_criteria: '막힘 없음', shot_thresholds: [20000, 50000, 80000, 100000, 120000, 150000], sort_order: 4 },
        { category: '벤트/게이트', item_name: '게이트 청결 상태', item_code: 'PI-005', description: '게이트 잔류물, 청결 상태', inspection_method: '육안검사', acceptance_criteria: '청결', shot_thresholds: [20000, 50000, 80000, 100000, 120000, 150000], sort_order: 5 },
        { category: '벤트/게이트', item_name: '게이트 마모 확인', item_code: 'PI-006', description: '게이트 마모 0.03mm 이상 시 재가공', inspection_method: '게이지 측정', acceptance_criteria: '<0.03mm', shot_thresholds: [20000, 50000, 80000, 100000, 120000, 150000], sort_order: 6 },
        
        // 3. 작동부 (20K부터)
        { category: '작동부', item_name: '슬라이드 작동 확인', item_code: 'PI-007', description: '슬라이드 이상음, 걸림, 노유 여부', inspection_method: '작동 테스트', acceptance_criteria: '원활한 작동', shot_thresholds: [20000, 50000, 80000, 100000, 120000, 150000], sort_order: 7 },
        { category: '작동부', item_name: '가이드핀 상태', item_code: 'PI-008', description: '가이드핀 마모, 유격 ±0.02mm', inspection_method: '게이지 측정', acceptance_criteria: '±0.02mm', shot_thresholds: [50000, 80000, 100000, 120000, 150000], sort_order: 8 },
        { category: '작동부', item_name: '리프트핀 상태', item_code: 'PI-009', description: '리프트핀 마모, 변형, 이상음', inspection_method: '작동 테스트', acceptance_criteria: '이상 없음', shot_thresholds: [50000, 80000, 100000, 120000, 150000], sort_order: 9 },
        
        // 4. 습합(접합) (20K부터)
        { category: '습합(접합)', item_name: '금형 간극 확인', item_code: 'PI-010', description: '금형 간극 ±0.02mm 이내', inspection_method: '틈새 게이지', acceptance_criteria: '±0.02mm', shot_thresholds: [20000, 50000, 80000, 100000, 120000, 150000], sort_order: 10 },
        { category: '습합(접합)', item_name: '접합 정렬 상태', item_code: 'PI-011', description: '접합면 정렬, 단차 확인', inspection_method: '육안검사/측정', acceptance_criteria: '정렬 양호', shot_thresholds: [20000, 50000, 80000, 100000, 120000, 150000], sort_order: 11 },
        { category: '습합(접합)', item_name: '습합 압력 균일성', item_code: 'PI-012', description: '습합 압력 균일 분포 확인', inspection_method: '압력 테스트', acceptance_criteria: '균일', shot_thresholds: [50000, 80000, 100000, 120000, 150000], sort_order: 12 },
        
        // 5. 취출계통 (20K부터)
        { category: '취출계통', item_name: '밀핀 작동 확인', item_code: 'PI-013', description: '밀핀 작동, 박힘, 변형 여부', inspection_method: '작동 테스트', acceptance_criteria: '정상 작동', shot_thresholds: [20000, 50000, 80000, 100000, 120000, 150000], sort_order: 13 },
        { category: '취출계통', item_name: '스프링 상태', item_code: 'PI-014', description: '스프링 탄성, 변형 확인', inspection_method: '육안검사/테스트', acceptance_criteria: '정상', shot_thresholds: [20000, 50000, 80000, 100000, 120000, 150000], sort_order: 14 },
        { category: '취출계통', item_name: '취출핀 마모', item_code: 'PI-015', description: '취출핀 마모, 손상 여부', inspection_method: '게이지 측정', acceptance_criteria: '마모 없음', shot_thresholds: [50000, 80000, 100000, 120000, 150000], sort_order: 15 },
        
        // 6. 냉각/유압 연결부 (20K부터)
        { category: '냉각/유압', item_name: '누유/누수 확인', item_code: 'PI-016', description: '냉각수, 유압 누유/누수 여부', inspection_method: '육안검사', acceptance_criteria: '누출 없음', shot_thresholds: [20000, 50000, 80000, 100000, 120000, 150000], sort_order: 16 },
        { category: '냉각/유압', item_name: '조인트/커넥터 상태', item_code: 'PI-017', description: '조인트, 커넥터, 호스 상태', inspection_method: '육안검사', acceptance_criteria: '정상', shot_thresholds: [20000, 50000, 80000, 100000, 120000, 150000], sort_order: 17 },
        { category: '냉각/유압', item_name: '냉각수 유량/온도', item_code: 'PI-018', description: '유량 저하, 온도 편차 ±10%', inspection_method: '유량계/온도계', acceptance_criteria: '±10% 이내', shot_thresholds: [50000, 80000, 100000, 120000, 150000], sort_order: 18 },
        { category: '냉각/유압', item_name: '냉각라인 스케일', item_code: 'PI-019', description: '스케일 제거, 이물 세척', inspection_method: '분해 점검', acceptance_criteria: '청결', shot_thresholds: [100000, 120000, 150000], sort_order: 19 },
        
        // 7. 히터/센서/배선 (50K부터)
        { category: '히터/센서/배선', item_name: '히터 저항 확인', item_code: 'PI-020', description: '히터 저항 ±10% 이내', inspection_method: '저항 측정', acceptance_criteria: '±10%', shot_thresholds: [50000, 80000, 100000, 120000, 150000], sort_order: 20 },
        { category: '히터/센서/배선', item_name: '온도센서 상태', item_code: 'PI-021', description: '온도센서 손상, 접촉불량', inspection_method: '테스트', acceptance_criteria: '정상', shot_thresholds: [50000, 80000, 100000, 120000, 150000], sort_order: 21 },
        { category: '히터/센서/배선', item_name: '배선 절연 상태', item_code: 'PI-022', description: '배선 손상, 절연 상태', inspection_method: '절연 테스트', acceptance_criteria: '정상', shot_thresholds: [100000, 120000, 150000], sort_order: 22 },
        
        // 8. 표면처리/코팅 (50K부터)
        { category: '표면처리/코팅', item_name: '코팅 박리 확인', item_code: 'PI-023', description: '코팅 박리, 변색 여부', inspection_method: '육안검사', acceptance_criteria: '박리 없음', shot_thresholds: [50000, 80000, 100000, 120000, 150000], sort_order: 23 },
        { category: '표면처리/코팅', item_name: '크롬층 상태', item_code: 'PI-024', description: '크롬층 불균일, 두께 이상', inspection_method: '두께 측정', acceptance_criteria: '균일', shot_thresholds: [50000, 80000, 100000, 120000, 150000], sort_order: 24 },
        
        // 9. 치수 확인 (100K부터)
        { category: '치수확인', item_name: '표준치수 확인', item_code: 'PI-025', description: '도면 대비 편차 ±0.05mm', inspection_method: '3차원 측정', acceptance_criteria: '±0.05mm', shot_thresholds: [100000, 120000, 150000], sort_order: 25 },
        { category: '치수확인', item_name: '인서트 치수 확인', item_code: 'PI-026', description: '인서트 정렬, 치수 확인', inspection_method: '게이지 측정', acceptance_criteria: '정상', shot_thresholds: [100000, 120000, 150000], sort_order: 26 },
        
        // 10. 세척 (80K부터 집중)
        { category: '세척', item_name: '금형 외곽 세척', item_code: 'PI-027', description: '금형 외곽 분진, 오염 제거', inspection_method: '세척 작업', acceptance_criteria: '청결', shot_thresholds: [80000, 100000, 120000, 150000], sort_order: 27 },
        { category: '세척', item_name: '코어/캐비티 세척', item_code: 'PI-028', description: '코어, 캐비티 내 이물 제거', inspection_method: '세척 작업', acceptance_criteria: '청결', shot_thresholds: [80000, 100000, 120000, 150000], sort_order: 28 },
        { category: '세척', item_name: '세척제 기록', item_code: 'PI-029', description: '사용 세척제, 희석 비율 기록', inspection_method: '기록', acceptance_criteria: '기록 완료', shot_thresholds: [80000, 100000, 120000, 150000], sort_order: 29 },
        
        // 11. 윤활 (모든 주기)
        { category: '윤활', item_name: '윤활 상태 확인', item_code: 'PI-030', description: '슬라이드, 가이드 윤활 상태', inspection_method: '육안검사', acceptance_criteria: '적정', shot_thresholds: [20000, 50000, 80000, 100000, 120000, 150000], sort_order: 30 },
        { category: '윤활', item_name: '윤활유 보충', item_code: 'PI-031', description: '필요시 윤활유 보충', inspection_method: '보충 작업', acceptance_criteria: '보충 완료', shot_thresholds: [50000, 80000, 100000, 120000, 150000], sort_order: 31 }
      ];
      
      for (let i = 0; i < periodicItems.length; i++) {
        const item = periodicItems[i];
        await db.sequelize.query(`
          INSERT INTO periodic_inspection_items (category, item_name, item_code, description, inspection_method, acceptance_criteria, shot_thresholds, sort_order, is_active, created_at, updated_at)
          VALUES (:category, :item_name, :item_code, :description, :inspection_method, :acceptance_criteria, :shot_thresholds::jsonb, :sort_order, true, NOW(), NOW())
        `, {
          replacements: {
            ...item,
            shot_thresholds: JSON.stringify(item.shot_thresholds)
          }
        });
      }
      logger.info('Periodic inspection items seed data inserted: ' + periodicItems.length + ' items');
    }
  } catch (err) {
    logger.warn('Periodic inspection items seed:', err.message);
  }

  logger.info('Checklist template migration completed.');
};

// 이관 4M 체크리스트 및 유지보전 마이그레이션
const runTransfer4MMigration = async () => {
  // mold_transfers 테이블 생성
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS mold_transfers (
        id SERIAL PRIMARY KEY,
        transfer_number VARCHAR(50) UNIQUE,
        mold_id INTEGER NOT NULL REFERENCES molds(id),
        transfer_type VARCHAR(50) NOT NULL,
        from_location VARCHAR(200),
        from_company_id INTEGER REFERENCES users(id),
        to_location VARCHAR(200),
        to_company_id INTEGER REFERENCES users(id),
        transfer_reason TEXT,
        status VARCHAR(30) DEFAULT 'requested',
        requested_by INTEGER REFERENCES users(id),
        requested_at TIMESTAMP DEFAULT NOW(),
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,
        shipped_at TIMESTAMP,
        received_at TIMESTAMP,
        received_by INTEGER REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_transfers_mold ON mold_transfers(mold_id);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_transfers_status ON mold_transfers(status);`);
    logger.info('mold_transfers table created/verified.');
  } catch (err) {
    logger.warn('mold_transfers table:', err.message);
  }

  // transfer_4m_checklist 테이블 생성
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS transfer_4m_checklist (
        id SERIAL PRIMARY KEY,
        transfer_id INTEGER NOT NULL REFERENCES mold_transfers(id),
        checklist_type VARCHAR(20) NOT NULL,
        
        -- Man (인력) 체크항목
        man_operator_assigned BOOLEAN DEFAULT false,
        man_operator_name VARCHAR(100),
        man_training_completed BOOLEAN DEFAULT false,
        man_training_date DATE,
        man_skill_level VARCHAR(20),
        man_notes TEXT,
        
        -- Machine (설비) 체크항목
        machine_tonnage_check BOOLEAN DEFAULT false,
        machine_tonnage_value INTEGER,
        machine_spec_compatible BOOLEAN DEFAULT false,
        machine_condition_check BOOLEAN DEFAULT false,
        machine_injection_unit_check BOOLEAN DEFAULT false,
        machine_notes TEXT,
        
        -- Material (원료) 체크항목
        material_type_confirmed BOOLEAN DEFAULT false,
        material_name VARCHAR(100),
        material_grade VARCHAR(100),
        material_drying_condition BOOLEAN DEFAULT false,
        material_drying_temp INTEGER,
        material_drying_time INTEGER,
        material_color_confirmed BOOLEAN DEFAULT false,
        material_notes TEXT,
        
        -- Method (작업방법) 체크항목
        method_sop_available BOOLEAN DEFAULT false,
        method_sop_version VARCHAR(50),
        method_injection_condition BOOLEAN DEFAULT false,
        method_cycle_time_set BOOLEAN DEFAULT false,
        method_cycle_time_value DECIMAL(6,2),
        method_quality_standard BOOLEAN DEFAULT false,
        method_notes TEXT,
        
        -- 전체 상태
        overall_status VARCHAR(20) DEFAULT 'pending',
        checked_by INTEGER REFERENCES users(id),
        checked_at TIMESTAMP,
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_4m_transfer ON transfer_4m_checklist(transfer_id);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_4m_type ON transfer_4m_checklist(checklist_type);`);
    logger.info('transfer_4m_checklist table created/verified.');
  } catch (err) {
    logger.warn('transfer_4m_checklist table:', err.message);
  }

  // transfer_shipment_checklist 테이블 (반출 체크리스트)
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS transfer_shipment_checklist (
        id SERIAL PRIMARY KEY,
        transfer_id INTEGER NOT NULL REFERENCES mold_transfers(id),
        
        -- 금형 상태 확인
        mold_condition_check BOOLEAN DEFAULT false,
        mold_condition_notes TEXT,
        mold_cleaning_done BOOLEAN DEFAULT false,
        mold_rust_prevention BOOLEAN DEFAULT false,
        
        -- 부속품 확인
        accessories_check BOOLEAN DEFAULT false,
        accessories_list JSONB DEFAULT '[]'::jsonb,
        spare_parts_included BOOLEAN DEFAULT false,
        spare_parts_list JSONB DEFAULT '[]'::jsonb,
        
        -- 문서 확인
        documents_included BOOLEAN DEFAULT false,
        document_list JSONB DEFAULT '[]'::jsonb,
        drawing_included BOOLEAN DEFAULT false,
        sop_included BOOLEAN DEFAULT false,
        
        -- 포장 확인
        packaging_done BOOLEAN DEFAULT false,
        packaging_type VARCHAR(50),
        packaging_photos JSONB DEFAULT '[]'::jsonb,
        
        -- GPS 위치
        shipment_gps_lat DECIMAL(10, 8),
        shipment_gps_lng DECIMAL(11, 8),
        
        -- 서명
        shipper_name VARCHAR(100),
        shipper_signature TEXT,
        shipped_at TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_shipment_transfer ON transfer_shipment_checklist(transfer_id);`);
    logger.info('transfer_shipment_checklist table created/verified.');
  } catch (err) {
    logger.warn('transfer_shipment_checklist table:', err.message);
  }

  // transfer_receiving_checklist 테이블 (입고 체크리스트)
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS transfer_receiving_checklist (
        id SERIAL PRIMARY KEY,
        transfer_id INTEGER NOT NULL REFERENCES mold_transfers(id),
        
        -- 금형 상태 확인
        mold_condition_check BOOLEAN DEFAULT false,
        mold_condition_notes TEXT,
        damage_found BOOLEAN DEFAULT false,
        damage_description TEXT,
        damage_photos JSONB DEFAULT '[]'::jsonb,
        
        -- 부속품 확인
        accessories_received BOOLEAN DEFAULT false,
        accessories_missing JSONB DEFAULT '[]'::jsonb,
        spare_parts_received BOOLEAN DEFAULT false,
        spare_parts_missing JSONB DEFAULT '[]'::jsonb,
        
        -- 문서 확인
        documents_received BOOLEAN DEFAULT false,
        documents_missing JSONB DEFAULT '[]'::jsonb,
        
        -- 포장 상태
        packaging_condition VARCHAR(50),
        packaging_notes TEXT,
        
        -- GPS 위치
        receiving_gps_lat DECIMAL(10, 8),
        receiving_gps_lng DECIMAL(11, 8),
        
        -- 서명
        receiver_name VARCHAR(100),
        receiver_signature TEXT,
        received_at TIMESTAMP,
        
        -- 이상 발견 시
        issue_reported BOOLEAN DEFAULT false,
        issue_description TEXT,
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_receiving_transfer ON transfer_receiving_checklist(transfer_id);`);
    logger.info('transfer_receiving_checklist table created/verified.');
  } catch (err) {
    logger.warn('transfer_receiving_checklist table:', err.message);
  }

  // maintenance_records 테이블 (유지보전 기록)
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS maintenance_records (
        id SERIAL PRIMARY KEY,
        mold_id INTEGER NOT NULL REFERENCES molds(id),
        maintenance_type VARCHAR(50) NOT NULL,
        maintenance_category VARCHAR(50),
        description TEXT,
        work_details TEXT,
        parts_replaced JSONB DEFAULT '[]'::jsonb,
        cost DECIMAL(12, 0),
        performed_by INTEGER REFERENCES users(id),
        performed_at TIMESTAMP DEFAULT NOW(),
        next_maintenance_date DATE,
        next_maintenance_shots INTEGER,
        photos JSONB DEFAULT '[]'::jsonb,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_mold ON maintenance_records(mold_id);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_type ON maintenance_records(maintenance_type);`);
    logger.info('maintenance_records table created/verified.');
  } catch (err) {
    logger.warn('maintenance_records table:', err.message);
  }

  // scrapping_requests 테이블 (금형 폐기 요청)
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS scrapping_requests (
        id SERIAL PRIMARY KEY,
        request_number VARCHAR(50) UNIQUE,
        mold_id INTEGER NOT NULL REFERENCES molds(id),
        reason VARCHAR(100) NOT NULL,
        reason_detail TEXT,
        current_shots INTEGER,
        target_shots INTEGER,
        condition_assessment TEXT,
        repair_history_summary TEXT,
        estimated_scrap_value DECIMAL(12, 0),
        status VARCHAR(30) DEFAULT 'requested',
        requested_by INTEGER REFERENCES users(id),
        requested_at TIMESTAMP DEFAULT NOW(),
        
        -- 1차 승인 (금형개발 담당)
        first_approved_by INTEGER REFERENCES users(id),
        first_approved_at TIMESTAMP,
        first_approval_notes TEXT,
        
        -- 2차 승인 (시스템 관리자)
        second_approved_by INTEGER REFERENCES users(id),
        second_approved_at TIMESTAMP,
        second_approval_notes TEXT,
        
        -- 폐기 처리
        scrapped_at TIMESTAMP,
        scrapped_by INTEGER REFERENCES users(id),
        disposal_method VARCHAR(50),
        disposal_company VARCHAR(200),
        disposal_cost DECIMAL(12, 0),
        disposal_certificate TEXT,
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_scrapping_mold ON scrapping_requests(mold_id);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_scrapping_status ON scrapping_requests(status);`);
    logger.info('scrapping_requests table created/verified.');
  } catch (err) {
    logger.warn('scrapping_requests table:', err.message);
  }

  logger.info('Transfer 4M and maintenance migration completed.');
};

// 제작전 체크리스트 마이그레이션 (81개 항목, 9개 카테고리)
const runPreProductionChecklistMigration = async () => {
  // pre_production_checklists 테이블 생성
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS pre_production_checklists (
        id SERIAL PRIMARY KEY,
        checklist_number VARCHAR(50) UNIQUE,
        mold_specification_id INTEGER REFERENCES mold_specifications(id),
        maker_id INTEGER REFERENCES users(id),
        
        -- 기본 정보 (자동 연계)
        car_model VARCHAR(100),
        part_number VARCHAR(100),
        part_name VARCHAR(200),
        production_plant VARCHAR(200),
        maker_name VARCHAR(200),
        injection_machine_tonnage VARCHAR(50),
        clamping_force VARCHAR(50),
        eo_cut_date DATE,
        trial_order_date DATE,
        
        -- 부품 이미지
        part_images JSONB DEFAULT '[]'::jsonb,
        
        -- 상태
        status VARCHAR(30) DEFAULT 'draft',
        progress_rate INTEGER DEFAULT 0,
        total_items INTEGER DEFAULT 81,
        checked_items INTEGER DEFAULT 0,
        rejected_items INTEGER DEFAULT 0,
        
        -- 작성/승인 정보
        created_by INTEGER REFERENCES users(id),
        submitted_at TIMESTAMP,
        reviewed_by INTEGER REFERENCES users(id),
        reviewed_at TIMESTAMP,
        review_notes TEXT,
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,
        rejected_by INTEGER REFERENCES users(id),
        rejected_at TIMESTAMP,
        rejection_reason TEXT,
        
        -- 도면검토회 연동
        drawing_review_date DATE,
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_preproduction_mold_spec ON pre_production_checklists(mold_specification_id);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_preproduction_status ON pre_production_checklists(status);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_preproduction_maker ON pre_production_checklists(maker_id);`);
    logger.info('pre_production_checklists table created/verified.');
  } catch (err) {
    logger.warn('pre_production_checklists table:', err.message);
  }

  // pre_production_checklist_items 테이블 생성 (마스터 항목)
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS pre_production_checklist_items (
        id SERIAL PRIMARY KEY,
        category_code VARCHAR(20) NOT NULL,
        category_name VARCHAR(100) NOT NULL,
        item_no INTEGER NOT NULL,
        item_name VARCHAR(200) NOT NULL,
        item_description TEXT,
        input_type VARCHAR(30) DEFAULT 'checkbox',
        input_options JSONB,
        default_spec VARCHAR(200),
        is_required BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_preproduction_items_category ON pre_production_checklist_items(category_code);`);
    logger.info('pre_production_checklist_items table created/verified.');
  } catch (err) {
    logger.warn('pre_production_checklist_items table:', err.message);
  }

  // pre_production_checklist_results 테이블 생성 (점검 결과)
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS pre_production_checklist_results (
        id SERIAL PRIMARY KEY,
        checklist_id INTEGER NOT NULL REFERENCES pre_production_checklists(id),
        item_id INTEGER NOT NULL REFERENCES pre_production_checklist_items(id),
        is_applicable BOOLEAN DEFAULT true,
        spec_value VARCHAR(500),
        is_checked BOOLEAN DEFAULT false,
        result_value VARCHAR(500),
        notes TEXT,
        attachments JSONB DEFAULT '[]'::jsonb,
        checked_by INTEGER REFERENCES users(id),
        checked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_preproduction_results_checklist ON pre_production_checklist_results(checklist_id);`);
    await db.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_preproduction_results_item ON pre_production_checklist_results(item_id);`);
    logger.info('pre_production_checklist_results table created/verified.');
  } catch (err) {
    logger.warn('pre_production_checklist_results table:', err.message);
  }

  // 제작전 체크리스트 81개 항목 시드 데이터
  try {
    const [existing] = await db.sequelize.query(`SELECT COUNT(*) as count FROM pre_production_checklist_items`);
    if (parseInt(existing[0].count) === 0) {
      const items = [
        // I. 원재료 (Material) - 3개
        { category_code: 'I', category_name: '원재료 (Material)', item_no: 1, item_name: '수축률', input_type: 'text', default_spec: '6/1000', sort_order: 1 },
        { category_code: 'I', category_name: '원재료 (Material)', item_no: 2, item_name: '소재 (MS SPEC)', input_type: 'text', default_spec: '', sort_order: 2 },
        { category_code: 'I', category_name: '원재료 (Material)', item_no: 3, item_name: '공급 업체', input_type: 'text', default_spec: '', sort_order: 3 },
        
        // II. 금형 (Mold) - 34개
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 1, item_name: '금형 번호 윤반·본형 아이템 사양 입지', input_type: 'select', input_options: JSON.stringify(['확인', '미확인']), sort_order: 4 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 2, item_name: '양산시 조건 제약 사양 반영', input_type: 'select', input_options: JSON.stringify(['무', '부']), sort_order: 5 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 3, item_name: '수축률', input_type: 'text', default_spec: '6/1000', sort_order: 6 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 4, item_name: '금형 중량', input_type: 'text', default_spec: '', sort_order: 7 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 5, item_name: '벤팅 히트파팅 적용', input_type: 'select', input_options: JSON.stringify(['적용', '미적용', '사양 상이']), sort_order: 8 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 6, item_name: '캐비티 재질', input_type: 'select', input_options: JSON.stringify(['NAK80', 'S45C', 'SKD61', 'P20', 'KP-4', '기타']), sort_order: 9 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 7, item_name: '코어 재질', input_type: 'select', input_options: JSON.stringify(['NAK80', 'S45C', 'SKD61', 'P20', 'KP-4', '기타']), sort_order: 10 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 8, item_name: '캐비티 수', input_type: 'select', input_options: JSON.stringify(['1', '2', '3', '4', '5', '6', '8']), sort_order: 11 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 9, item_name: '게이트 형식', input_type: 'select', input_options: JSON.stringify(['오픈', '밸브']), sort_order: 12 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 10, item_name: '게이트 수', input_type: 'number', sort_order: 13 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 11, item_name: '런너 형식', input_type: 'select', input_options: JSON.stringify(['핫런너', '콜드런너', '세미핫런너']), sort_order: 14 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 12, item_name: '냉각라인 수', input_type: 'number', sort_order: 15 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 13, item_name: '냉각라인 배치', input_type: 'text', sort_order: 16 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 14, item_name: '온도센서 위치', input_type: 'text', sort_order: 17 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 15, item_name: '온도센서 수량', input_type: 'number', sort_order: 18 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 16, item_name: '이젝터 형식', input_type: 'select', input_options: JSON.stringify(['핀', '슬리브', '블레이드', '에어']), sort_order: 19 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 17, item_name: '이젝터 핀 수량', input_type: 'number', sort_order: 20 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 18, item_name: '슬라이드 수량', input_type: 'number', sort_order: 21 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 19, item_name: '금형 스페어 리스트 검수', input_type: 'select', input_options: JSON.stringify(['반영', '미반영']), sort_order: 22 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 20, item_name: '금형 사이즈 (가로)', input_type: 'number', sort_order: 23 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 21, item_name: '금형 사이즈 (세로)', input_type: 'number', sort_order: 24 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 22, item_name: '금형 사이즈 (높이)', input_type: 'number', sort_order: 25 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 23, item_name: '로케이팅링 규격', input_type: 'text', sort_order: 26 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 24, item_name: '스프루 부시 규격', input_type: 'text', sort_order: 27 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 25, item_name: '가이드핀 규격', input_type: 'text', sort_order: 28 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 26, item_name: '가이드부시 규격', input_type: 'text', sort_order: 29 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 27, item_name: '아이볼트 규격', input_type: 'text', sort_order: 30 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 28, item_name: '클램프 홈 규격', input_type: 'text', sort_order: 31 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 29, item_name: '금형 표면처리', input_type: 'select', input_options: JSON.stringify(['경면', '텍스처', '방전', '기타']), sort_order: 32 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 30, item_name: '기타 특이사항 1', input_type: 'textarea', sort_order: 33 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 31, item_name: '기타 특이사항 2', input_type: 'textarea', sort_order: 34 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 32, item_name: '기타 특이사항 3', input_type: 'textarea', sort_order: 35 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 33, item_name: '기타 특이사항 4', input_type: 'textarea', sort_order: 36 },
        { category_code: 'II', category_name: '금형 (Mold)', item_no: 34, item_name: '기타 특이사항 5', input_type: 'textarea', sort_order: 37 },
        
        // III. 가스 배기 (Gas Vent) - 6개
        { category_code: 'III', category_name: '가스 배기 (Gas Vent)', item_no: 1, item_name: '가스 배기 금형 전반 반영', input_type: 'select', input_options: JSON.stringify(['반영', '미반영']), sort_order: 38 },
        { category_code: 'III', category_name: '가스 배기 (Gas Vent)', item_no: 2, item_name: '가스 배기 2/100 또는 3/100 반영', input_type: 'select', input_options: JSON.stringify(['반영', '미반영']), sort_order: 39 },
        { category_code: 'III', category_name: '가스 배기 (Gas Vent)', item_no: 3, item_name: '파팅간 거리', input_type: 'text', sort_order: 40 },
        { category_code: 'III', category_name: '가스 배기 (Gas Vent)', item_no: 4, item_name: '벤트 깊이', input_type: 'text', sort_order: 41 },
        { category_code: 'III', category_name: '가스 배기 (Gas Vent)', item_no: 5, item_name: '벤트 위치', input_type: 'text', sort_order: 42 },
        { category_code: 'III', category_name: '가스 배기 (Gas Vent)', item_no: 6, item_name: '벤트 수량', input_type: 'number', sort_order: 43 },
        
        // IV. 성형 해석 (Molding Analysis) - 6개
        { category_code: 'IV', category_name: '성형 해석 (Molding Analysis)', item_no: 1, item_name: '성형 해석 실행', input_type: 'select', input_options: JSON.stringify(['완료', '미완료', '해당없음']), sort_order: 44 },
        { category_code: 'IV', category_name: '성형 해석 (Molding Analysis)', item_no: 2, item_name: '성형성 확인', input_type: 'select', input_options: JSON.stringify(['양호', '주의', '불량']), sort_order: 45 },
        { category_code: 'IV', category_name: '성형 해석 (Molding Analysis)', item_no: 3, item_name: '변형발생 예측', input_type: 'select', input_options: JSON.stringify(['없음', '경미', '심각']), sort_order: 46 },
        { category_code: 'IV', category_name: '성형 해석 (Molding Analysis)', item_no: 4, item_name: '웰드라인 위치', input_type: 'text', sort_order: 47 },
        { category_code: 'IV', category_name: '성형 해석 (Molding Analysis)', item_no: 5, item_name: '가스 발생 부위', input_type: 'text', sort_order: 48 },
        { category_code: 'IV', category_name: '성형 해석 (Molding Analysis)', item_no: 6, item_name: '충전 시간', input_type: 'text', sort_order: 49 },
        
        // V. 싱크마크 (Sink Mark) - 3개
        { category_code: 'V', category_name: '싱크마크 (Sink Mark)', item_no: 1, item_name: '리브 0.6t 반영', input_type: 'select', input_options: JSON.stringify(['반영', '미반영']), sort_order: 50 },
        { category_code: 'V', category_name: '싱크마크 (Sink Mark)', item_no: 2, item_name: '싱크 발생 구조', input_type: 'text', sort_order: 51 },
        { category_code: 'V', category_name: '싱크마크 (Sink Mark)', item_no: 3, item_name: '예각 부위 구조', input_type: 'text', sort_order: 52 },
        
        // VI. 취출 (Ejection) - 7개
        { category_code: 'VI', category_name: '취출 (Ejection)', item_no: 1, item_name: '취출 구조', input_type: 'select', input_options: JSON.stringify(['핀취출', '슬리브취출', '에어취출', '복합']), sort_order: 53 },
        { category_code: 'VI', category_name: '취출 (Ejection)', item_no: 2, item_name: '언더컷 처리', input_type: 'select', input_options: JSON.stringify(['슬라이드', '경사핀', '유압실린더', '없음']), sort_order: 54 },
        { category_code: 'VI', category_name: '취출 (Ejection)', item_no: 3, item_name: '핵기 구배', input_type: 'text', sort_order: 55 },
        { category_code: 'VI', category_name: '취출 (Ejection)', item_no: 4, item_name: '보스 구배', input_type: 'text', sort_order: 56 },
        { category_code: 'VI', category_name: '취출 (Ejection)', item_no: 5, item_name: '취출 스트로크', input_type: 'number', sort_order: 57 },
        { category_code: 'VI', category_name: '취출 (Ejection)', item_no: 6, item_name: '취출 방향', input_type: 'select', input_options: JSON.stringify(['상', '하', '측면']), sort_order: 58 },
        { category_code: 'VI', category_name: '취출 (Ejection)', item_no: 7, item_name: '취출 핀 배치', input_type: 'text', sort_order: 59 },
        
        // VII. MIC 제품 - 4개
        { category_code: 'VII', category_name: 'MIC 제품', item_no: 1, item_name: 'MIC 사양 게이트', input_type: 'select', input_options: JSON.stringify(['적용', '미적용', '해당없음']), sort_order: 60 },
        { category_code: 'VII', category_name: 'MIC 제품', item_no: 2, item_name: 'MIC 성형해석', input_type: 'select', input_options: JSON.stringify(['완료', '미완료', '해당없음']), sort_order: 61 },
        { category_code: 'VII', category_name: 'MIC 제품', item_no: 3, item_name: 'MIC 웰드라인', input_type: 'text', sort_order: 62 },
        { category_code: 'VII', category_name: 'MIC 제품', item_no: 4, item_name: 'A면 외관', input_type: 'select', input_options: JSON.stringify(['양호', '주의', '불량']), sort_order: 63 },
        
        // VIII. 도금 (Plating) - 12개
        { category_code: 'VIII', category_name: '도금 (Plating)', item_no: 1, item_name: '게이트 위치', input_type: 'text', sort_order: 64 },
        { category_code: 'VIII', category_name: '도금 (Plating)', item_no: 2, item_name: '게이트 개수', input_type: 'number', sort_order: 65 },
        { category_code: 'VIII', category_name: '도금 (Plating)', item_no: 3, item_name: '도금용 수축률', input_type: 'text', sort_order: 66 },
        { category_code: 'VIII', category_name: '도금 (Plating)', item_no: 4, item_name: '보스 조립부', input_type: 'text', sort_order: 67 },
        { category_code: 'VIII', category_name: '도금 (Plating)', item_no: 5, item_name: '제품 두께', input_type: 'text', sort_order: 68 },
        { category_code: 'VIII', category_name: '도금 (Plating)', item_no: 6, item_name: '치페막', input_type: 'select', input_options: JSON.stringify(['적용', '미적용']), sort_order: 69 },
        { category_code: 'VIII', category_name: '도금 (Plating)', item_no: 7, item_name: '도금 두께', input_type: 'text', sort_order: 70 },
        { category_code: 'VIII', category_name: '도금 (Plating)', item_no: 8, item_name: '도금 종류', input_type: 'select', input_options: JSON.stringify(['크롬', '니켈', '아연', '기타']), sort_order: 71 },
        { category_code: 'VIII', category_name: '도금 (Plating)', item_no: 9, item_name: '도금 면적', input_type: 'text', sort_order: 72 },
        { category_code: 'VIII', category_name: '도금 (Plating)', item_no: 10, item_name: '도금 부위', input_type: 'text', sort_order: 73 },
        { category_code: 'VIII', category_name: '도금 (Plating)', item_no: 11, item_name: '도금 전처리', input_type: 'select', input_options: JSON.stringify(['필요', '불필요']), sort_order: 74 },
        { category_code: 'VIII', category_name: '도금 (Plating)', item_no: 12, item_name: '도금 특이사항', input_type: 'textarea', sort_order: 75 },
        
        // IX. 리어 백빔 (Rear Back Beam) - 6개
        { category_code: 'IX', category_name: '리어 백빔 (Rear Back Beam)', item_no: 1, item_name: '금형구배', input_type: 'text', sort_order: 76 },
        { category_code: 'IX', category_name: '리어 백빔 (Rear Back Beam)', item_no: 2, item_name: '제품 변산부 두께', input_type: 'text', sort_order: 77 },
        { category_code: 'IX', category_name: '리어 백빔 (Rear Back Beam)', item_no: 3, item_name: '후기공 볼', input_type: 'select', input_options: JSON.stringify(['적용', '미적용']), sort_order: 78 },
        { category_code: 'IX', category_name: '리어 백빔 (Rear Back Beam)', item_no: 4, item_name: '가이드핀 규격', input_type: 'text', sort_order: 79 },
        { category_code: 'IX', category_name: '리어 백빔 (Rear Back Beam)', item_no: 5, item_name: '백빔 두께', input_type: 'text', sort_order: 80 },
        { category_code: 'IX', category_name: '리어 백빔 (Rear Back Beam)', item_no: 6, item_name: '백빔 특이사항', input_type: 'textarea', sort_order: 81 }
      ];
      
      for (const item of items) {
        await db.sequelize.query(`
          INSERT INTO pre_production_checklist_items (
            category_code, category_name, item_no, item_name, item_description,
            input_type, input_options, default_spec, is_required, sort_order, is_active,
            created_at, updated_at
          ) VALUES (
            :category_code, :category_name, :item_no, :item_name, :item_description,
            :input_type, :input_options::jsonb, :default_spec, true, :sort_order, true,
            NOW(), NOW()
          )
        `, {
          replacements: {
            category_code: item.category_code,
            category_name: item.category_name,
            item_no: item.item_no,
            item_name: item.item_name,
            item_description: item.item_description || null,
            input_type: item.input_type || 'checkbox',
            input_options: item.input_options || null,
            default_spec: item.default_spec || null,
            sort_order: item.sort_order
          }
        });
      }
      logger.info('Pre-production checklist items seed data inserted: ' + items.length + ' items');
    }
  } catch (err) {
    logger.warn('Pre-production checklist items seed:', err.message);
  }

  logger.info('Pre-production checklist migration completed.');
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
    await runRawMaterialsMigration();
    await runMasterDataMigration();
    await runGpsAlertsMigration();
    await runChecklistTemplateMigration();
    await runTransfer4MMigration();
    await runPreProductionChecklistMigration();
    
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
