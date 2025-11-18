const express = require('express');
const router = express.Router();

// 라우트 임포트
const authRoutes = require('./auth');
const moldRoutes = require('./molds');

// API 정보
router.get('/', (req, res) => {
  res.json({
    message: 'Creative Auto Module System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      molds: '/api/molds',
      qr: '/api/qr-sessions',
      inspections: '/api/inspections',
      users: '/api/users',
      plants: '/api/plants',
      partners: '/api/partners'
    },
    documentation: '/api/docs'
  });
});

// 라우트 연결
router.use('/auth', authRoutes);
router.use('/molds', moldRoutes);

// TODO: 추가 라우트
// router.use('/qr-sessions', qrRoutes);
// router.use('/inspections', inspectionRoutes);
// router.use('/users', userRoutes);
// router.use('/plants', plantRoutes);
// router.use('/partners', partnerRoutes);

module.exports = router;
