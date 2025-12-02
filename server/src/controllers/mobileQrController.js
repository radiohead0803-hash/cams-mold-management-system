const { Mold, Plant, ChecklistTemplate } = require('../models');

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
