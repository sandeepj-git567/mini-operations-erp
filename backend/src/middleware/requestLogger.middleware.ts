import { Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';

export const requestLogger = (req: AuthRequest, res: Response, next: NextFunction) => {
  const existingId = req.headers['x-request-id'] as string;
  const requestId = existingId || randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;

    const meta = {
      method,
      url,
      statusCode,
      durationMs,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      ...(req.user && { userId: req.user.userId, role: req.user.role })
    };

    const message = `HTTP ${method} ${url} ${statusCode} - ${durationMs}ms`;

    if (statusCode >= 500) {
      logger.error(message, meta, requestId);
    } else if (statusCode >= 400) {
      logger.warn(message, meta, requestId);
    } else {
      logger.info(message, meta, requestId);
    }
  });

  next();
};
