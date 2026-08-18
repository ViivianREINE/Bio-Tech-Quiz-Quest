import { Router } from 'express';
import { Role } from '@prisma/client';
import { learningContentController } from './learning-content.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createContentSchema,
  updateContentSchema,
  contentIdParamSchema,
  topicIdParamSchema,
} from './learning-content.validation.js';

// Top-level /api/content router
const contentRouter = Router();
contentRouter.use(authenticate);

contentRouter.get(
  '/:id',
  validateRequest({ params: contentIdParamSchema }),
  learningContentController.getContentById
);

contentRouter.put(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest({ params: contentIdParamSchema, body: updateContentSchema }),
  learningContentController.updateContent
);

contentRouter.delete(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest({ params: contentIdParamSchema }),
  learningContentController.deleteContent
);

// Topic-nested /api/topics/:topicId/content router
const topicContentRouter = Router({ mergeParams: true });
topicContentRouter.use(authenticate);

topicContentRouter.get(
  '/',
  validateRequest({ params: topicIdParamSchema }),
  learningContentController.getContentByTopic
);

topicContentRouter.post(
  '/',
  authorize(Role.ADMIN),
  validateRequest({ params: topicIdParamSchema, body: createContentSchema }),
  learningContentController.createContent
);

export { contentRouter, topicContentRouter };
