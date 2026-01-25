import { Router } from 'express';
import { shortUrlController } from '../controllers/shortUrlController.js';
import { resolverLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/:slug', resolverLimiter, shortUrlController.redirectToHub.bind(shortUrlController));

export default router;