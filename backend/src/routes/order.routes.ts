import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createOrderSchema, reserveStockSchema } from '../validators/order.validator';
import { Role } from '../types';

const router = Router();

router.use(authenticate);

router.post('/', authorize([Role.ADMIN, Role.SALES_USER]), validateRequest(createOrderSchema), OrderController.createOrder);
router.get('/', OrderController.getOrders);
router.get('/:id', OrderController.getOrderById);
router.post('/:id/reserve', authorize([Role.ADMIN, Role.SALES_USER]), validateRequest(reserveStockSchema), OrderController.reserveStock);
router.post('/:id/cancel', authorize([Role.ADMIN, Role.SALES_USER]), OrderController.cancelOrder);

export default router;
