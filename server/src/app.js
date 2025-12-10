const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models/newIndex');

const app = express();

// Middleware
// CORS 설정 - 프로덕션 환경에서 프론트엔드 URL 허용
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://bountiful-nurturing-production-cd5c.up.railway.app',
  'https://cams-mold-management-system-production-cd5c.up.railway.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // origin이 없는 경우 (같은 도메인 요청, Postman 등) 허용
    if (!origin) return callback(null, true);
    
    // 환경변수로 모든 origin 허용 설정
    if (process.env.CORS_ORIGIN === '*') {
      return callback(null, true);
    }
    
    // Railway 도메인 패턴 매칭 (*.up.railway.app)
    if (origin.includes('.up.railway.app')) {
      return callback(null, true);
    }
    
    // 허용된 origin 목록 확인
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
  maxAge: 600,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 (업로드된 이미지)
const uploadDir = process.env.UPLOAD_PATH || 'uploads/';
app.use('/uploads', express.static(path.join(__dirname, '..', uploadDir)));

// Routes
const authRouter = require('./routes/auth');
const qrRouter = require('./routes/qr');
const productionRouter = require('./routes/production');
const developmentRouter = require('./routes/development');
const preProductionRouter = require('./routes/preProduction');
const dailyChecksRouter = require('./routes/dailyChecks');
const periodicInspectionsRouter = require('./routes/periodicInspections');
const moldSpecificationsRouter = require('./routes/moldSpecifications');
const makerSpecificationsRouter = require('./routes/makerSpecifications');
const companiesRouter = require('./routes/companies');
const userRequestsRouter = require('./routes/userRequests');
const usersRouter = require('./routes/users');
const masterDataRouter = require('./routes/masterData');
const hqDashboardRouter = require('./routes/hqDashboard');
const dashRouter = require('./routes/dashRoutes');
const makerRepairRouter = require('./routes/makerRepair');
const plantRepairRouter = require('./routes/plantRepair');
const hqLocationRouter = require('./routes/hqLocation');
const plantProductionRouter = require('./routes/plantProduction');
const plantDashboardRouter = require('./routes/plantDashboard');
const hqJobsRouter = require('./routes/hqJobs');
const hqCheckItemsRouter = require('./routes/hqCheckItems');
const hqTemplatesRouter = require('./routes/hqTemplates');
const checklistFormsRouter = require('./routes/checklistForms');
const devPlansRouter = require('./routes/devPlans');
const hqRepairsRouter = require('./routes/hqRepairs');
const hqMoldsRouter = require('./routes/hqMolds');
const carModelsRouter = require('./routes/admin/carModels');
const mobileMoldsRouter = require('./routes/mobileMolds');
const mobileQrRouter = require('./routes/mobileQr');
const mobileDashboardRouter = require('./routes/mobileDashboard');
const repairRequestsRouter = require('./routes/repairRequests');
const notificationsRouter = require('./routes/notifications');
const dashboardRouter = require('./routes/dashboard');
const moldsRouter = require('./routes/molds');
const inspectionsRouter = require('./routes/inspections');
const moldImagesRouter = require('./routes/moldImages');
const approvalWorkflowRouter = require('./routes/approvalWorkflow');
const injectionConditionsRouter = require('./routes/injectionConditions');
const weightRouter = require('./routes/weight');

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/molds', moldsRouter);
app.use('/api/v1/inspections', inspectionsRouter);
app.use('/api/v1/mobile', mobileMoldsRouter);
app.use('/api/v1/mobile', mobileQrRouter);
app.use('/api/v1', repairRequestsRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/qr', qrRouter);
app.use('/api/v1/production', productionRouter);
app.use('/api/v1/development', developmentRouter);
app.use('/api/v1/pre-production', preProductionRouter);
app.use('/api/daily-checks', dailyChecksRouter);
app.use('/api/periodic-inspections', periodicInspectionsRouter);
app.use('/api/v1/mold-specifications', moldSpecificationsRouter);
app.use('/api/v1/maker-specifications', makerSpecificationsRouter);
app.use('/api/v1/companies', companiesRouter);
app.use('/api/v1/user-requests', userRequestsRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/master-data', masterDataRouter);
app.use('/api/v1/dash', dashRouter);
app.use('/api/v1/maker', makerRepairRouter);
app.use('/api/v1/plant', plantRepairRouter);
app.use('/api/v1/plant', plantProductionRouter);
app.use('/api/v1/plant', plantDashboardRouter);
// HQ routes combined
app.use('/api/v1/hq', hqDashboardRouter);
app.use('/api/v1/hq', hqLocationRouter);
app.use('/api/v1/hq', hqJobsRouter);
app.use('/api/v1/hq', hqCheckItemsRouter);
app.use('/api/v1/hq', hqTemplatesRouter);
app.use('/api/v1/hq/repairs', hqRepairsRouter);
app.use('/api/v1/hq/molds', hqMoldsRouter);
// Admin routes
app.use('/api/v1/admin/car-models', carModelsRouter);
// Checklist forms (all users)
app.use('/api/v1/checklists', checklistFormsRouter);
// Development plans
app.use('/api/v1/dev', devPlansRouter);
// Mold images
app.use('/api/v1/mold-images', moldImagesRouter);
// Approval workflow (수리요청 승인 워크플로우)
app.use('/api/v1/workflow', approvalWorkflowRouter);
// Injection conditions (사출조건 관리)
app.use('/api/v1/injection-conditions', injectionConditionsRouter);
// Weight management (설계중량/실중량 이력관리)
app.use('/api/v1/weight', weightRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: sequelize.options.database
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CAMS API Server',
    version: '04-02',
    endpoints: {
      dailyChecks: '/api/daily-checks',
      periodicInspections: '/api/periodic-inspections',
      health: '/health'
    }
  });
});

// Serve static files from React build (production only)
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../public');
  app.use(express.static(publicPath));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
      return next();
    }
    
    // Serve index.html for all other routes
    res.sendFile(path.join(publicPath, 'index.html'), (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(404).json({
          success: false,
          message: '요청한 리소스를 찾을 수 없습니다.'
        });
      }
    });
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || '서버 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 API 리소스를 찾을 수 없습니다.'
  });
});

module.exports = app;
