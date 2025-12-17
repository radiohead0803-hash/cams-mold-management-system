const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'cams-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

/**
 * API 요청 로깅 미들웨어
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')?.substring(0, 100),
      userId: req.user?.id
    };

    if (res.statusCode >= 500) {
      logger.error('API Request Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('API Request Warning', logData);
    } else if (duration > 3000) {
      logger.warn('Slow API Request', logData);
    } else {
      logger.info('API Request', logData);
    }
  });

  next();
};

/**
 * 에러 로깅 헬퍼
 */
const logError = (error, context = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context
  });
};

/**
 * 성능 측정 헬퍼
 */
const measurePerformance = (label) => {
  const start = Date.now();
  return {
    end: () => {
      const duration = Date.now() - start;
      if (duration > 1000) {
        logger.warn(`Slow operation: ${label}`, { duration: `${duration}ms` });
      }
      return duration;
    }
  };
};

module.exports = logger;
module.exports.requestLogger = requestLogger;
module.exports.logError = logError;
module.exports.measurePerformance = measurePerformance;
