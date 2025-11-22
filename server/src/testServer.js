const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'CAMS Test Server is running'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CAMS API Server - Test Mode',
    version: '04-02',
    endpoints: {
      health: '/health',
      info: '/info'
    }
  });
});

// Info endpoint
app.get('/info', (req, res) => {
  res.json({
    project: 'CAMS',
    version: 'Ver 04-02',
    status: 'Development',
    features: {
      dailyChecks: 'Implemented',
      periodicInspections: 'Implemented',
      database: '33 tables created',
      models: '15 models created'
    }
  });
});

// Mock Login API
app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;

  // Test accounts
  const users = {
    admin: { id: 1, name: 'CAMS 시스템 관리자', role_group: 'hq', role_detail: 'system_admin' },
    hq_manager: { id: 2, name: '금형개발 담당자', role_group: 'hq', role_detail: 'development_manager' },
    maker1: { id: 3, name: '제작처 담당자', role_group: 'maker', role_detail: 'maker_manager' },
    plant1: { id: 4, name: '생산처 담당자', role_group: 'plant', role_detail: 'plant_manager' }
  };

  if (users[username] && password === 'password123') {
    const user = users[username];
    res.json({
      success: true,
      data: {
        token: 'mock-jwt-token-' + username,
        user: {
          id: user.id,
          username: username,
          name: user.name,
          role_group: user.role_group,
          role_detail: user.role_detail
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid credentials' }
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 CAMS Test Server started');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`ℹ️  Info: http://localhost:${PORT}/info`);
  console.log(`\n⏰ Server started at: ${new Date().toLocaleString('ko-KR')}`);
});
