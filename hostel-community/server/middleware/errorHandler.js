import { logger } from '../utils/logger.js';
import { errorResponse } from '../utils/responseHelper.js';

export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  logger.error(`${err.message} at ${req.method} ${req.originalUrl}`, err.stack);
  return errorResponse(res, err.message, err.stack, statusCode);
};

export default { notFoundHandler, errorHandler };
