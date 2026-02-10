import { Router } from 'express';
import { qrController } from '../controllers/qrController';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

router.get('/hubs/:id/qr', qrController.generateHubQR.bind(qrController));

export default router;