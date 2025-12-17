const { 
  ChecklistMasterVersion, 
  ChecklistItemMasterNew, 
  ChecklistCycleCode,
  ChecklistVersionItemMap,
  ChecklistItemCycleMap,
  InspectionSchedule,
  InspectionInstanceNew,
  InspectionInstanceItem,
  Mold,
  User,
  Notification,
  sequelize 
} = require('../models/newIndex');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const inspectionAlertService = require('../services/inspectionAlertService');

/**
 * 점검 시작 (인스턴스 생성)
 */
const startInspection = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { mold_id, cycle_code_id } = req.body;
    const created_by = req.user.id;

    // 금형 확인
    const mold = await Mold.findByPk(mold_id);
    if (!mold) {
      return res.status(404).json({ success: false, error: { message: '금형을 찾을 수 없습니다' } });
    }

    // 주기 코드 확인
    const cycleCode = await ChecklistCycleCode.findByPk(cycle_code_id);
    if (!cycleCode) {
      return res.status(404).json({ success: false, error: { message: '주기 코드를 찾을 수 없습니다' } });
    }

    // 현재 배포된 버전 찾기
    const deployedVersion = await ChecklistMasterVersion.findOne({
      where: { is_current_deployed: true, status: 'deployed' },
      include: [{
        model: ChecklistItemCycleMap,
        as: 'cycleMaps',
        where: { cycle_code_id, is_enabled: true },
        include: [{ model: ChecklistItemMasterNew, as: 'item' }]
      }]
    });

    if (!deployedVersion) {
      return res.status(404).json({ success: false, error: { message: '배포된 체크리스트 버전이 없습니다' } });
    }

    // 인스턴스 생성
    const instance = await InspectionInstanceNew.create({
      mold_id,
      checklist_version_id: deployedVersion.id,
      cycle_code_id,
      status: 'draft',
      current_shots: mold.current_shots || 0,
      inspection_date: new Date(),
      created_by
    }, { transaction });

    // 항목 초안 생성
    const items = deployedVersion.cycleMaps.map(cm => ({
      inspection_instance_id: instance.id,
      item_id: cm.item_id,
      result: null,
      note: null,
      photo_urls: []
    }));

    await InspectionInstanceItem.bulkCreate(items, { transaction });

    await transaction.commit();

    // 생성된 인스턴스 상세 조회
    const result = await InspectionInstanceNew.findByPk(instance.id, {
      include: [
        { model: Mold, as: 'mold' },
        { model: ChecklistCycleCode, as: 'cycleCode' },
        {
          model: InspectionInstanceItem,
          as: 'items',
          include: [{ model: ChecklistItemMasterNew, as: 'item' }]
        }
      ]
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    await transaction.rollback();
    logger.error('Start inspection error:', error);
    res.status(500).json({ success: false, error: { message: '점검 시작 실패' } });
  }
};

/**
 * 점검 인스턴스 조회
 */
const getInspectionInstance = async (req, res) => {
  try {
    const { id } = req.params;

    const instance = await InspectionInstanceNew.findByPk(id, {
      include: [
        { model: Mold, as: 'mold' },
        { model: ChecklistCycleCode, as: 'cycleCode' },
        { model: ChecklistMasterVersion, as: 'checklistVersion' },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        {
          model: InspectionInstanceItem,
          as: 'items',
          include: [{ model: ChecklistItemMasterNew, as: 'item' }],
          order: [['id', 'ASC']]
        }
      ]
    });

    if (!instance) {
      return res.status(404).json({ success: false, error: { message: '점검 인스턴스를 찾을 수 없습니다' } });
    }

    res.json({ success: true, data: instance });
  } catch (error) {
    logger.error('Get inspection instance error:', error);
    res.status(500).json({ success: false, error: { message: '점검 인스턴스 조회 실패' } });
  }
};

/**
 * 점검 임시저장
 */
const saveDraft = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { items, notes, gps_latitude, gps_longitude } = req.body;

    const instance = await InspectionInstanceNew.findByPk(id);
    if (!instance) {
      return res.status(404).json({ success: false, error: { message: '점검 인스턴스를 찾을 수 없습니다' } });
    }

    if (instance.status !== 'draft') {
      return res.status(400).json({ success: false, error: { message: '이미 제출된 점검입니다' } });
    }

    // 인스턴스 업데이트
    await instance.update({
      notes,
      gps_latitude,
      gps_longitude
    }, { transaction });

    // 항목 업데이트
    if (items && items.length > 0) {
      for (const item of items) {
        await InspectionInstanceItem.update({
          result: item.result,
          note: item.note,
          photo_urls: item.photo_urls || []
        }, {
          where: { id: item.id },
          transaction
        });
      }
    }

    await transaction.commit();
    res.json({ success: true, message: '임시저장되었습니다' });
  } catch (error) {
    await transaction.rollback();
    logger.error('Save draft error:', error);
    res.status(500).json({ success: false, error: { message: '임시저장 실패' } });
  }
};

/**
 * 점검 제출
 */
const submitInspection = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { items, notes, gps_latitude, gps_longitude } = req.body;

    const instance = await InspectionInstanceNew.findByPk(id, {
      include: [
        { model: Mold, as: 'mold' },
        { model: ChecklistCycleCode, as: 'cycleCode' },
        { model: InspectionInstanceItem, as: 'items' }
      ]
    });

    if (!instance) {
      return res.status(404).json({ success: false, error: { message: '점검 인스턴스를 찾을 수 없습니다' } });
    }

    if (instance.status !== 'draft') {
      return res.status(400).json({ success: false, error: { message: '이미 제출된 점검입니다' } });
    }

    // 항목 업데이트
    if (items && items.length > 0) {
      for (const item of items) {
        await InspectionInstanceItem.update({
          result: item.result,
          note: item.note,
          photo_urls: item.photo_urls || []
        }, {
          where: { id: item.id },
          transaction
        });
      }
    }

    // 전체 결과 계산
    const updatedItems = await InspectionInstanceItem.findAll({
      where: { inspection_instance_id: id }
    });

    let overall_result = 'good';
    for (const item of updatedItems) {
      if (item.result === 'bad') {
        overall_result = 'bad';
        break;
      } else if (item.result === 'caution') {
        overall_result = 'caution';
      }
    }

    // 인스턴스 제출 처리
    await instance.update({
      status: 'submitted',
      notes,
      gps_latitude,
      gps_longitude,
      overall_result,
      submitted_at: new Date()
    }, { transaction });

    // 스케줄 업데이트 (루프 갱신)
    const cycleCode = instance.cycleCode;
    if (cycleCode.cycle_type === 'shots' && cycleCode.cycle_shots) {
      const currentShots = instance.current_shots || 0;
      const nextDueShots = currentShots + cycleCode.cycle_shots;

      // 기존 스케줄 업데이트 또는 생성
      const [schedule, created] = await InspectionSchedule.findOrCreate({
        where: {
          mold_id: instance.mold_id,
          cycle_code_id: instance.cycle_code_id
        },
        defaults: {
          checklist_version_id: instance.checklist_version_id,
          last_done_shots: currentShots,
          next_due_shots: nextDueShots,
          last_done_at: new Date(),
          status: 'upcoming'
        },
        transaction
      });

      if (!created) {
        await schedule.update({
          last_done_shots: currentShots,
          next_due_shots: nextDueShots,
          last_done_at: new Date(),
          status: 'upcoming'
        }, { transaction });
      }
    } else if (cycleCode.cycle_type === 'daily') {
      // DAILY는 다음날로 설정
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [schedule, created] = await InspectionSchedule.findOrCreate({
        where: {
          mold_id: instance.mold_id,
          cycle_code_id: instance.cycle_code_id
        },
        defaults: {
          checklist_version_id: instance.checklist_version_id,
          last_done_at: new Date(),
          next_due_date: tomorrow,
          status: 'upcoming'
        },
        transaction
      });

      if (!created) {
        await schedule.update({
          last_done_at: new Date(),
          next_due_date: tomorrow,
          status: 'upcoming'
        }, { transaction });
      }
    }

    await transaction.commit();
    
    // 알림 종료 처리
    await inspectionAlertService.resolveAlerts(instance.mold_id, instance.cycle_code_id);
    
    res.json({ success: true, message: '점검이 제출되었습니다' });
  } catch (error) {
    await transaction.rollback();
    logger.error('Submit inspection error:', error);
    res.status(500).json({ success: false, error: { message: '점검 제출 실패' } });
  }
};

/**
 * 금형별 스케줄 조회
 */
const getSchedulesByMold = async (req, res) => {
  try {
    const { mold_id } = req.query;

    if (!mold_id) {
      return res.status(400).json({ success: false, error: { message: 'mold_id가 필요합니다' } });
    }

    const schedules = await InspectionSchedule.findAll({
      where: { mold_id },
      include: [
        { model: ChecklistCycleCode, as: 'cycleCode' },
        { model: ChecklistMasterVersion, as: 'checklistVersion', attributes: ['id', 'name'] }
      ],
      order: [['next_due_shots', 'ASC'], ['next_due_date', 'ASC']]
    });

    res.json({ success: true, data: schedules });
  } catch (error) {
    logger.error('Get schedules by mold error:', error);
    res.status(500).json({ success: false, error: { message: '스케줄 조회 실패' } });
  }
};

/**
 * 스케줄 상태 재계산
 */
const recalculateSchedules = async (req, res) => {
  try {
    const { mold_id } = req.query;

    const where = {};
    if (mold_id) where.mold_id = mold_id;

    const schedules = await InspectionSchedule.findAll({
      where,
      include: [
        { model: Mold, as: 'mold' },
        { model: ChecklistCycleCode, as: 'cycleCode' }
      ]
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const schedule of schedules) {
      const cycleCode = schedule.cycleCode;
      let newStatus = 'upcoming';

      if (cycleCode.cycle_type === 'shots') {
        const currentShots = schedule.mold?.current_shots || 0;
        const nextDue = schedule.next_due_shots || 0;

        if (currentShots >= nextDue) {
          newStatus = 'overdue';
          const overdue = currentShots - nextDue;
          schedule.overdue_percentage = nextDue > 0 ? (overdue / nextDue * 100).toFixed(2) : 0;
        } else if (currentShots >= nextDue * 0.9) {
          newStatus = 'due';
        }
      } else if (cycleCode.cycle_type === 'daily') {
        const dueDate = schedule.next_due_date ? new Date(schedule.next_due_date) : null;
        if (dueDate) {
          dueDate.setHours(0, 0, 0, 0);
          if (today > dueDate) {
            newStatus = 'overdue';
          } else if (today.getTime() === dueDate.getTime()) {
            newStatus = 'due';
          }
        }
      }

      if (schedule.status !== newStatus) {
        await schedule.update({ status: newStatus });
      }
    }

    res.json({ success: true, message: '스케줄이 재계산되었습니다' });
  } catch (error) {
    logger.error('Recalculate schedules error:', error);
    res.status(500).json({ success: false, error: { message: '스케줄 재계산 실패' } });
  }
};

/**
 * Due/Overdue 항목 조회
 */
const getDueSchedules = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    } else {
      where.status = { [Op.in]: ['due', 'overdue'] };
    }

    const schedules = await InspectionSchedule.findAll({
      where,
      include: [
        { model: Mold, as: 'mold', attributes: ['id', 'mold_code', 'mold_name', 'current_shots'] },
        { model: ChecklistCycleCode, as: 'cycleCode' }
      ],
      order: [['status', 'DESC'], ['next_due_shots', 'ASC']]
    });

    res.json({ success: true, data: schedules });
  } catch (error) {
    logger.error('Get due schedules error:', error);
    res.status(500).json({ success: false, error: { message: 'Due 스케줄 조회 실패' } });
  }
};

/**
 * 점검 이력 조회
 */
const getInspectionHistory = async (req, res) => {
  try {
    const { mold_id, cycle_code_id, limit = 20 } = req.query;

    const where = {};
    if (mold_id) where.mold_id = mold_id;
    if (cycle_code_id) where.cycle_code_id = cycle_code_id;

    const instances = await InspectionInstanceNew.findAll({
      where,
      include: [
        { model: Mold, as: 'mold', attributes: ['id', 'mold_code', 'mold_name'] },
        { model: ChecklistCycleCode, as: 'cycleCode' },
        { model: User, as: 'creator', attributes: ['id', 'name'] }
      ],
      order: [['inspection_date', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({ success: true, data: instances });
  } catch (error) {
    logger.error('Get inspection history error:', error);
    res.status(500).json({ success: false, error: { message: '점검 이력 조회 실패' } });
  }
};

module.exports = {
  startInspection,
  getInspectionInstance,
  saveDraft,
  submitInspection,
  getSchedulesByMold,
  recalculateSchedules,
  getDueSchedules,
  getInspectionHistory
};
