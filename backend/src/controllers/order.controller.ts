import { Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { ReservationService } from '../services/reservation.service';
import { createOrderSchema, reserveStockSchema } from '../validators/order.validator';
import { AuthRequest } from '../types';
import { OrderStatus } from '../types';

export class OrderController {
  static async createOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validated = createOrderSchema.parse(req.body);
      const createdBy = req.user!.email;

      const order = await OrderService.createOrder(
        validated.customerId,
        validated.items,
        createdBy
      );

      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as OrderStatus | undefined;
      const orders = await OrderService.getOrders(status);
      res.status(200).json(orders);
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.getOrderById(req.params.id);
      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }

  static async reserveStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validated = reserveStockSchema.parse(req.body);
      const createdBy = req.user!.email;

      const result = await ReservationService.reserveStockForOrder(
        req.params.id,
        validated.locationId,
        createdBy
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async cancelOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const createdBy = req.user!.email;
      const result = await ReservationService.cancelOrder(req.params.id, createdBy);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
