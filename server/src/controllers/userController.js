const { User } = require('../models');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const getUsers = async (req, res) => {
  try {
    const { role, company_id, is_active, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    if (role) where.role = role;
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
    const { username, password, name, email, phone, role, company_id } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        error: { message: 'username, password, name, and role are required' }
      });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { message: 'Username already exists' }
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password_hash,
      name,
      email,
      phone,
      role,
      company_id,
      is_active: true
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create user' }
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
