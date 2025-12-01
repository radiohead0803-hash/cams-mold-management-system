const express = require('express');
const router = express.Router();
const db = require('../../models');
const { CarModel } = db;
// const { requireAdmin } = require('../../middlewares/auth');  // 관리자 권한 체크 미들웨어가 있다면 사용

// [GET] /api/admin/car-models - 차종 목록 조회
router.get('/', async (req, res) => {
  try {
    const { is_active, oem } = req.query;
    
    const where = {};
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }
    if (oem) {
      where.oem = oem;
    }

    const items = await CarModel.findAll({
      where,
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC']
      ]
    });

    res.json({
      success: true,
      data: items
    });
  } catch (err) {
    console.error('[GET /api/admin/car-models] Error:', err);
    res.status(500).json({
      success: false,
      error: {
        message: '차종 목록 조회 중 오류가 발생했습니다.',
        details: err.message
      }
    });
  }
});

// [GET] /api/admin/car-models/:id - 차종 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await CarModel.findByPk(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          message: '차종 정보를 찾을 수 없습니다.'
        }
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (err) {
    console.error(`[GET /api/admin/car-models/${req.params.id}] Error:`, err);
    res.status(500).json({
      success: false,
      error: {
        message: '차종 조회 중 오류가 발생했습니다.',
        details: err.message
      }
    });
  }
});

// [POST] /api/admin/car-models - 차종 생성
router.post('/', async (req, res) => {
  try {
    const { code, name, oem, segment, description, sort_order } = req.body;

    // 필수 필드 검증
    if (!code || !name) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'code와 name은 필수 항목입니다.'
        }
      });
    }

    // 중복 코드 확인
    const exists = await CarModel.findOne({ where: { code } });
    if (exists) {
      return res.status(409).json({
        success: false,
        error: {
          message: '이미 존재하는 차종 코드입니다.'
        }
      });
    }

    // 차종 생성
    const item = await CarModel.create({
      code,
      name,
      oem: oem || null,
      segment: segment || null,
      description: description || null,
      sort_order: sort_order !== undefined ? sort_order : 0,
      is_active: true,
      created_by: req.user?.id || null
    });

    res.status(201).json({
      success: true,
      data: item,
      message: '차종이 성공적으로 생성되었습니다.'
    });
  } catch (err) {
    console.error('[POST /api/admin/car-models] Error:', err);
    res.status(500).json({
      success: false,
      error: {
        message: '차종 생성 중 오류가 발생했습니다.',
        details: err.message
      }
    });
  }
});

// [PUT] /api/admin/car-models/:id - 차종 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, oem, segment, description, sort_order, is_active } = req.body;

    const item = await CarModel.findByPk(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          message: '차종 정보를 찾을 수 없습니다.'
        }
      });
    }

    // 차종 수정
    await item.update({
      name: name !== undefined ? name : item.name,
      oem: oem !== undefined ? oem : item.oem,
      segment: segment !== undefined ? segment : item.segment,
      description: description !== undefined ? description : item.description,
      sort_order: sort_order !== undefined ? sort_order : item.sort_order,
      is_active: is_active !== undefined ? is_active : item.is_active,
      updated_by: req.user?.id || null
    });

    res.json({
      success: true,
      data: item,
      message: '차종이 성공적으로 수정되었습니다.'
    });
  } catch (err) {
    console.error(`[PUT /api/admin/car-models/${req.params.id}] Error:`, err);
    res.status(500).json({
      success: false,
      error: {
        message: '차종 수정 중 오류가 발생했습니다.',
        details: err.message
      }
    });
  }
});

// [DELETE] /api/admin/car-models/:id - 차종 삭제 (소프트 삭제)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await CarModel.findByPk(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          message: '차종 정보를 찾을 수 없습니다.'
        }
      });
    }

    // 소프트 삭제 (is_active를 false로 변경)
    await item.update({
      is_active: false,
      updated_by: req.user?.id || null
    });

    res.status(200).json({
      success: true,
      message: '차종이 성공적으로 삭제되었습니다.'
    });
  } catch (err) {
    console.error(`[DELETE /api/admin/car-models/${req.params.id}] Error:`, err);
    res.status(500).json({
      success: false,
      error: {
        message: '차종 삭제 중 오류가 발생했습니다.',
        details: err.message
      }
    });
  }
});

// [GET] /api/admin/car-models/stats/summary - 차종 통계
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await CarModel.count();
    const active = await CarModel.count({ where: { is_active: true } });
    const inactive = total - active;

    const byOem = await CarModel.findAll({
      attributes: [
        'oem',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { is_active: true },
      group: ['oem'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        byOem
      }
    });
  } catch (err) {
    console.error('[GET /api/admin/car-models/stats/summary] Error:', err);
    res.status(500).json({
      success: false,
      error: {
        message: '차종 통계 조회 중 오류가 발생했습니다.',
        details: err.message
      }
    });
  }
});

module.exports = router;
