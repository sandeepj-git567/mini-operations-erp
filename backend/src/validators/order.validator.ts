import { z } from 'zod';

const orderItemSchema = z.object({
  itemId: z.string().uuid('Invalid Item ID'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  unitPrice: z.number().positive('Unit price must be positive')
});

export const createOrderSchema = z.object({
  customerId: z.string().uuid('Invalid Customer ID'),
  items: z.array(orderItemSchema).min(1, 'At least one order item is required')
});

export const reserveStockSchema = z.object({
  locationId: z.string().uuid('Location ID is required for stock reservation')
});
