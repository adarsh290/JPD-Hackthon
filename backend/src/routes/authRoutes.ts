import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validate } from '../utils/validation.js';
import { registerSchema, loginSchema } from '../utils/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register.bind(authController)
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login.bind(authController)
);

export default router;
