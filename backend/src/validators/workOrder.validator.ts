import { z } from 'zod';

export const createWorkOrderSchema = z.object({
  locationId: z.string().uuid('Invalid Location ID'),
  itemId: z.string().uuid('Invalid Item ID'),
  requiredQuantity: z.number().int().positive('Required quantity must be greater than zero'),
  assignedUserId: z.string().uuid('Invalid Assigned User ID')
});

export const updateWorkOrderStatusSchema = z.object({
  status: z.enum(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'])
});
