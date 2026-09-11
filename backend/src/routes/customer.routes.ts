import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createCustomerSchema } from '../validators/customer.validator';
import { Role } from '../types';

const router = Router();

router.use(authenticate);

router.post('/', authorize([Role.ADMIN, Role.SALES_USER]), validateRequest(createCustomerSchema), CustomerController.createCustomer);
router.get('/', CustomerController.getCustomers);

export default router;
