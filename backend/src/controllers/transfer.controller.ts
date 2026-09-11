import { Response } from 'express';
import { TransferService } from '../services/transfer.service';
import { createTransferSchema } from '../validators/transfer.validator';
import { AuthRequest, TransferStatus } from '../types';
import { asyncHandler } from '../utils/asyncHandler';

export class TransferController {
  static createTransfer = asyncHandler(async (req: AuthRequest, res: Response) => {
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
  });

  static getTransfers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const status = req.query.status as TransferStatus | undefined;
    const transfers = await TransferService.getTransfers(status);
    res.status(200).json(transfers);
  });

  static dispatchTransfer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const createdBy = req.user!.email;
    const transfer = await TransferService.dispatchTransfer(req.params.id, createdBy);
    res.status(200).json(transfer);
  });

  static receiveTransfer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const createdBy = req.user!.email;
    const transfer = await TransferService.receiveTransfer(req.params.id, createdBy);
    res.status(200).json(transfer);
  });
}
