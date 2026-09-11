import { Response } from 'express';
import { OrderService } from '../services/order.service';
import { ReservationService } from '../services/reservation.service';
import { createOrderSchema, reserveStockSchema } from '../validators/order.validator';
import { AuthRequest, OrderStatus } from '../types';
import { asyncHandler } from '../utils/asyncHandler';

export class OrderController {
  static createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const validated = createOrderSchema.parse(req.body);
    const createdBy = req.user!.email;

    const order = await OrderService.createOrder(
      validated.customerId,
      validated.items,
      createdBy
    );

    res.status(201).json(order);
  });

  static getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const status = req.query.status as OrderStatus | undefined;
    const orders = await OrderService.getOrders(status);
    res.status(200).json(orders);
  });

  static getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await OrderService.getOrderById(req.params.id);
    res.status(200).json(order);
  });

  static reserveStock = asyncHandler(async (req: AuthRequest, res: Response) => {
    const validated = reserveStockSchema.parse(req.body);
    const createdBy = req.user!.email;

    const result = await ReservationService.reserveStockForOrder(
      req.params.id,
      validated.locationId,
      createdBy
    );

    res.status(200).json(result);
  });

  static cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const createdBy = req.user!.email;
    const result = await ReservationService.cancelOrder(req.params.id, createdBy);
    res.status(200).json(result);
  });
}
