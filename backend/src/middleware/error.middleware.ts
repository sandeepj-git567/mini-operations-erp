import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    // Expected operational business error (400, 401, 403, 404, 409)
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        statusCode: err.statusCode
      }
    });
  }

  if (err instanceof ZodError) {
    // Validation error
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        statusCode: 400,
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }
    });
  }

  // Unexpected internal server error (500)
  console.error('[Unhandled Internal Error]', err);

  return res.status(500).json({
    error: {
      message: err.message || 'Internal Server Error',
      statusCode: 500
    }
  });
};
