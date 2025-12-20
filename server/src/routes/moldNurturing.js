/**
 * 금형육성 문제점 관리 API 라우터
 * - 문제점 CRUD
 * - 상태 워크플로우
 * - 이력 자동 저장
 * - 통계 집계
 */
const express = require('express');
const router = express.Router();
const db = require('../models/newIndex');
const { Op } = require('sequelize');

// 문제점 번호 생성
const generateProblemNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `MNP-${dateStr}`;
  
  const lastProblem = await db.MoldNurturingProblem.findOne({
    where: {
      problem_number: {
        [Op.like]: `${prefix}%`
      }
    },
    order: [['problem_number', 'DESC']]
  });
  
  let seq = 1;
  if (lastProblem && lastProblem.problem_number) {
    const lastSeq = parseInt(lastProblem.problem_number.split('-')[2], 10);
    seq = lastSeq + 1;
  }
  
  return `${prefix}-${String(seq).padStart(3, '0')}`;
};

// 이력 기록 함수
const recordHistory = async (problemId, actionType, prevStatus, newStatus, changedFields, description, userId, userName, transaction) => {
  await db.MoldNurturingProblemHistory.create({
    problem_id: problemId,
    action_type: actionType,
    previous_status: prevStatus,
    new_status: newStatus,
    changed_fields: changedFields,
    change_description: description,
    changed_by: userId,
    changed_by_name: userName,
    changed_at: new Date()
  }, { transaction });
};

// GET /api/v1/mold-nurturing/masters - 마스터 데이터 조회
router.get('/masters', async (req, res) => {
  try {
    const MoldNurturingProblem = db.MoldNurturingProblem;
    
    res.json({
      success: true,
      data: {
        nurturingStages: MoldNurturingProblem.NURTURING_STAGES,
        statuses: MoldNurturingProblem.STATUSES,
        severities: MoldNurturingProblem.SEVERITIES,
        problemTypes: MoldNurturingProblem.PROBLEM_TYPES,
        causeTypes: MoldNurturingProblem.CAUSE_TYPES,
        discoveredByOptions: MoldNurturingProblem.DISCOVERED_BY_OPTIONS
      }
    });
  } catch (error) {
    console.error('마스터 데이터 조회 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/mold-nurturing/problems - 문제점 목록 조회
router.get('/problems', async (req, res) => {
  try {
    const { 
      mold_id, 
      nurturing_stage, 
      status, 
      severity,
      is_recurred,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const where = {};
    if (mold_id) where.mold_id = mold_id;
    if (nurturing_stage) where.nurturing_stage = nurturing_stage;
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (is_recurred !== undefined) where.is_recurred = is_recurred === 'true';
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await db.MoldNurturingProblem.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('문제점 목록 조회 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/mold-nurturing/problems/:id - 문제점 상세 조회
router.get('/problems/:id', async (req, res) => {
  try {
    const problem = await db.MoldNurturingProblem.findByPk(req.params.id, {
      include: [
        {
          model: db.MoldNurturingProblemHistory,
          as: 'histories',
          order: [['changed_at', 'DESC']]
        },
        {
          model: db.MoldNurturingProblemComment,
          as: 'comments',
          order: [['created_at', 'DESC']]
        }
      ]
    });
    
    if (!problem) {
      return res.status(404).json({ success: false, error: { message: '문제점을 찾을 수 없습니다.' } });
    }
    
    res.json({ success: true, data: problem });
  } catch (error) {
    console.error('문제점 상세 조회 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/v1/mold-nurturing/problems - 문제점 등록
router.post('/problems', async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const {
      mold_id,
      mold_spec_id,
      nurturing_stage,
      occurrence_date,
      discovered_by,
      problem_types,
      problem_summary,
      problem_detail,
      occurrence_location,
      location_image_url,
      severity,
      occurrence_photos,
      created_by,
      created_by_name
    } = req.body;
    
    if (!mold_id || !nurturing_stage || !occurrence_date || !discovered_by || !problem_summary) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        error: { message: '필수 항목을 입력해주세요. (금형ID, 육성단계, 발생일자, 발견주체, 문제요약)' } 
      });
    }
    
    // 문제점 번호 생성
    const problemNumber = await generateProblemNumber();
    
    // 문제점 생성
    const problem = await db.MoldNurturingProblem.create({
      problem_number: problemNumber,
      mold_id,
      mold_spec_id,
      nurturing_stage,
      occurrence_date,
      discovered_by,
      problem_types,
      problem_summary,
      problem_detail,
      occurrence_location,
      location_image_url,
      severity: severity || 'minor',
      occurrence_photos,
      status: 'registered',
      created_by,
      created_by_name,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });
    
    // 이력 기록
    await recordHistory(
      problem.id,
      'created',
      null,
      'registered',
      null,
      '문제점 등록',
      created_by,
      created_by_name,
      transaction
    );
    
    await transaction.commit();
    
    res.status(201).json({ 
      success: true, 
      data: problem,
      message: '문제점이 등록되었습니다.'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('문제점 등록 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// PUT /api/v1/mold-nurturing/problems/:id - 문제점 수정
router.put('/problems/:id', async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const problem = await db.MoldNurturingProblem.findByPk(req.params.id, { transaction });
    
    if (!problem) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: { message: '문제점을 찾을 수 없습니다.' } });
    }
    
    const previousData = problem.toJSON();
    const { updated_by, updated_by_name, ...updateData } = req.body;
    
    // 변경된 필드 추적
    const changedFields = [];
    Object.keys(updateData).forEach(key => {
      if (JSON.stringify(previousData[key]) !== JSON.stringify(updateData[key])) {
        changedFields.push(key);
      }
    });
    
    // 업데이트
    await problem.update({
      ...updateData,
      updated_by,
      updated_by_name,
      updated_at: new Date()
    }, { transaction });
    
    // 이력 기록
    if (changedFields.length > 0) {
      await recordHistory(
        problem.id,
        'updated',
        previousData.status,
        updateData.status || previousData.status,
        changedFields,
        `필드 수정: ${changedFields.join(', ')}`,
        updated_by,
        updated_by_name,
        transaction
      );
    }
    
    await transaction.commit();
    
    res.json({ success: true, data: problem, message: '수정되었습니다.' });
  } catch (error) {
    await transaction.rollback();
    console.error('문제점 수정 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// PUT /api/v1/mold-nurturing/problems/:id/status - 상태 변경
router.put('/problems/:id/status', async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { status, updated_by, updated_by_name, description } = req.body;
    
    const problem = await db.MoldNurturingProblem.findByPk(req.params.id, { transaction });
    
    if (!problem) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: { message: '문제점을 찾을 수 없습니다.' } });
    }
    
    const previousStatus = problem.status;
    
    // 상태 변경
    await problem.update({
      status,
      updated_by,
      updated_by_name,
      updated_at: new Date()
    }, { transaction });
    
    // 이력 기록
    await recordHistory(
      problem.id,
      'status_changed',
      previousStatus,
      status,
      ['status'],
      description || `상태 변경: ${previousStatus} → ${status}`,
      updated_by,
      updated_by_name,
      transaction
    );
    
    await transaction.commit();
    
    res.json({ success: true, data: problem, message: '상태가 변경되었습니다.' });
  } catch (error) {
    await transaction.rollback();
    console.error('상태 변경 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/v1/mold-nurturing/problems/:id/reopen - 재발 처리 (재오픈)
router.post('/problems/:id/reopen', async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { updated_by, updated_by_name, description } = req.body;
    
    const problem = await db.MoldNurturingProblem.findByPk(req.params.id, { transaction });
    
    if (!problem) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: { message: '문제점을 찾을 수 없습니다.' } });
    }
    
    const previousStatus = problem.status;
    
    // 재발 처리
    await problem.update({
      status: 'reopened',
      is_recurred: true,
      final_judgment: null,
      updated_by,
      updated_by_name,
      updated_at: new Date()
    }, { transaction });
    
    // 이력 기록
    await recordHistory(
      problem.id,
      'reopened',
      previousStatus,
      'reopened',
      ['status', 'is_recurred'],
      description || '문제 재발로 인한 재오픈',
      updated_by,
      updated_by_name,
      transaction
    );
    
    await transaction.commit();
    
    res.json({ success: true, data: problem, message: '문제가 재오픈되었습니다.' });
  } catch (error) {
    await transaction.rollback();
    console.error('재오픈 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/v1/mold-nurturing/problems/:id/comments - 코멘트 추가
router.post('/problems/:id/comments', async (req, res) => {
  try {
    const { comment_text, attachments, created_by, created_by_name } = req.body;
    
    if (!comment_text) {
      return res.status(400).json({ success: false, error: { message: '코멘트 내용을 입력해주세요.' } });
    }
    
    const problem = await db.MoldNurturingProblem.findByPk(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, error: { message: '문제점을 찾을 수 없습니다.' } });
    }
    
    const comment = await db.MoldNurturingProblemComment.create({
      problem_id: req.params.id,
      comment_text,
      attachments,
      created_by,
      created_by_name,
      created_at: new Date()
    });
    
    res.status(201).json({ success: true, data: comment, message: '코멘트가 추가되었습니다.' });
  } catch (error) {
    console.error('코멘트 추가 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/mold-nurturing/problems/:id/history - 이력 조회
router.get('/problems/:id/history', async (req, res) => {
  try {
    const histories = await db.MoldNurturingProblemHistory.findAll({
      where: { problem_id: req.params.id },
      order: [['changed_at', 'DESC']]
    });
    
    res.json({ success: true, data: histories });
  } catch (error) {
    console.error('이력 조회 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/mold-nurturing/statistics - 통계 조회
router.get('/statistics', async (req, res) => {
  try {
    const { mold_id } = req.query;
    
    const where = {};
    if (mold_id) where.mold_id = mold_id;
    
    // 육성 단계별 문제 발생 빈도
    const stageStats = await db.MoldNurturingProblem.findAll({
      where,
      attributes: [
        'nurturing_stage',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['nurturing_stage'],
      raw: true
    });
    
    // 상태별 통계
    const statusStats = await db.MoldNurturingProblem.findAll({
      where,
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    // 심각도별 통계
    const severityStats = await db.MoldNurturingProblem.findAll({
      where,
      attributes: [
        'severity',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['severity'],
      raw: true
    });
    
    // 재발 문제 수
    const recurrenceCount = await db.MoldNurturingProblem.count({
      where: { ...where, is_recurred: true }
    });
    
    // 전체 문제 수
    const totalCount = await db.MoldNurturingProblem.count({ where });
    
    res.json({
      success: true,
      data: {
        total: totalCount,
        recurrenceCount,
        byStage: stageStats,
        byStatus: statusStats,
        bySeverity: severityStats
      }
    });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// DELETE /api/v1/mold-nurturing/problems/:id - 문제점 삭제
router.delete('/problems/:id', async (req, res) => {
  try {
    const problem = await db.MoldNurturingProblem.findByPk(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ success: false, error: { message: '문제점을 찾을 수 없습니다.' } });
    }
    
    await problem.destroy();
    
    res.json({ success: true, message: '삭제되었습니다.' });
  } catch (error) {
    console.error('문제점 삭제 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

module.exports = router;
