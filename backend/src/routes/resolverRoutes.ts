import { Router } from 'express';
import { resolverController } from '../controllers/resolverController.js';
import { resolverLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get(
  '/:slug',
  resolverLimiter,
  resolverController.resolve.bind(resolverController)
);

export default router;
