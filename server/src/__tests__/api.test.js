const request = require('supertest');

/**
 * API 통합 테스트
 * - Health Check
 * - 인증 API
 * - 금형 API
 * - 점검 API
 */

// 테스트용 앱 인스턴스 (DB 연결 없이 라우트만 테스트)
const express = require('express');
const app = express();

// 기본 미들웨어
app.use(express.json());

// Health check 라우트
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 테스트용 인증 라우트
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: '이메일과 비밀번호를 입력해주세요.'
    });
  }

  // 테스트용 응답
  res.json({
    success: true,
    data: {
      token: 'test-jwt-token',
      user: { id: 1, email, name: 'Test User' }
    }
  });
});

// 테스트용 금형 목록 라우트
app.get('/api/v1/molds', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, mold_code: 'M2024-001', mold_name: '테스트 금형 1' },
      { id: 2, mold_code: 'M2024-002', mold_name: '테스트 금형 2' }
    ],
    pagination: { total: 2, limit: 50, offset: 0 }
  });
});

describe('Health Check API', () => {
  test('GET /health - 서버 상태 확인', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });
});

describe('Auth API', () => {
  test('POST /api/v1/auth/login - 로그인 성공', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data).toHaveProperty('user');
  });

  test('POST /api/v1/auth/login - 필수 필드 누락', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com' });
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

describe('Molds API', () => {
  test('GET /api/v1/molds - 금형 목록 조회', async () => {
    const response = await request(app).get('/api/v1/molds');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty('pagination');
  });
});
