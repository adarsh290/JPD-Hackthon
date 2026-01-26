import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter, resolverLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Get analytics (requires auth)
router.get(
  '/hub/:hubId',
  authenticate,
  apiLimiter,
  analyticsController.getAnalytics.bind(analyticsController)
);

// Export analytics as CSV (requires auth)
router.get(
  '/export/:hubId',
  authenticate,
  apiLimiter,
  analyticsController.exportAnalytics.bind(analyticsController)
);

// Track click (public endpoint, but rate limited)
router.post(
  '/click/:hubId/:linkId',
  resolverLimiter,
  analyticsController.trackClick.bind(analyticsController)
);

// Simple click tracking endpoint (matches frontend call)
router.post(
  '/click',
  resolverLimiter,
  analyticsController.trackSimpleClick.bind(analyticsController)
);

export default router;
