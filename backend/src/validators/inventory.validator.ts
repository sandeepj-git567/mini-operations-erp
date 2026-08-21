import { z } from 'zod';

export const adjustInventorySchema = z.object({
  itemId: z.string().uuid('Invalid Item ID'),
  locationId: z.string().uuid('Invalid Location ID'),
  quantity: z.number().int('Quantity must be an integer').refine(val => val !== 0, 'Quantity adjustment cannot be zero'),
  reason: z.string().min(3, 'Reason must be at least 3 characters')
});
