import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(5, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  companyName: z.string().min(2, 'Company name is required')
});
