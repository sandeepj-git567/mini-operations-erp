import { Router } from 'express';
import { TransferController } from '../controllers/transfer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', TransferController.getTransfers);
router.post('/', authorize([Role.ADMIN, Role.OPERATIONS_USER]), TransferController.createTransfer);
router.post('/:id/dispatch', authorize([Role.ADMIN, Role.OPERATIONS_USER]), TransferController.dispatchTransfer);
router.post('/:id/receive', authorize([Role.ADMIN, Role.OPERATIONS_USER]), TransferController.receiveTransfer);

export default router;
