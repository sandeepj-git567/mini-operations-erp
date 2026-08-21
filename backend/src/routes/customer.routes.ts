import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', CustomerController.getCustomers);
router.post('/', authorize([Role.ADMIN, Role.SALES_USER]), CustomerController.createCustomer);

export default router;
