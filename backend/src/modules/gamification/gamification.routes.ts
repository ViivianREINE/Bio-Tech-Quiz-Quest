import { Router } from 'express';
import { Role } from '@prisma/client';
import { gamificationController } from './gamification.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { adminXPAdjustSchema } from './gamification.validation.js';

const gamificationRouter = Router();
gamificationRouter.use(authenticate);

gamificationRouter.get('/xp', gamificationController.getMyXP);
gamificationRouter.get('/badges', gamificationController.getMyBadges);
gamificationRouter.post(
  '/admin/xp-adjust',
  authorize(Role.ADMIN),
  validateRequest({ body: adminXPAdjustSchema }),
  gamificationController.adminAdjustXP
);

export { gamificationRouter };
