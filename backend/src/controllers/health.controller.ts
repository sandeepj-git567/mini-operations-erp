import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export class HealthController {
  static async check(req: Request, res: Response) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        database: 'CONNECTED',
        service: 'mini-operations-erp-backend'
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        database: 'DISCONNECTED',
        error: error.message
      });
    }
  }
}
