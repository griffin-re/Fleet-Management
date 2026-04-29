const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Validation errors
  if (err.details) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details,
    });
  }

  // Database errors
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate record' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Invalid reference' });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
