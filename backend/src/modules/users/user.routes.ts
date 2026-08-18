import { Router } from 'express';
import { Role } from '@prisma/client';
import { userController } from './user.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  updateUserSchema,
  updateStatusSchema,
  userIdParamSchema,
  userQuerySchema,
} from './user.validation.js';

const router = Router();

// Protect all user routes
router.use(authenticate);

router.get(
  '/',
  authorize(Role.ADMIN),
  validateRequest({ query: userQuerySchema }),
  userController.getUsers
);

router.get(
  '/:id',
  validateRequest({ params: userIdParamSchema }),
  userController.getUserById
);

router.put(
  '/:id',
  validateRequest({ params: userIdParamSchema, body: updateUserSchema }),
  userController.updateUser
);

router.patch(
  '/:id/status',
  authorize(Role.ADMIN),
  validateRequest({ params: userIdParamSchema, body: updateStatusSchema }),
  userController.updateStatus
);

router.delete(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest({ params: userIdParamSchema }),
  userController.deleteUser
);

export const userRouter = router;
