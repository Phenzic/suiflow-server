import { Router } from 'express';
import { HomeController } from '../controllers/HomeController';
import { TransferController, TransferQueryController } from '../controllers/TransferController';

const router = Router();

router.get('/', HomeController.index);
router.post('/simulate-transfer', TransferController.simulateTransfer);
router.post('/get-treansfer', TransferQueryController.getTreansfer);

export default router;


