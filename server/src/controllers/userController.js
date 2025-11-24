const { User, Company } = require('../models/newIndex');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const getUsers = async (req, res) => {
  try {
    const { user_type, company_id, is_active, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    if (user_type) where.user_type = user_type;
    if (company_id) where.company_id = company_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const users = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total: users.count,
        items: users.rows,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get users' }
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get user' }
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, name, email, phone, user_type, company_id, department, position } = req.body;

    if (!username || !password || !name || !user_type) {
      return res.status(400).json({
        success: false,
        error: { message: '사용자 ID, 비밀번호, 이름, 사용자 유형은 필수입니다' }
      });
    }

    // user_type 검증
    if (!['system_admin', 'mold_developer', 'maker', 'plant'].includes(user_type)) {
      return res.status(400).json({
        success: false,
        error: { message: '올바른 사용자 유형이 아닙니다' }
      });
    }

    // 업체 사용자인 경우 company_id 필수
    if (['maker', 'plant'].includes(user_type) && !company_id) {
      return res.status(400).json({
        success: false,
        error: { message: '업체 사용자는 업체 ID가 필요합니다' }
      });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { message: '이미 존재하는 사용자 ID입니다' }
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password_hash,
      name,
      email,
      phone,
      user_type,
      company_id,
      department,
      position,
      is_active: true
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        user_type: user.user_type
      }
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사용자 생성 실패' }
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, is_active } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (password) updateData.password_hash = await bcrypt.hash(password, 10);

    await user.update(updateData);

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        is_active: user.is_active
      }
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update user' }
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    // Soft delete
    await user.update({ is_active: false });

    res.json({
      success: true,
      data: { message: 'User deactivated successfully' }
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete user' }
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
