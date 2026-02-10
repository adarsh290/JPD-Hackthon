import { Router } from 'express';
import { shortUrlController } from '../controllers/shortUrlController';
import { resolverLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/:slug', resolverLimiter, shortUrlController.redirectToHub.bind(shortUrlController));

export default router;