const { Mold, ChecklistTemplate, QRSession, User, sequelize } = require('../models/newIndex');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const gpsService = require('../services/gpsService');

/**
 * GPS 위치 기록 저장 (레거시 - gpsService 사용 권장)
 */
async function recordGpsLocation(moldId, userId, gps, actionType, transaction = null) {
  return gpsService.recordGpsLocation({
    moldId,
    userId,
    gps,
    actionType,
    transaction
  });
}

/**
 * QR 코드 스캔 - 금형 정보 조회
 * GET /api/v1/qr/scan?code=M2024-001
 * POST /api/v1/qr/scan { code: "M2024-001" }
 */
exports.scanQr = async (req, res) => {
  try {
    // POST body 또는 GET query 둘 다 지원
    const code = req.body.code || req.query.code;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'QR 코드 정보(code)가 없습니다.'
      });
    }

    console.log('[scanQr] Scanning code:', code);

    // 금형 조회 (Plant 모델 없이)
    const mold = await Mold.findOne({
      where: { mold_code: code }
    });

    if (!mold) {
      return res.status(404).json({
        success: false,
        message: '금형을 찾을 수 없습니다.'
      });
    }

    // 실제 DB에서 템플릿 조회
    const templates = await ChecklistTemplate.findAll({
      where: { is_active: true },
      order: [['category', 'ASC']],
      attributes: ['id', 'code', 'name', 'category', 'shot_interval']
    });

    return res.json({
      success: true,
      data: {
        mold: {
          id: mold.id,
          code: mold.mold_code,
          name: mold.mold_name,
          currentShot: mold.shot_counter || 0,
          status: mold.status
        },
        templates
      }
    });

  } catch (err) {
    console.error('[scanQr] error:', err);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

/**
 * QR 코드로 로그인 (세션 생성)
 * POST /api/v1/mobile/qr/login
 * Body: { code: "QR-MOLD-001", userId: 1, gps: { lat, lng }, deviceInfo: {} }
 * 
 * 또는 비로그인 상태에서:
 * Body: { code: "QR-MOLD-001", gps: { lat, lng } }
 * → 게스트 세션 생성 (제한된 권한)
 */
exports.qrLogin = async (req, res) => {
  try {
    const { code, userId, gps, deviceInfo } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'QR 코드 정보(code)가 없습니다.'
      });
    }

    console.log('[qrLogin] QR code login attempt:', code, 'userId:', userId);

    // 금형 조회 (mold_code 또는 qr_token으로 검색)
    let mold = await Mold.findOne({
      where: { mold_code: code }
    });

    // mold_code로 못 찾으면 qr_token으로 시도
    if (!mold) {
      mold = await Mold.findOne({
        where: { qr_token: code }
      });
    }

    if (!mold) {
      return res.status(404).json({
        success: false,
        message: `금형을 찾을 수 없습니다. (코드: ${code})`
      });
    }

    // 사용자 확인 (userId가 있으면)
    let user = null;
    if (userId) {
      user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        });
      }
    }

    // 기존 활성 세션 만료 처리
    if (user) {
      await QRSession.update(
        { is_active: false },
        { 
          where: { 
            user_id: user.id, 
            mold_id: mold.id,
            is_active: true 
          } 
        }
      );
    }

    // 새 세션 생성 (8시간 유효)
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8시간 후

    const qrSession = await QRSession.create({
      session_token: sessionToken,
      user_id: user ? user.id : null,
      mold_id: mold.id,
      qr_code: code,
      expires_at: expiresAt,
      is_active: true,
      gps_latitude: gps?.lat || null,
      gps_longitude: gps?.lng || null,
      device_info: deviceInfo || null
    });

    // GPS 위치 기록 (gps_locations 테이블에 저장)
    let gpsDeviation = null;
    if (gps) {
      await recordGpsLocation(mold.id, user?.id, gps, 'qr_login');
      
      // GPS 이탈 감지
      gpsDeviation = await gpsService.checkGpsDeviation(mold.id, gps);
      if (gpsDeviation.isOutOfRange) {
        // GPS 이탈 알람 생성
        await gpsService.createGpsDeviationAlert(mold.id, user?.id, gpsDeviation);
        console.log(`[qrLogin] GPS deviation detected for mold ${mold.id}: ${gpsDeviation.distance}m`);
      }
    }

    // JWT 토큰 생성 (QR 세션용)
    const jwtToken = jwt.sign(
      {
        sessionId: qrSession.id,
        sessionToken: sessionToken,
        moldId: mold.id,
        userId: user?.id || null,
        type: 'qr_session'
      },
      process.env.JWT_SECRET || 'cams-secret-key',
      { expiresIn: '8h' }
    );

    // 점검 템플릿 조회
    const templates = await ChecklistTemplate.findAll({
      where: { is_active: true },
      order: [['category', 'ASC']],
      attributes: ['id', 'code', 'name', 'category', 'shot_interval']
    });

    console.log('[qrLogin] Session created:', qrSession.id, 'for mold:', mold.id);

    return res.json({
      success: true,
      message: 'QR 로그인 성공',
      data: {
        session: {
          id: qrSession.id,
          token: jwtToken,
          sessionToken: sessionToken,
          expiresAt: expiresAt
        },
        mold: {
          id: mold.id,
          code: mold.mold_code,
          name: mold.mold_name,
          carModel: mold.car_model,
          partName: mold.part_name,
          cavity: mold.cavity,
          currentShots: mold.current_shots || 0,
          targetShots: mold.target_shots,
          status: mold.status,
          location: mold.location
        },
        user: user ? {
          id: user.id,
          name: user.name,
          role: user.user_type,
          companyName: user.company_name
        } : null,
        templates,
        gpsStatus: gpsDeviation ? {
          isOutOfRange: gpsDeviation.isOutOfRange,
          distance: gpsDeviation.distance,
          allowedRadius: gpsDeviation.allowedRadius,
          registeredLocation: gpsDeviation.registeredLocation
        } : null
      }
    });

  } catch (err) {
    console.error('[qrLogin] error:', err);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * QR 세션 검증
 * GET /api/v1/mobile/qr/session/:token
 */
exports.validateSession = async (req, res) => {
  try {
    const { token } = req.params;

    const session = await QRSession.findOne({
      where: { session_token: token, is_active: true },
      include: [
        { model: Mold, as: 'mold' },
        { model: User, as: 'user' }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '세션을 찾을 수 없습니다.'
      });
    }

    // 만료 확인
    if (new Date() > new Date(session.expires_at)) {
      await session.update({ is_active: false });
      return res.status(401).json({
        success: false,
        message: '세션이 만료되었습니다. 다시 QR 코드를 스캔해주세요.'
      });
    }

    return res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          expiresAt: session.expires_at,
          createdAt: session.created_at
        },
        mold: session.mold ? {
          id: session.mold.id,
          code: session.mold.mold_code,
          name: session.mold.mold_name,
          status: session.mold.status
        } : null,
        user: session.user ? {
          id: session.user.id,
          name: session.user.name,
          role: session.user.user_type
        } : null
      }
    });

  } catch (err) {
    console.error('[validateSession] error:', err);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

/**
 * QR 세션 종료
 * POST /api/v1/mobile/qr/session/:token/end
 */
exports.endSession = async (req, res) => {
  try {
    const { token } = req.params;

    const session = await QRSession.findOne({
      where: { session_token: token }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '세션을 찾을 수 없습니다.'
      });
    }

    await session.update({ is_active: false });

    return res.json({
      success: true,
      message: '세션이 종료되었습니다.'
    });

  } catch (err) {
    console.error('[endSession] error:', err);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};
