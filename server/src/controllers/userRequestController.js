const { UserRequest, Company, User } = require('../models/newIndex');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');

/**
 * 사용자 계정 요청 목록 조회
 */
const getUserRequests = async (req, res) => {
  try {
    const { status, company_id, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (company_id) {
      where.company_id = company_id;
    }
    
    const requests = await UserRequest.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'company_code', 'company_name', 'company_type']
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'name']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        items: requests.rows,
        total: requests.count,
        page: Math.floor(offset / limit) + 1,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Get user requests error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사용자 요청 목록 조회 실패' }
    });
  }
};

/**
 * 사용자 계정 요청 생성
 */
const createUserRequest = async (req, res) => {
  try {
    const {
      company_id,
      username,
      name,
      email,
      phone,
      user_type,
      department,
      position,
      request_reason
    } = req.body;

    // 필수 필드 검증
    if (!company_id || !username || !name || !user_type) {
      return res.status(400).json({
        success: false,
        error: { message: '업체, 사용자 ID, 이름, 사용자 유형은 필수입니다' }
      });
    }

    // 사용자 유형 검증
    if (!['maker', 'plant'].includes(user_type)) {
      return res.status(400).json({
        success: false,
        error: { message: '사용자 유형은 maker 또는 plant여야 합니다' }
      });
    }

    // 업체 존재 확인
    const company = await Company.findByPk(company_id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: { message: '업체를 찾을 수 없습니다' }
      });
    }

    // 업체 유형과 사용자 유형 일치 확인
    if (company.company_type !== user_type) {
      return res.status(400).json({
        success: false,
        error: { message: '업체 유형과 사용자 유형이 일치하지 않습니다' }
      });
    }

    // 중복 사용자 ID 확인
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { message: '이미 존재하는 사용자 ID입니다' }
      });
    }

    // 대기 중인 동일 요청 확인
    const existingRequest = await UserRequest.findOne({
      where: {
        username,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        error: { message: '이미 대기 중인 요청이 있습니다' }
      });
    }

    const userRequest = await UserRequest.create({
      company_id,
      requested_by: req.user.id,
      username,
      name,
      email,
      phone,
      user_type,
      department,
      position,
      request_reason,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: userRequest
    });
  } catch (error) {
    logger.error('Create user request error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사용자 요청 생성 실패' }
    });
  }
};

/**
 * 사용자 계정 요청 승인
 */
const approveUserRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { initial_password } = req.body;

    if (!initial_password) {
      return res.status(400).json({
        success: false,
        error: { message: '초기 비밀번호는 필수입니다' }
      });
    }

    const userRequest = await UserRequest.findByPk(id, {
      include: [
        {
          model: Company,
          as: 'company'
        }
      ]
    });

    if (!userRequest) {
      return res.status(404).json({
        success: false,
        error: { message: '요청을 찾을 수 없습니다' }
      });
    }

    if (userRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: '이미 처리된 요청입니다' }
      });
    }

    // 비밀번호 해시
    const password_hash = await bcrypt.hash(initial_password, 10);

    // 사용자 생성
    const newUser = await User.create({
      username: userRequest.username,
      password_hash,
      name: userRequest.name,
      email: userRequest.email,
      phone: userRequest.phone,
      user_type: userRequest.user_type,
      company_id: userRequest.company_id,
      department: userRequest.department,
      position: userRequest.position,
      is_active: true
    });

    // 요청 상태 업데이트
    await userRequest.update({
      status: 'approved',
      approved_by: req.user.id,
      approved_at: new Date(),
      created_user_id: newUser.id
    });

    res.json({
      success: true,
      data: {
        request: userRequest,
        user: newUser
      }
    });
  } catch (error) {
    logger.error('Approve user request error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사용자 요청 승인 실패' }
    });
  }
};

/**
 * 사용자 계정 요청 거부
 */
const rejectUserRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        error: { message: '거부 사유는 필수입니다' }
      });
    }

    const userRequest = await UserRequest.findByPk(id);

    if (!userRequest) {
      return res.status(404).json({
        success: false,
        error: { message: '요청을 찾을 수 없습니다' }
      });
    }

    if (userRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: '이미 처리된 요청입니다' }
      });
    }

    await userRequest.update({
      status: 'rejected',
      approved_by: req.user.id,
      approved_at: new Date(),
      rejection_reason
    });

    res.json({
      success: true,
      data: userRequest
    });
  } catch (error) {
    logger.error('Reject user request error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사용자 요청 거부 실패' }
    });
  }
};

/**
 * 사용자 계정 요청 삭제
 */
const deleteUserRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const userRequest = await UserRequest.findByPk(id);

    if (!userRequest) {
      return res.status(404).json({
        success: false,
        error: { message: '요청을 찾을 수 없습니다' }
      });
    }

    // 본인이 요청한 것만 삭제 가능 (또는 시스템 관리자)
    if (userRequest.requested_by !== req.user.id && req.user.user_type !== 'system_admin') {
      return res.status(403).json({
        success: false,
        error: { message: '권한이 없습니다' }
      });
    }

    if (userRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: '대기 중인 요청만 삭제할 수 있습니다' }
      });
    }

    await userRequest.destroy();

    res.json({
      success: true,
      message: '요청이 삭제되었습니다'
    });
  } catch (error) {
    logger.error('Delete user request error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사용자 요청 삭제 실패' }
    });
  }
};

module.exports = {
  getUserRequests,
  createUserRequest,
  approveUserRequest,
  rejectUserRequest,
  deleteUserRequest
};
