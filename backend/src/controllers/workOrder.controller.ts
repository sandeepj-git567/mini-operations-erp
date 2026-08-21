import { Response, NextFunction } from 'express';
import { WorkOrderService } from '../services/workOrder.service';
import { createWorkOrderSchema, updateWorkOrderStatusSchema } from '../validators/workOrder.validator';
import { AuthRequest } from '../types';
import { WorkOrderStatus } from '../types';

export class WorkOrderController {
  static async createWorkOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validated = createWorkOrderSchema.parse(req.body);
      const createdBy = req.user!.email;

      const workOrder = await WorkOrderService.createWorkOrder(
        validated.locationId,
        validated.itemId,
        validated.requiredQuantity,
        validated.assignedUserId,
        createdBy
      );

      res.status(201).json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  static async getWorkOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const locationId = req.query.locationId as string | undefined;
      const status = req.query.status as WorkOrderStatus | undefined;

      const workOrders = await WorkOrderService.getWorkOrders(locationId, status);
      res.status(200).json(workOrders);
    } catch (error) {
      next(error);
    }
  }

  static async getWorkOrderById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workOrder = await WorkOrderService.getWorkOrderById(req.params.id);
      res.status(200).json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  static async updateWorkOrderStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validated = updateWorkOrderStatusSchema.parse(req.body);
      const updated = await WorkOrderService.updateWorkOrderStatus(req.params.id, validated.status);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }
}
