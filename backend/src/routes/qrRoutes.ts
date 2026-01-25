import { Router } from 'express';
import { qrController } from '../controllers/qrController.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

router.get('/hubs/:id/qr', qrController.generateHubQR.bind(qrController));

export default router;