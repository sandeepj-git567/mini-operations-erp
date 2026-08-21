import { Response, NextFunction } from 'express';
import { TransferService } from '../services/transfer.service';
import { createTransferSchema } from '../validators/transfer.validator';
import { AuthRequest } from '../types';
import { TransferStatus } from '@prisma/client';

export class TransferController {
  static async createTransfer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validated = createTransferSchema.parse(req.body);
      const createdBy = req.user!.email;

      const transfer = await TransferService.createTransfer(
        validated.sourceLocationId,
        validated.destinationLocationId,
        validated.itemId,
        validated.quantity,
        createdBy
      );

      res.status(201).json(transfer);
    } catch (error) {
      next(error);
    }
  }

  static async getTransfers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as TransferStatus | undefined;
      const transfers = await TransferService.getTransfers(status);
      res.status(200).json(transfers);
    } catch (error) {
      next(error);
    }
  }

  static async dispatchTransfer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const createdBy = req.user!.email;
      const transfer = await TransferService.dispatchTransfer(req.params.id, createdBy);
      res.status(200).json(transfer);
    } catch (error) {
      next(error);
    }
  }

  static async receiveTransfer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const createdBy = req.user!.email;
      const transfer = await TransferService.receiveTransfer(req.params.id, createdBy);
      res.status(200).json(transfer);
    } catch (error) {
      next(error);
    }
  }
}
