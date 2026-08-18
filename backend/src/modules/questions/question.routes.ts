import { Router } from 'express';
import { Role } from '@prisma/client';
import { questionController } from './question.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createQuestionSchema,
  updateQuestionSchema,
  questionIdParamSchema,
  quizIdParamSchema,
} from './question.validation.js';

// Top-level /api/questions router
const questionRouter = Router();
questionRouter.use(authenticate);

questionRouter.put(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest({ params: questionIdParamSchema, body: updateQuestionSchema }),
  questionController.updateQuestion
);

questionRouter.delete(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest({ params: questionIdParamSchema }),
  questionController.deleteQuestion
);

// Quiz-nested /api/quizzes/:quizId/questions router
const quizQuestionRouter = Router({ mergeParams: true });
quizQuestionRouter.use(authenticate);

quizQuestionRouter.get(
  '/',
  validateRequest({ params: quizIdParamSchema }),
  questionController.getQuestionsByQuiz
);

quizQuestionRouter.post(
  '/',
  authorize(Role.ADMIN),
  validateRequest({ params: quizIdParamSchema, body: createQuestionSchema }),
  questionController.createQuestion
);

export { questionRouter, quizQuestionRouter };
