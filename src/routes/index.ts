import { Router } from 'express';
import { HomeController } from '../controllers/HomeController';
import { TransferController, TransferQueryController } from '../controllers/TransferController';

const router = Router();

router.get('/', HomeController.index);
router.post('/simulate-transfer', TransferController.simulateTransfer);
router.post('/digest', TransferQueryController.getTransfer);
router.post('/ai-digest', TransferQueryController.getAiDigest);
// Temporary alias to avoid breakage if someone still calls the old path
router.post('/get-transfer', TransferQueryController.getTransfer);

export default router;


