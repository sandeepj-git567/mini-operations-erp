import { Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { createCustomerSchema } from '../validators/customer.validator';
import { AuthRequest } from '../types';

export class CustomerController {
  static async createCustomer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validated = createCustomerSchema.parse(req.body);
      const customer = await OrderService.createCustomer(
        validated.name,
        validated.phone,
        validated.email,
        validated.companyName
      );
      res.status(201).json(customer);
    } catch (error) {
      next(error);
    }
  }

  static async getCustomers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const customers = await OrderService.getCustomers();
      res.status(200).json(customers);
    } catch (error) {
      next(error);
    }
  }
}
