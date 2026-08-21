import { Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';
import { adjustInventorySchema } from '../validators/inventory.validator';
import { AuthRequest } from '../types';

export class InventoryController {
  static async getInventories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const locationId = req.query.locationId as string | undefined;
      const categoryId = req.query.categoryId as string | undefined;
      const lowStock = req.query.lowStock === 'true';

      const inventories = await InventoryService.getInventories(locationId, categoryId, lowStock);
      res.status(200).json(inventories);
    } catch (error) {
      next(error);
    }
  }

  static async getInventoryById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const inventory = await InventoryService.getInventoryById(req.params.id);
      res.status(200).json(inventory);
    } catch (error) {
      next(error);
    }
  }

  static async adjustInventory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
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
    } catch (error) {
      next(error);
    }
  }

  static async getTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const transactions = await InventoryService.getTransactions(req.params.id);
      res.status(200).json(transactions);
    } catch (error) {
      next(error);
    }
  }
}
