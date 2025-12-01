const express = require('express');
const { Op } = require('sequelize');
const { Mold, Alert, Inspection } = require('../models/newIndex');

const router = express.Router();

/**
 * GET /api/v1/hq/molds/over-shot
 * 타수 초과(알람 미해결)인 금형 목록
 */
router.get('/over-shot', async (req, res) => {
  try {
    const alerts = await Alert.findAll({
      where: {
        alert_type: 'over_shot',
        is_resolved: false,
      },
      order: [['created_at', 'DESC']],
    });

    // metadata에서 mold_id 추출
    const moldIds = [...new Set(alerts.map((a) => {
      try {
        const metadata = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata;
        return metadata?.mold_id;
      } catch {
        return null;
      }
    }).filter(Boolean))];

    if (moldIds.length === 0) {
      return res.json({ 
        success: true,
        data: {
          items: []
        }
      });
    }

    const molds = await Mold.findAll({
      where: { id: moldIds },
    });

    const moldById = new Map(molds.map((m) => [m.id, m]));

    const items = alerts
      .map((a) => {
        try {
          const metadata = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata;
          const moldId = metadata?.mold_id;
          const mold = moldById.get(moldId);
          if (!mold) return null;

          return {
            alert_id: a.id,
            mold_id: mold.id,
            mold_code: mold.mold_code,
            mold_name: mold.mold_name,
            status: mold.status,
            current_shots: mold.current_shots,
            target_shots: mold.target_shots,
            created_at: a.created_at,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    res.json({ 
      success: true,
      data: {
        items
      }
    });
  } catch (err) {
    console.error('HQ over-shot molds error:', err);
    res.status(500).json({ 
      success: false,
      error: {
        message: '타수 초과 금형 목록 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * GET /api/v1/hq/molds/inspection-due
 * 오늘까지 정기검사 예정인 금형 목록
 */
router.get('/inspection-due', async (req, res) => {
  try {
    const today = new Date();

    const inspections = await Inspection.findAll({
      where: {
        inspection_type: 'periodic',
        status: 'scheduled',
        inspection_date: {
          [Op.lte]: today,
        },
      },
      order: [['inspection_date', 'ASC']],
    });

    const moldIds = [...new Set(inspections.map((i) => i.mold_id).filter(Boolean))];

    if (moldIds.length === 0) {
      return res.json({ 
        success: true,
        data: {
          items: []
        }
      });
    }

    const molds = await Mold.findAll({
      where: { id: moldIds },
    });

    const moldById = new Map(molds.map((m) => [m.id, m]));

    const items = inspections
      .map((i) => {
        const mold = moldById.get(i.mold_id);
        if (!mold) return null;

        return {
          inspection_id: i.id,
          mold_id: mold.id,
          mold_code: mold.mold_code,
          mold_name: mold.mold_name,
          status: mold.status,
          inspection_date: i.inspection_date,
        };
      })
      .filter(Boolean);

    res.json({ 
      success: true,
      data: {
        items
      }
    });
  } catch (err) {
    console.error('HQ inspection-due molds error:', err);
    res.status(500).json({ 
      success: false,
      error: {
        message: '정기검사 필요 금형 목록 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

module.exports = router;
