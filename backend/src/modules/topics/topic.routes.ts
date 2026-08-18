import { Router } from 'express';
import { Role } from '@prisma/client';
import { topicController } from './topic.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createTopicSchema,
  updateTopicSchema,
  topicIdParamSchema,
  unitIdParamSchema,
} from './topic.validation.js';

// Top-level /api/topics router
const topicRouter = Router();
topicRouter.use(authenticate);

topicRouter.get('/:id', validateRequest({ params: topicIdParamSchema }), topicController.getTopicById);
topicRouter.put(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest({ params: topicIdParamSchema, body: updateTopicSchema }),
  topicController.updateTopic
);
topicRouter.delete(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest({ params: topicIdParamSchema }),
  topicController.deleteTopic
);

// Unit-nested /api/units/:unitId/topics router
const unitTopicRouter = Router({ mergeParams: true });
unitTopicRouter.use(authenticate);

unitTopicRouter.get(
  '/',
  validateRequest({ params: unitIdParamSchema }),
  topicController.getTopicsByUnit
);

unitTopicRouter.post(
  '/',
  authorize(Role.ADMIN),
  validateRequest({ params: unitIdParamSchema, body: createTopicSchema }),
  topicController.createTopic
);

export { topicRouter, unitTopicRouter };
