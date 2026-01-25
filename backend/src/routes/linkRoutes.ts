import { Router } from 'express';
import { linkController } from '../controllers/linkController.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../utils/validation.js';
import { createLinkSchema, updateLinkSchema } from '../utils/validation.js';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

router.get('/hub/:hubId', linkController.getLinks.bind(linkController));

router.post('/', validate(createLinkSchema), linkController.createLink.bind(linkController));

router.patch('/:id', validate(updateLinkSchema), linkController.updateLink.bind(linkController));

router.delete('/:id', linkController.deleteLink.bind(linkController));

export default router;
