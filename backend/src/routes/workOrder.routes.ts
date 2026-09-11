import { Router } from 'express';
import { WorkOrderController } from '../controllers/workOrder.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createWorkOrderSchema, updateWorkOrderStatusSchema } from '../validators/workOrder.validator';
import { Role } from '../types';

const router = Router();

router.use(authenticate);

router.post('/', authorize([Role.ADMIN, Role.OPERATIONS_USER]), validateRequest(createWorkOrderSchema), WorkOrderController.createWorkOrder);
router.get('/', WorkOrderController.getWorkOrders);
router.get('/:id', WorkOrderController.getWorkOrderById);
router.patch('/:id/status', authorize([Role.ADMIN, Role.OPERATIONS_USER]), validateRequest(updateWorkOrderStatusSchema), WorkOrderController.updateWorkOrderStatus);

export default router;
