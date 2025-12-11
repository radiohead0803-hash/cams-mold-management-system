const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const {
  TryoutIssue,
  Mold,
  MoldSpecification,
  User,
  sequelize
} = require('../models/newIndex');

// T/O 문제점 목록 조회
router.get('/', async (req, res) => {
  try {
    const { 
      mold_id, 
      tryout_number, 
      issue_category, 
      improvement_status,
      severity,
      transfer_check_required,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const where = {};
    if (mold_id) where.mold_id = mold_id;
    if (tryout_number) where.tryout_number = tryout_number;
    if (issue_category) where.issue_category = issue_category;
    if (improvement_status) where.improvement_status = improvement_status;
    if (severity) where.severity = severity;
    if (transfer_check_required !== undefined) {
      where.transfer_check_required = transfer_check_required === 'true';
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await TryoutIssue.findAndCountAll({
      where,
      include: [
        { model: Mold, as: 'mold', attributes: ['id', 'mold_code', 'mold_name'] },
        { model: User, as: 'registrant', attributes: ['id', 'name'] },
        { model: User, as: 'improver', attributes: ['id', 'name'] },
        { model: User, as: 'verifier', attributes: ['id', 'name'] }
      ],
      order: [['tryout_number', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        issues: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('T/O 문제점 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: 'T/O 문제점 목록 조회 중 오류가 발생했습니다.' }
    });
  }
});

// 금형별 T/O 문제점 조회
router.get('/mold/:moldId', async (req, res) => {
  try {
    const { moldId } = req.params;
    const { tryout_number } = req.query;

    const where = { mold_id: moldId };
    if (tryout_number) where.tryout_number = tryout_number;

    const issues = await TryoutIssue.findAll({
      where,
      include: [
        { model: User, as: 'registrant', attributes: ['id', 'name'] },
        { model: User, as: 'improver', attributes: ['id', 'name'] }
      ],
      order: [['tryout_number', 'ASC'], ['issue_code', 'ASC']]
    });

    // T/O 차수별 그룹핑
    const grouped = issues.reduce((acc, issue) => {
      const key = `T/O ${issue.tryout_number}차`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(issue);
      return acc;
    }, {});

    // 통계
    const stats = {
      total: issues.length,
      pending: issues.filter(i => i.improvement_status === 'pending').length,
      in_progress: issues.filter(i => i.improvement_status === 'in_progress').length,
      resolved: issues.filter(i => i.improvement_status === 'resolved').length,
      deferred: issues.filter(i => i.improvement_status === 'deferred').length,
      transfer_pending: issues.filter(i => i.transfer_check_required && !i.transfer_checked).length
    };

    res.json({
      success: true,
      data: {
        issues,
        grouped,
        stats
      }
    });
  } catch (error) {
    console.error('금형별 T/O 문제점 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형별 T/O 문제점 조회 중 오류가 발생했습니다.' }
    });
  }
});

// T/O 문제점 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const issue = await TryoutIssue.findByPk(id, {
      include: [
        { model: Mold, as: 'mold' },
        { model: MoldSpecification, as: 'moldSpecification' },
        { model: User, as: 'registrant', attributes: ['id', 'name'] },
        { model: User, as: 'improver', attributes: ['id', 'name'] },
        { model: User, as: 'verifier', attributes: ['id', 'name'] }
      ]
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: { message: 'T/O 문제점을 찾을 수 없습니다.' }
      });
    }

    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    console.error('T/O 문제점 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: 'T/O 문제점 상세 조회 중 오류가 발생했습니다.' }
    });
  }
});

// T/O 문제점 등록
router.post('/', async (req, res) => {
  try {
    const {
      mold_id,
      mold_spec_id,
      tryout_number,
      tryout_date,
      issue_category,
      issue_title,
      issue_description,
      issue_location,
      severity,
      issue_image_url,
      issue_image_filename,
      attachments,
      transfer_check_required,
      remarks
    } = req.body;

    // 문제점 코드 생성
    const count = await TryoutIssue.count({
      where: { mold_id, tryout_number }
    });
    const issue_code = `TO${tryout_number}-${String(count + 1).padStart(3, '0')}`;

    const issue = await TryoutIssue.create({
      mold_id,
      mold_spec_id,
      tryout_number,
      tryout_date,
      issue_code,
      issue_category,
      issue_title,
      issue_description,
      issue_location,
      severity: severity || 'medium',
      issue_image_url,
      issue_image_filename,
      attachments: attachments || [],
      improvement_status: 'pending',
      transfer_check_required: transfer_check_required !== false,
      registered_by: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: issue,
      message: 'T/O 문제점이 등록되었습니다.'
    });
  } catch (error) {
    console.error('T/O 문제점 등록 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: 'T/O 문제점 등록 중 오류가 발생했습니다.' }
    });
  }
});

// T/O 문제점 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await TryoutIssue.findByPk(id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: { message: 'T/O 문제점을 찾을 수 없습니다.' }
      });
    }

    await issue.update(req.body);

    res.json({
      success: true,
      data: issue,
      message: 'T/O 문제점이 수정되었습니다.'
    });
  } catch (error) {
    console.error('T/O 문제점 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: 'T/O 문제점 수정 중 오류가 발생했습니다.' }
    });
  }
});

// 개선 조치 등록
router.post('/:id/improvement', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      improvement_action, 
      improvement_date, 
      improvement_image_url,
      improvement_image_filename,
      improvement_status 
    } = req.body;

    const issue = await TryoutIssue.findByPk(id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: { message: 'T/O 문제점을 찾을 수 없습니다.' }
      });
    }

    await issue.update({
      improvement_action,
      improvement_date: improvement_date || new Date(),
      improvement_image_url,
      improvement_image_filename,
      improvement_status: improvement_status || 'resolved',
      improved_by: req.user?.id
    });

    res.json({
      success: true,
      data: issue,
      message: '개선 조치가 등록되었습니다.'
    });
  } catch (error) {
    console.error('개선 조치 등록 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '개선 조치 등록 중 오류가 발생했습니다.' }
    });
  }
});

// 검증 처리
router.post('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { verification_status, verification_remarks } = req.body;

    const issue = await TryoutIssue.findByPk(id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: { message: 'T/O 문제점을 찾을 수 없습니다.' }
      });
    }

    await issue.update({
      verification_status,
      verification_remarks,
      verified_by: req.user?.id,
      verified_at: new Date()
    });

    res.json({
      success: true,
      data: issue,
      message: '검증이 완료되었습니다.'
    });
  } catch (error) {
    console.error('검증 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '검증 처리 중 오류가 발생했습니다.' }
    });
  }
});

// 양산이관 확인 처리
router.post('/:id/transfer-check', async (req, res) => {
  try {
    const { id } = req.params;

    const issue = await TryoutIssue.findByPk(id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: { message: 'T/O 문제점을 찾을 수 없습니다.' }
      });
    }

    // 개선 완료 상태인지 확인
    if (issue.improvement_status !== 'resolved' && issue.improvement_status !== 'not_applicable') {
      return res.status(400).json({
        success: false,
        error: { message: '개선이 완료되지 않은 문제점입니다.' }
      });
    }

    await issue.update({
      transfer_checked: true,
      transfer_checked_by: req.user?.id,
      transfer_checked_at: new Date()
    });

    res.json({
      success: true,
      data: issue,
      message: '양산이관 확인이 완료되었습니다.'
    });
  } catch (error) {
    console.error('양산이관 확인 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '양산이관 확인 처리 중 오류가 발생했습니다.' }
    });
  }
});

// 금형별 양산이관 준비 상태 확인
router.get('/mold/:moldId/transfer-ready', async (req, res) => {
  try {
    const { moldId } = req.params;

    const issues = await TryoutIssue.findAll({
      where: {
        mold_id: moldId,
        transfer_check_required: true
      }
    });

    const total = issues.length;
    const resolved = issues.filter(i => 
      i.improvement_status === 'resolved' || i.improvement_status === 'not_applicable'
    ).length;
    const checked = issues.filter(i => i.transfer_checked).length;
    const pending = issues.filter(i => 
      i.improvement_status === 'pending' || i.improvement_status === 'in_progress'
    );

    const isReady = total === 0 || (resolved === total && checked === total);

    res.json({
      success: true,
      data: {
        isReady,
        total,
        resolved,
        checked,
        pendingIssues: pending,
        message: isReady 
          ? '모든 T/O 문제점이 해결되어 양산이관이 가능합니다.'
          : `${total - resolved}개의 미해결 문제점이 있습니다.`
      }
    });
  } catch (error) {
    console.error('양산이관 준비 상태 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '양산이관 준비 상태 확인 중 오류가 발생했습니다.' }
    });
  }
});

// 통계 조회
router.get('/stats/summary', async (req, res) => {
  try {
    const { mold_id } = req.query;

    const where = {};
    if (mold_id) where.mold_id = mold_id;

    const stats = await TryoutIssue.findAll({
      where,
      attributes: [
        'improvement_status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['improvement_status']
    });

    const categoryStats = await TryoutIssue.findAll({
      where,
      attributes: [
        'issue_category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['issue_category']
    });

    const severityStats = await TryoutIssue.findAll({
      where,
      attributes: [
        'severity',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['severity']
    });

    res.json({
      success: true,
      data: {
        byStatus: stats.reduce((acc, s) => {
          acc[s.improvement_status] = parseInt(s.dataValues.count);
          return acc;
        }, {}),
        byCategory: categoryStats.reduce((acc, s) => {
          acc[s.issue_category] = parseInt(s.dataValues.count);
          return acc;
        }, {}),
        bySeverity: severityStats.reduce((acc, s) => {
          acc[s.severity] = parseInt(s.dataValues.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '통계 조회 중 오류가 발생했습니다.' }
    });
  }
});

module.exports = router;
