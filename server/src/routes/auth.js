const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { getMenusForUserType, USER_TYPES } = require('../config/permissions');

// POST /api/v1/auth/login
router.post('/login', authController.login);

// POST /api/v1/auth/qr-login
router.post('/qr-login', authController.qrLogin);

// POST /api/v1/auth/refresh
router.post('/refresh', authController.refreshToken);

// POST /api/v1/auth/logout
router.post('/logout', authController.logout);

// GET /api/v1/auth/me - 현재 사용자 정보 조회 (인증 필요)
router.get('/me', authenticate, authController.me);

// GET /api/v1/auth/permissions - 현재 사용자 권한 정보 조회
router.get('/permissions', authenticate, (req, res) => {
  try {
    const userType = req.user.user_type;
    const allowedMenus = getMenusForUserType(userType);
    
    res.json({
      success: true,
      data: {
        user_type: userType,
        user_type_label: getUserTypeLabel(userType),
        allowed_menus: allowedMenus,
        is_admin: userType === USER_TYPES.SYSTEM_ADMIN,
        is_hq: [USER_TYPES.SYSTEM_ADMIN, USER_TYPES.MOLD_DEVELOPER].includes(userType)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get permissions' }
    });
  }
});

// 사용자 유형 라벨 반환
function getUserTypeLabel(userType) {
  const labels = {
    system_admin: '시스템 관리자',
    mold_developer: '금형개발 담당',
    maker: '금형제작처',
    plant: '생산처'
  };
  return labels[userType] || userType;
}

module.exports = router;
