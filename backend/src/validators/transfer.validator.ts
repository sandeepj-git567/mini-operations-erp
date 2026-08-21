import { z } from 'zod';

export const createTransferSchema = z.object({
  sourceLocationId: z.string().uuid('Invalid Source Location ID'),
  destinationLocationId: z.string().uuid('Invalid Destination Location ID'),
  itemId: z.string().uuid('Invalid Item ID'),
  quantity: z.number().int().positive('Quantity must be greater than zero')
}).refine(data => data.sourceLocationId !== data.destinationLocationId, {
  message: 'Source and destination locations cannot be the same',
  path: ['destinationLocationId']
});
