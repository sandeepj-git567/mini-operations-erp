import { Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { adjustInventorySchema } from '../validators/inventory.validator';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';

export class InventoryController {
  static getInventories = asyncHandler(async (req: AuthRequest, res: Response) => {
    const locationId = req.query.locationId as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const lowStock = req.query.lowStock === 'true';

    const inventories = await InventoryService.getInventories(locationId, categoryId, lowStock);
    res.status(200).json(inventories);
  });

  static getInventoryById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const inventory = await InventoryService.getInventoryById(req.params.id);
    res.status(200).json(inventory);
  });

  static adjustInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const validated = adjustInventorySchema.parse(req.body);
    const createdBy = req.user!.email;

    const result = await InventoryService.adjustInventory(
      validated.itemId,
      validated.locationId,
      validated.quantity,
      validated.reason,
      createdBy
    );

    res.status(200).json(result);
  });

  static getTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const transactions = await InventoryService.getTransactions(req.params.id);
    res.status(200).json(transactions);
  });
}
