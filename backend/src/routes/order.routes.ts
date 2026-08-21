import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { Role } from '../types';

const router = Router();

router.use(authenticate);

router.get('/', OrderController.getOrders);
router.post('/', authorize([Role.ADMIN, Role.SALES_USER]), OrderController.createOrder);
router.get('/:id', OrderController.getOrderById);
router.post('/:id/reserve', authorize([Role.ADMIN, Role.SALES_USER]), OrderController.reserveStock);
router.post('/:id/cancel', authorize([Role.ADMIN, Role.SALES_USER]), OrderController.cancelOrder);

export default router;
