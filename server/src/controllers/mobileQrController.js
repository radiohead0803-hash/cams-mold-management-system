const { Mold, Plant } = require('../models');

/**
 * QR 코드 스캔 - 금형 정보 조회
 * GET /api/v1/mobile/qrcode/scan?code=M2024-001
 */
exports.scanQr = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'QR 코드가 필요합니다.'
      });
    }

    // 금형 조회
    const mold = await Mold.findOne({
      where: { mold_code: code },
      include: [
        {
          model: Plant,
          as: 'plant',
          attributes: ['id', 'name', 'location']
        }
      ]
    });

    if (!mold) {
      return res.status(404).json({
        success: false,
        message: '금형을 찾을 수 없습니다.'
      });
    }

    // TODO: 나중에 실제 템플릿 DB에서 조회
    // 현재는 하드코딩된 템플릿 목록 반환
    const templates = [
      {
        id: 1,
        code: 'DAILY',
        name: '일상 점검',
        category: 'daily',
        description: '매일 실시하는 기본 점검'
      },
      {
        id: 2,
        code: 'REG_20K',
        name: '2만샷 정기점검',
        category: 'regular',
        shot_interval: 20000,
        description: '2만샷마다 실시하는 정기 점검'
      }
    ];

    return res.json({
      success: true,
      data: {
        mold: {
          id: mold.id,
          code: mold.mold_code,
          name: mold.mold_name,
          currentShot: mold.shot_counter || 0,
          status: mold.status,
          plant: mold.plant ? {
            id: mold.plant.id,
            name: mold.plant.name,
            location: mold.plant.location
          } : null
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
