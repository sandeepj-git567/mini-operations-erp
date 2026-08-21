import { Router } from 'express';
import { WorkOrderController } from '../controllers/workOrder.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { Role } from '../types';

const router = Router();

router.use(authenticate);

router.get('/', WorkOrderController.getWorkOrders);
router.post('/', authorize([Role.ADMIN]), WorkOrderController.createWorkOrder);
router.get('/:id', WorkOrderController.getWorkOrderById);
router.patch('/:id/status', authorize([Role.ADMIN, Role.OPERATIONS_USER]), WorkOrderController.updateWorkOrderStatus);

export default router;
