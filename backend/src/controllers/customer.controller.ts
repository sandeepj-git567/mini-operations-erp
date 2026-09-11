import { Response } from 'express';
import { OrderService } from '../services/order.service';
import { createCustomerSchema } from '../validators/customer.validator';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';

export class CustomerController {
  static createCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const validated = createCustomerSchema.parse(req.body);
    const customer = await OrderService.createCustomer(
      validated.name,
      validated.phone,
      validated.email,
      validated.companyName
    );
    res.status(201).json(customer);
  });

  static getCustomers = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const customers = await OrderService.getCustomers();
    res.status(200).json(customers);
  });
}
