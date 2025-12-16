/**
 * 점검 플로우 통합 API
 * - 스캔 → 점검 → 생산수량 → 완료 끊김 없는 플로우
 * - NG 발생 시 수리요청 바로가기
 * - 이관 요청 바로가기
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { sequelize } = require('../models/newIndex');
const alertAutoService = require('../services/alertAutoService');
const gpsService = require('../services/gpsService');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

/**
 * 점검 시작 (통합)
 * POST /api/v1/inspection-flow/start
 * Body: { moldId, checkType, gps }
 */
router.post('/start', async (req, res) => {
  try {
    const { moldId, checkType = 'daily', gps } = req.body;
    const userId = req.user.id;
    const companyId = req.user.company_id;

    if (!moldId) {
      return res.status(400).json({
        success: false,
        error: { message: 'moldId is required' }
      });
    }

    // 금형 정보 조회
    const [mold] = await sequelize.query(`
      SELECT 
        ms.id, ms.mold_number, ms.part_name, ms.car_model,
        ms.current_shots, ms.target_shots, ms.cavity_count,
        ms.status, ms.location,
        pm.plant_id
      FROM mold_specifications ms
      LEFT JOIN plant_molds pm ON ms.id = pm.mold_spec_id
      WHERE ms.id = :moldId
    `, {
      replacements: { moldId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!mold) {
      return res.status(404).json({
        success: false,
        error: { message: '금형을 찾을 수 없습니다.' }
      });
    }

    // GPS 기록
    if (gps) {
      await gpsService.recordGpsLocation({
        moldId,
        userId,
        gps,
        actionType: `${checkType}_check_start`
      });
    }

    // 오늘 점검 여부 확인
    const [existingCheck] = await sequelize.query(`
      SELECT id, status FROM daily_checks
      WHERE mold_id = :moldId 
        AND DATE(check_date) = CURRENT_DATE
        AND status = 'completed'
      LIMIT 1
    `, {
      replacements: { moldId },
      type: sequelize.QueryTypes.SELECT
    });

    // 점검 항목 템플릿 조회
    const [checkItems] = await sequelize.query(`
      SELECT id, item_name, item_code, category, check_method, 
             standard_value, is_required, display_order
      FROM checklist_template_items
      WHERE template_id = (
        SELECT id FROM checklist_master_templates 
        WHERE check_type = :checkType AND is_active = true
        LIMIT 1
      )
      ORDER BY display_order, category
    `, {
      replacements: { checkType },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        mold: {
          id: mold.id,
          moldNumber: mold.mold_number,
          partName: mold.part_name,
          carModel: mold.car_model,
          currentShots: mold.current_shots || 0,
          targetShots: mold.target_shots,
          cavityCount: mold.cavity_count,
          status: mold.status,
          location: mold.location
        },
        checkType,
        alreadyCheckedToday: !!existingCheck,
        existingCheckId: existingCheck?.id,
        checkItems: checkItems || [],
        shotsWarning: mold.target_shots > 0 && 
          (mold.current_shots || 0) >= mold.target_shots * 0.9
      }
    });
  } catch (error) {
    console.error('[InspectionFlow] Start error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to start inspection' }
    });
  }
});

/**
 * 점검 완료 (통합)
 * POST /api/v1/inspection-flow/complete
 * Body: { moldId, checkType, checkItems, productionQty, ngInfo, gps, comment }
 */
router.post('/complete', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      moldId, checkType = 'daily', checkItems, 
      productionQty, ngInfo, gps, comment 
    } = req.body;
    const userId = req.user.id;
    const companyId = req.user.company_id;

    if (!moldId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: 'moldId is required' }
      });
    }

    // 1. 점검 기록 생성
    const [checkResult] = await sequelize.query(`
      INSERT INTO daily_checks (
        mold_id, inspector_id, company_id, check_date, check_type,
        status, production_qty, comment, created_at, updated_at
      ) VALUES (
        :moldId, :userId, :companyId, NOW(), :checkType,
        'completed', :productionQty, :comment, NOW(), NOW()
      )
      RETURNING id
    `, {
      replacements: {
        moldId, userId, companyId, checkType,
        productionQty: productionQty || 0,
        comment: comment || null
      },
      transaction,
      type: sequelize.QueryTypes.INSERT
    });

    const checkId = checkResult?.[0]?.id;

    // 2. 점검 항목 저장
    if (checkItems && checkItems.length > 0) {
      for (const item of checkItems) {
        await sequelize.query(`
          INSERT INTO daily_check_items (
            daily_check_id, item_id, check_result, measured_value,
            is_ng, ng_description, created_at
          ) VALUES (
            :checkId, :itemId, :checkResult, :measuredValue,
            :isNg, :ngDescription, NOW()
          )
        `, {
          replacements: {
            checkId,
            itemId: item.itemId,
            checkResult: item.result || 'OK',
            measuredValue: item.value || null,
            isNg: item.isNg || false,
            ngDescription: item.ngDescription || null
          },
          transaction
        });
      }
    }

    // 3. 생산수량 → 타수 업데이트
    let shotsUpdated = false;
    if (productionQty && productionQty > 0) {
      const [moldInfo] = await sequelize.query(`
        SELECT cavity_count, current_shots FROM mold_specifications
        WHERE id = :moldId
      `, {
        replacements: { moldId },
        transaction,
        type: sequelize.QueryTypes.SELECT
      });

      const cavityCount = moldInfo?.cavity_count || 1;
      const shotsIncrease = Math.ceil(productionQty / cavityCount);
      const newShots = (moldInfo?.current_shots || 0) + shotsIncrease;

      await sequelize.query(`
        UPDATE mold_specifications
        SET current_shots = :newShots, updated_at = NOW()
        WHERE id = :moldId
      `, {
        replacements: { moldId, newShots },
        transaction
      });

      // 생산수량 기록
      await sequelize.query(`
        INSERT INTO production_quantities (
          mold_id, daily_check_id, production_date, quantity,
          shots_increase, previous_shots, current_shots, created_at
        ) VALUES (
          :moldId, :checkId, CURRENT_DATE, :quantity,
          :shotsIncrease, :previousShots, :newShots, NOW()
        )
      `, {
        replacements: {
          moldId, checkId,
          quantity: productionQty,
          shotsIncrease,
          previousShots: moldInfo?.current_shots || 0,
          newShots
        },
        transaction
      });

      shotsUpdated = true;
    }

    // 4. NG 발생 시 알람 생성
    let ngAlertCreated = false;
    if (ngInfo && ngInfo.hasNg) {
      await alertAutoService.createNgAlert({
        moldId,
        userId,
        companyId,
        ngType: ngInfo.type || 'minor',
        ngDescription: ngInfo.description,
        checkId
      });
      ngAlertCreated = true;
    }

    // 5. GPS 기록
    if (gps) {
      await gpsService.recordGpsLocation({
        moldId,
        userId,
        gps,
        actionType: `${checkType}_check_complete`
      });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: '점검이 완료되었습니다.',
      data: {
        checkId,
        shotsUpdated,
        ngAlertCreated,
        quickActions: {
          repairRequest: ngInfo?.hasNg ? {
            enabled: true,
            url: `/api/v1/repair-requests`,
            prefill: {
              moldId,
              description: ngInfo.description,
              priority: ngInfo.type === 'critical' ? 'urgent' : 'normal'
            }
          } : null,
          transferRequest: {
            enabled: true,
            url: `/api/v1/transfers`
          }
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('[InspectionFlow] Complete error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to complete inspection' }
    });
  }
});

/**
 * 빠른 수리요청 생성 (점검 후)
 * POST /api/v1/inspection-flow/quick-repair
 */
router.post('/quick-repair', async (req, res) => {
  try {
    const { moldId, checkId, description, priority = 'normal', photos } = req.body;
    const userId = req.user.id;
    const companyId = req.user.company_id;

    if (!moldId || !description) {
      return res.status(400).json({
        success: false,
        error: { message: 'moldId and description are required' }
      });
    }

    // 수리요청 생성
    const [result] = await sequelize.query(`
      INSERT INTO repair_requests (
        mold_id, requester_id, requester_company_id, related_check_id,
        title, description, priority, status, created_at, updated_at
      ) VALUES (
        :moldId, :userId, :companyId, :checkId,
        :title, :description, :priority, 'pending', NOW(), NOW()
      )
      RETURNING id
    `, {
      replacements: {
        moldId, userId, companyId,
        checkId: checkId || null,
        title: `점검 중 발견된 이상 - ${new Date().toLocaleDateString('ko-KR')}`,
        description,
        priority
      },
      type: sequelize.QueryTypes.INSERT
    });

    const repairId = result?.[0]?.id;

    // 알람 생성
    await alertAutoService.createRepairRequestAlert({
      moldId,
      userId,
      companyId,
      repairId,
      title: '점검 중 발견된 이상',
      priority
    });

    res.json({
      success: true,
      message: '수리요청이 등록되었습니다.',
      data: { repairId }
    });
  } catch (error) {
    console.error('[InspectionFlow] Quick repair error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create repair request' }
    });
  }
});

/**
 * 오늘 점검 현황 조회
 * GET /api/v1/inspection-flow/today-status
 */
router.get('/today-status', async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const [status] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT ms.id) as total_molds,
        COUNT(DISTINCT dc.mold_id) as checked_molds,
        COUNT(DISTINCT CASE WHEN dc.status = 'completed' THEN dc.mold_id END) as completed_molds,
        COUNT(DISTINCT CASE WHEN dci.is_ng = true THEN dc.id END) as ng_count
      FROM mold_specifications ms
      JOIN plant_molds pm ON ms.id = pm.mold_spec_id
      LEFT JOIN daily_checks dc ON ms.id = dc.mold_id AND DATE(dc.check_date) = CURRENT_DATE
      LEFT JOIN daily_check_items dci ON dc.id = dci.daily_check_id
      WHERE pm.plant_id = :companyId AND ms.status = 'active'
    `, {
      replacements: { companyId },
      type: sequelize.QueryTypes.SELECT
    });

    // 미점검 금형 목록
    const [uncheckedMolds] = await sequelize.query(`
      SELECT ms.id, ms.mold_number, ms.part_name, ms.car_model, ms.location
      FROM mold_specifications ms
      JOIN plant_molds pm ON ms.id = pm.mold_spec_id
      WHERE pm.plant_id = :companyId 
        AND ms.status = 'active'
        AND ms.id NOT IN (
          SELECT mold_id FROM daily_checks 
          WHERE DATE(check_date) = CURRENT_DATE AND status = 'completed'
        )
      ORDER BY ms.mold_number
      LIMIT 20
    `, {
      replacements: { companyId },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalMolds: parseInt(status?.total_molds || 0),
          checkedMolds: parseInt(status?.checked_molds || 0),
          completedMolds: parseInt(status?.completed_molds || 0),
          ngCount: parseInt(status?.ng_count || 0),
          completionRate: status?.total_molds > 0 
            ? Math.round((status.completed_molds / status.total_molds) * 100) 
            : 0
        },
        uncheckedMolds: uncheckedMolds || []
      }
    });
  } catch (error) {
    console.error('[InspectionFlow] Today status error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get today status' }
    });
  }
});

module.exports = router;
