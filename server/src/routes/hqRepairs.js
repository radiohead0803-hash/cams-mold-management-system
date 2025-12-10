const express = require('express');
const { Op } = require('sequelize');
const { Repair, Mold, User } = require('../models/newIndex');

const router = express.Router();

/**
 * GET /api/v1/hq/repairs
 * 쿼리:
 *   status=open | completed | rejected | all
 *   limit, offset (선택)
 *
 * status=open  → completed, rejected 제외
 * status=completed → completed 만
 * status=rejected → rejected 만
 * status=all → 전체
 */
router.get('/', async (req, res) => {
  try {
    const { status = 'open', limit = 50, offset = 0 } = req.query;

    const where = {};

    if (status === 'open') {
      // 실제 모델: requested, liability_review, approved, in_repair, completed, rejected
      where.status = {
        [Op.notIn]: ['completed', 'rejected'],
      };
    } else if (status === 'completed') {
      where.status = 'completed';
    } else if (status === 'rejected') {
      where.status = 'rejected';
    }
    // status=all 이면 where 빈 객체 → 전체

    const repairs = await Repair.findAll({
      where,
      include: [
        {
          model: Mold,
          as: 'mold',
          attributes: ['id', 'mold_code', 'mold_name', 'status'],
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'username', 'user_type'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset: Number(offset),
    });

    // 프론트에서 쓰기 편하게 가공
    const items = repairs.map((r) => ({
      id: r.id,
      request_number: r.request_number,
      status: r.status,
      severity: r.severity,
      issue_type: r.issue_type,
      issue_description: r.issue_description,
      request_date: r.request_date,
      created_at: r.created_at,
      updated_at: r.updated_at,
      mold: r.mold
        ? {
            id: r.mold.id,
            mold_code: r.mold.mold_code,
            mold_name: r.mold.mold_name,
            status: r.mold.status,
          }
        : null,
      requester: r.requester
        ? {
            id: r.requester.id,
            name: r.requester.name,
            username: r.requester.username,
            user_type: r.requester.user_type,
          }
        : null,
    }));

    res.json({ 
      success: true,
      data: {
        items,
        total: items.length
      }
    });
  } catch (err) {
    console.error('HQ repairs list error:', err);
    res.status(500).json({ 
      success: false,
      error: {
        message: '수리요청 목록 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * GET /api/v1/hq/repairs/:id
 * 수리요청 상세 조회
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const repair = await Repair.findByPk(id, {
      include: [
        {
          model: Mold,
          as: 'mold',
          attributes: ['id', 'mold_code', 'mold_name', 'status', 'car_model'],
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'username', 'user_type'],
        },
      ],
    });

    if (!repair) {
      return res.status(404).json({
        success: false,
        error: {
          message: '수리요청을 찾을 수 없습니다.'
        }
      });
    }

    res.json({
      success: true,
      data: {
        repair
      }
    });
  } catch (err) {
    console.error('HQ repair detail error:', err);
    res.status(500).json({
      success: false,
      error: {
        message: '수리요청 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * POST /api/v1/hq/repairs/:id/liability/initiate
 * 1차 귀책 협의 시작
 */
router.post('/:id/liability/initiate', async (req, res) => {
  try {
    const { initiateFirstLiabilityNegotiation } = require('../controllers/repairController');
    return initiateFirstLiabilityNegotiation(req, res);
  } catch (err) {
    console.error('Initiate liability error:', err);
    res.status(500).json({
      success: false,
      error: { message: '귀책 협의 시작 중 오류가 발생했습니다.' }
    });
  }
});

/**
 * POST /api/v1/hq/repairs/:id/liability/respond
 * 1차 귀책 협의 응답
 */
router.post('/:id/liability/respond', async (req, res) => {
  try {
    const { respondFirstLiabilityNegotiation } = require('../controllers/repairController');
    return respondFirstLiabilityNegotiation(req, res);
  } catch (err) {
    console.error('Respond liability error:', err);
    res.status(500).json({
      success: false,
      error: { message: '귀책 협의 응답 중 오류가 발생했습니다.' }
    });
  }
});

/**
 * POST /api/v1/hq/repairs/:id/liability/finalize
 * 2차 귀책 협의 확정 (본사)
 */
router.post('/:id/liability/finalize', async (req, res) => {
  try {
    const { finalizeSecondLiabilityNegotiation } = require('../controllers/repairController');
    return finalizeSecondLiabilityNegotiation(req, res);
  } catch (err) {
    console.error('Finalize liability error:', err);
    res.status(500).json({
      success: false,
      error: { message: '귀책 협의 확정 중 오류가 발생했습니다.' }
    });
  }
});

module.exports = router;
