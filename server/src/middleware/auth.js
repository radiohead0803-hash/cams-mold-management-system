const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * JWT 인증 미들웨어
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'No token provided'
        }
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Token expired',
            code: 'TOKEN_EXPIRED'
          }
        });
      }
      
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token'
        }
      });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Authentication failed'
      }
    });
  }
};

/**
 * 역할 기반 권한 검사 미들웨어
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Unauthorized'
        }
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Forbidden - Insufficient permissions'
        }
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
