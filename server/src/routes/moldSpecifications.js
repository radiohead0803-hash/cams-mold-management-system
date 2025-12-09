const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const {
  createMoldSpecification,
  getMoldSpecifications,
  getMoldSpecificationById,
  updateMoldSpecification,
  deleteMoldSpecification,
  uploadPartImage,
  deletePartImage
} = require('../controllers/moldSpecificationController');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 금형 사양 등록 (금형개발 담당만 가능)
router.post('/', authorize(['mold_developer', 'system_admin']), createMoldSpecification);

// 금형 사양 목록 조회
router.get('/', getMoldSpecifications);

// 금형 사양 상세 조회
router.get('/:id', getMoldSpecificationById);

// 금형 사양 수정 (금형개발 담당만 가능)
router.patch('/:id', authorize(['mold_developer', 'system_admin']), updateMoldSpecification);

// 금형 사양 삭제 (금형개발 담당만 가능)
router.delete('/:id', authorize(['mold_developer', 'system_admin']), deleteMoldSpecification);

// 부품 사진 업로드 (금형개발 담당만 가능)
router.post('/:id/part-image', authorize(['mold_developer', 'system_admin']), uploadSingle, uploadPartImage);

// 부품 사진 삭제 (금형개발 담당만 가능)
router.delete('/:id/part-image', authorize(['mold_developer', 'system_admin']), deletePartImage);

// 숏수 업데이트 (점검 시 생산수량 입력)
router.post('/:id/shots', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, source } = req.body;
    const { MoldSpecification, Notification, ProductionQuantity } = require('../models/newIndex');

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: '유효한 생산수량을 입력해주세요.'
      });
    }

    const mold = await MoldSpecification.findByPk(id);
    if (!mold) {
      return res.status(404).json({
        success: false,
        message: '금형을 찾을 수 없습니다.'
      });
    }

    // 현재 숏수 업데이트
    const previousShots = mold.current_shots || 0;
    const newShots = previousShots + parseInt(quantity);
    
    await mold.update({
      current_shots: newShots,
      last_shot_updated_at: new Date()
    });

    // 생산수량 기록 저장
    try {
      await ProductionQuantity.create({
        mold_spec_id: id,
        quantity: parseInt(quantity),
        previous_shots: previousShots,
        new_shots: newShots,
        source: source || 'manual',
        recorded_by: req.user?.id,
        recorded_at: new Date()
      });
    } catch (prodErr) {
      console.error('ProductionQuantity create error:', prodErr);
    }

    // 보증숏수 체크 및 알림 생성
    if (mold.warranty_shots) {
      const percentage = (newShots / mold.warranty_shots) * 100;
      
      // 90% 도달 시 경고 알림
      if (percentage >= 90 && previousShots / mold.warranty_shots * 100 < 90) {
        try {
          await Notification.create({
            type: 'warranty_warning',
            title: '보증숏수 90% 도달',
            message: `[${mold.mold_code}] 금형이 보증숏수의 90%에 도달했습니다. (${newShots.toLocaleString()}/${mold.warranty_shots.toLocaleString()})`,
            priority: 'high',
            is_read: false
          });
        } catch (notifErr) {
          console.error('Notification create error:', notifErr);
        }
      }
      
      // 100% 도달 시 긴급 알림
      if (percentage >= 100 && previousShots / mold.warranty_shots * 100 < 100) {
        try {
          await Notification.create({
            type: 'warranty_exceeded',
            title: '보증숏수 초과',
            message: `[${mold.mold_code}] 금형이 보증숏수를 초과했습니다. 점검이 필요합니다. (${newShots.toLocaleString()}/${mold.warranty_shots.toLocaleString()})`,
            priority: 'urgent',
            is_read: false
          });
        } catch (notifErr) {
          console.error('Notification create error:', notifErr);
        }
      }
    }

    return res.json({
      success: true,
      message: '숏수가 업데이트되었습니다.',
      data: {
        previousShots,
        addedQuantity: parseInt(quantity),
        newShots,
        warrantyShots: mold.warranty_shots,
        percentage: mold.warranty_shots ? Math.round((newShots / mold.warranty_shots) * 100) : null
      }
    });
  } catch (error) {
    console.error('[Shots Update] Error:', error);
    return res.status(500).json({
      success: false,
      message: '숏수 업데이트 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
