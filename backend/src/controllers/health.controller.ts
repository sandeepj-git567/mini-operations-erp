import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env.config';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

export class HealthController {
  static check = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = (req as any).requestId;

    try {
      // Benchmark database latency
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbLatencyMs = Date.now() - dbStart;

      // Extract memory metrics
      const memory = process.memoryUsage();
      const memoryUsage = {
        rssMB: (memory.rss / (1024 * 1024)).toFixed(2),
        heapTotalMB: (memory.heapTotal / (1024 * 1024)).toFixed(2),
        heapUsedMB: (memory.heapUsed / (1024 * 1024)).toFixed(2)
      };

      const isHealthy = dbLatencyMs < 1000;
      const status = isHealthy ? 'UP' : 'DEGRADED';

      const healthPayload = {
        status,
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        environment: env.NODE_ENV,
        database: {
          status: 'CONNECTED',
          latencyMs: dbLatencyMs
        },
        memory: memoryUsage,
        totalResponseTimeMs: Date.now() - startTime
      };

      res.status(200).json(healthPayload);
    } catch (error: any) {
      logger.error('Healthcheck dependency failure', { error: error.message }, requestId, error.stack);

      res.status(503).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        environment: env.NODE_ENV,
        database: {
          status: 'DISCONNECTED',
          error: error.message || 'Database unreachable'
        },
        error: 'Critical system dependency unavailable'
      });
    }
  });
}
