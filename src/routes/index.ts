import { Router } from 'express';
import { HomeController } from '../controllers/HomeController';
import { TransferController, TransferQueryController } from '../controllers/TransferController';

const router = Router();

router.get('/', HomeController.index);
router.post('/simulate-transfer', TransferController.simulateTransfer);
router.post('/digest', TransferQueryController.getTransfer);
// Temporary alias to avoid breakage if someone still calls the old path
router.post('/get-transfer', TransferQueryController.getTransfer);

export default router;


