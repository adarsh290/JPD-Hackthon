import { Router } from 'express';
import { hubController } from '../controllers/hubController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import { createHubSchema, updateHubSchema } from '../utils/validation';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(apiLimiter);

// Get all hubs
router.get('/', hubController.getHubs.bind(hubController));

// Get single hub
router.get('/:id', hubController.getHub.bind(hubController));

// Create hub
router.post(
  '/',
  validate(createHubSchema),
  hubController.createHub.bind(hubController)
);

// Update hub
router.patch(
  '/:id',
  validate(updateHubSchema),
  hubController.updateHub.bind(hubController)
);

// Delete hub
router.delete('/:id', hubController.deleteHub.bind(hubController));

export default router;
