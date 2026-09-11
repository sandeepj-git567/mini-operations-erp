import { Response } from 'express';
import { WorkOrderService } from '../services/workOrder.service';
import { createWorkOrderSchema, updateWorkOrderStatusSchema } from '../validators/workOrder.validator';
import { AuthRequest, WorkOrderStatus } from '../types';
import { asyncHandler } from '../utils/asyncHandler';

export class WorkOrderController {
  static createWorkOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
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
  });

  static getWorkOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const locationId = req.query.locationId as string | undefined;
    const status = req.query.status as WorkOrderStatus | undefined;

    const workOrders = await WorkOrderService.getWorkOrders(locationId, status);
    res.status(200).json(workOrders);
  });

  static getWorkOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const workOrder = await WorkOrderService.getWorkOrderById(req.params.id);
    res.status(200).json(workOrder);
  });

  static updateWorkOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const validated = updateWorkOrderStatusSchema.parse(req.body);
    const updated = await WorkOrderService.updateWorkOrderStatus(req.params.id, validated.status);
    res.status(200).json(updated);
  });
}
