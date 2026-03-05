import { Router } from 'express';
import { resolverController } from '../controllers/resolverController';
import { resolverLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get(
  '/:slug',
  resolverLimiter,
  resolverController.resolve.bind(resolverController)
);

router.post(
  '/unlock',
  resolverLimiter,
  resolverController.unlock.bind(resolverController)
);

export default router;
