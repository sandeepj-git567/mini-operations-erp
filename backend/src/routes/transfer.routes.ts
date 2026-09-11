import { Router } from 'express';
import { TransferController } from '../controllers/transfer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createTransferSchema } from '../validators/transfer.validator';
import { Role } from '../types';

const router = Router();

router.use(authenticate);

router.post('/', authorize([Role.ADMIN, Role.OPERATIONS_USER]), validateRequest(createTransferSchema), TransferController.createTransfer);
router.get('/', TransferController.getTransfers);
router.post('/:id/dispatch', authorize([Role.ADMIN, Role.OPERATIONS_USER]), TransferController.dispatchTransfer);
router.post('/:id/receive', authorize([Role.ADMIN, Role.OPERATIONS_USER]), TransferController.receiveTransfer);

export default router;
