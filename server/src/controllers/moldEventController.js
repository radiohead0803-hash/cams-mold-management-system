/**
 * 금형 이벤트 컨트롤러
 * 금형 Life-cycle 타임라인 관리
 */
const { Op } = require('sequelize');
const logger = require('../utils/logger');

let MoldEvent;

const initModel = (sequelize) => {
  if (!MoldEvent) {
    MoldEvent = require('../models/MoldEvent')(sequelize);
  }
  return MoldEvent;
};

/**
 * 금형 이벤트 목록 조회 (타임라인)
 * GET /api/v1/mold-events/:moldId
 */
const getMoldEvents = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const EventModel = initModel(sequelize);
    const { moldId } = req.params;
    const { type, page = 1, limit = 50 } = req.query;

    const where = { mold_id: parseInt(moldId) };
    if (type) where.event_type = type;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await EventModel.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        events: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('금형 이벤트 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형 이벤트를 불러올 수 없습니다.' }
    });
  }
};

/**
 * 이벤트 기록
 * POST /api/v1/mold-events
 */
const createMoldEvent = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const EventModel = initModel(sequelize);

    const {
      mold_id,
      mold_code,
      event_type,
      reference_id,
      reference_table,
      title,
      description,
      previous_value,
      new_value,
      metadata
    } = req.body;

    const event = await EventModel.create({
      mold_id,
      mold_code,
      event_type,
      reference_id,
      reference_table,
      title,
      description,
      previous_value,
      new_value,
      actor_id: req.user?.id,
      actor_name: req.user?.name,
      actor_company: req.user?.company_name,
      metadata
    });

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('이벤트 기록 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '이벤트 기록에 실패했습니다.' }
    });
  }
};

/**
 * 이벤트 유형별 통계
 * GET /api/v1/mold-events/:moldId/stats
 */
const getMoldEventStats = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const EventModel = initModel(sequelize);
    const { moldId } = req.params;

    const stats = await EventModel.findAll({
      attributes: [
        'event_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('MAX', sequelize.col('created_at')), 'last_occurrence']
      ],
      where: { mold_id: parseInt(moldId) },
      group: ['event_type']
    });

    const totalEvents = await EventModel.count({
      where: { mold_id: parseInt(moldId) }
    });

    res.json({
      success: true,
      data: {
        stats,
        totalEvents
      }
    });
  } catch (error) {
    logger.error('이벤트 통계 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '이벤트 통계를 불러올 수 없습니다.' }
    });
  }
};

/**
 * 최근 이벤트 조회 (전체 금형)
 * GET /api/v1/mold-events/recent
 */
const getRecentEvents = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const EventModel = initModel(sequelize);
    const { limit = 20, type } = req.query;

    const where = {};
    if (type) where.event_type = type;

    const events = await EventModel.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    logger.error('최근 이벤트 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '최근 이벤트를 불러올 수 없습니다.' }
    });
  }
};

module.exports = {
  getMoldEvents,
  createMoldEvent,
  getMoldEventStats,
  getRecentEvents
};
