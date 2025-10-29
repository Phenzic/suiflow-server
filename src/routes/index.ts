import { Router } from 'express';
import { HomeController } from '../controllers/HomeController';
import { TransferController } from '../controllers/TransferController';

const router = Router();

router.get('/', HomeController.index);
router.post('/simulate-transfer', TransferController.simulateTransfer);

export default router;


