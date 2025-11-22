const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Mold } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 일반 로그인
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Username and password are required' }
      });
    }

    const user = await User.findOne({ where: { username, is_active: true } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        user_type: user.user_type,
        company_id: user.company_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // 마지막 로그인 시간 업데이트
    await user.update({ last_login_at: new Date() });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          user_type: user.user_type,
          company_id: user.company_id,
          company_name: user.company_name
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Login failed' }
    });
  }
};

/**
 * QR 코드 기반 로그인
 */
const qrLogin = async (req, res) => {
  try {
    const { qr_code, user_id, location } = req.body;

    if (!qr_code || !user_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'QR code and user ID are required' }
      });
    }

    // GPS 위치 검증 (선택적)
    if (location && (!location.lat || !location.lng)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid GPS location format' }
      });
    }

    // QR 코드로 금형 조회
    const mold = await Mold.findOne({ where: { qr_code } });
    
    if (!mold) {
      return res.status(404).json({
        success: false,
        error: { message: 'Mold not found' }
      });
    }

    // 사용자 조회
    const user = await User.findOne({ where: { id: user_id, is_active: true } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    // JWT 토큰 생성 (8시간 세션)
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        user_type: user.user_type,
        company_id: user.company_id,
        mold_id: mold.id,
        qr_session: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      data: {
        token,
        mold: {
          id: mold.id,
          mold_number: mold.mold_number,
          mold_name: mold.mold_name,
          product_name: mold.product_name,
          total_shots: mold.total_shots,
          status: mold.status
        },
        user: {
          id: user.id,
          name: user.name,
          user_type: user.user_type
        }
      }
    });
  } catch (error) {
    logger.error('QR login error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'QR login failed' }
    });
  }
};

/**
 * 토큰 갱신
 */
const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: { message: 'Token is required' }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    
    const user = await User.findOne({ where: { id: decoded.id, is_active: true } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    const newToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        user_type: user.user_type,
        company_id: user.company_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      success: true,
      data: { token: newToken }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Token refresh failed' }
    });
  }
};

/**
 * 로그아웃
 */
const logout = async (req, res) => {
  try {
    // 클라이언트에서 토큰 삭제 처리
    res.json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Logout failed' }
    });
  }
};

module.exports = {
  login,
  qrLogin,
  refreshToken,
  logout
};
