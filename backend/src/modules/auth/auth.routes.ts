import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { authRateLimiter } from '../../middleware/rateLimiter.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  authController.login
);

router.post('/logout', authController.logout);

router.get('/me', authenticate, authController.me);

export const authRouter = router;
