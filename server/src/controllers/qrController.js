const { v4: uuidv4 } = require('uuid');
const { QRSession, Mold, User } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * QR 코드 스캔 및 세션 생성
 */
const scanQR = async (req, res) => {
  try {
    const { qr_code, location } = req.body;
    const userId = req.user.id; // JWT 미들웨어에서 추출

    if (!qr_code) {
      return res.status(400).json({
        success: false,
        error: { message: 'QR code is required' }
      });
    }

    // 1. QR 코드로 금형 조회
    const mold = await Mold.findOne({ 
      where: { qr_token: qr_code },
      include: [
        {
          association: 'specification',
          attributes: ['part_name', 'car_model', 'cavity_count']
        }
      ]
    });

    if (!mold) {
      return res.status(404).json({
        success: false,
        error: { message: 'Mold not found for this QR code' }
      });
    }

    // 2. 기존 활성 세션 확인 및 만료 처리
    const existingSessions = await QRSession.findAll({
      where: {
        user_id: userId,
        mold_id: mold.id,
        is_active: true
      }
    });

    for (const session of existingSessions) {
      await session.expire();
    }

    // 3. 새 세션 생성 (8시간 유효)
    const sessionToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8);

    const qrSession = await QRSession.create({
      session_token: sessionToken,
      user_id: userId,
      mold_id: mold.id,
      qr_code,
      expires_at: expiresAt,
      is_active: true,
      gps_latitude: location?.latitude,
      gps_longitude: location?.longitude,
      device_info: {
        userAgent: req.headers['user-agent'],
        ip: req.ip
      }
    });

    // 4. 사용자 정보 조회
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'name', 'user_type', 'company_name']
    });

    res.json({
      success: true,
      data: {
        session: {
          token: sessionToken,
          expires_at: expiresAt,
          created_at: qrSession.created_at
        },
        mold: {
          id: mold.id,
          mold_code: mold.mold_code,
          mold_name: mold.mold_name,
          car_model: mold.car_model,
          part_name: mold.part_name,
          cavity: mold.cavity,
          current_shots: mold.current_shots,
          target_shots: mold.target_shots,
          status: mold.status,
          location: mold.location
        },
        user: {
          id: user.id,
          name: user.name,
          user_type: user.user_type,
          company_name: user.company_name
        },
        permissions: getUserPermissions(user.user_type)
      }
    });

  } catch (error) {
    logger.error('QR scan error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'QR scan failed' }
    });
  }
};

/**
 * 세션 검증
 */
const validateSession = async (req, res) => {
  try {
    const { session_token } = req.params;

    const session = await QRSession.findOne({
      where: { session_token },
      include: [
        {
          association: 'mold',
          attributes: ['id', 'mold_code', 'mold_name', 'status']
        },
        {
          association: 'user',
          attributes: ['id', 'name', 'user_type']
        }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { message: 'Session not found' }
      });
    }

    if (!session.isValid()) {
      return res.status(401).json({
        success: false,
        error: { message: 'Session expired or inactive' }
      });
    }

    res.json({
      success: true,
      data: {
        session: {
          token: session.session_token,
          expires_at: session.expires_at,
          is_active: session.is_active
        },
        mold: session.mold,
        user: session.user
      }
    });

  } catch (error) {
    logger.error('Session validation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Session validation failed' }
    });
  }
};

/**
 * 세션 종료
 */
const endSession = async (req, res) => {
  try {
    const { session_token } = req.params;

    const session = await QRSession.findOne({
      where: { session_token }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { message: 'Session not found' }
      });
    }

    await session.expire();

    res.json({
      success: true,
      data: { message: 'Session ended successfully' }
    });

  } catch (error) {
    logger.error('End session error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to end session' }
    });
  }
};

/**
 * 사용자 유형별 권한 반환
 */
function getUserPermissions(userType) {
  const permissions = {
    system_admin: ['all'],
    mold_developer: ['view_all', 'manage_development', 'approve_checklist'],
    maker: ['view_own', 'update_progress', 'submit_checklist', 'trial_run'],
    plant: ['view_own', 'daily_check', 'production_quantity', 'repair_request', 'transfer_request']
  };

  return permissions[userType] || [];
}

/**
 * 활성 세션 목록 조회
 */
const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await QRSession.findAll({
      where: {
        user_id: userId,
        is_active: true
      },
      include: [
        {
          association: 'mold',
          attributes: ['id', 'mold_code', 'mold_name', 'status']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // 만료된 세션 필터링
    const validSessions = sessions.filter(session => session.isValid());

    res.json({
      success: true,
      data: {
        sessions: validSessions.map(session => ({
          token: session.session_token,
          mold: session.mold,
          expires_at: session.expires_at,
          created_at: session.created_at
        }))
      }
    });

  } catch (error) {
    logger.error('Get active sessions error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get active sessions' }
    });
  }
};

module.exports = {
  scanQR,
  validateSession,
  endSession,
  getActiveSessions
};
