import { Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';

export const errorHandler = (
  err: any,
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  const requestId = req.requestId;

  if (err instanceof AppError) {
    // Log business domain warnings/errors with correlation ID
    if (err.statusCode >= 500) {
      logger.error(err.message, { statusCode: err.statusCode, code: err.errorCode }, requestId, err.stack);
    } else {
      logger.warn(err.message, { statusCode: err.statusCode, code: err.errorCode }, requestId);
    }

    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        statusCode: err.statusCode,
        ...(err.errorCode && { code: err.errorCode })
      }
    });
  }

  if (err instanceof ZodError) {
    // Log schema validation warning
    const details = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));

    logger.warn('Request validation failed', { details }, requestId);

    return res.status(400).json({
      error: {
        message: 'Validation failed',
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        details
      }
    });
  }

  // Log unhandled operational / internal 500 server errors
  logger.error('Unhandled Internal Server Error', { error: err.message }, requestId, err.stack);

  const isProduction = env.NODE_ENV === 'production';
  const publicMessage = isProduction ? 'Internal Server Error' : (err.message || 'Internal Server Error');

  return res.status(500).json({
    error: {
      message: publicMessage,
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR'
    }
  });
};
