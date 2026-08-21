import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { Role } from '../types';

const router = Router();

router.use(authenticate);

router.get('/', InventoryController.getInventories);
router.get('/:id', InventoryController.getInventoryById);
router.post('/adjust', authorize([Role.ADMIN, Role.OPERATIONS_USER]), InventoryController.adjustInventory);
router.get('/:id/transactions', InventoryController.getTransactions);

export default router;
