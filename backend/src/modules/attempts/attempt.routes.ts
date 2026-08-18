import { Router } from 'express';
import { attemptController } from './attempt.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  submitQuizSchema,
  attemptIdParamSchema,
  quizIdParamSchema,
  attemptQuerySchema,
} from './attempt.validation.js';

// Top-level /api/attempts router
const attemptRouter = Router();
attemptRouter.use(authenticate);

attemptRouter.get('/', validateRequest({ query: attemptQuerySchema }), attemptController.getAttempts);
attemptRouter.get('/:id', validateRequest({ params: attemptIdParamSchema }), attemptController.getAttemptById);
attemptRouter.post(
  '/:id/submit',
  validateRequest({ params: attemptIdParamSchema, body: submitQuizSchema }),
  attemptController.submitAttempt
);

// Quiz-nested attempt actions: /api/quizzes/:quizId/start and /api/quizzes/:quizId/submit
const quizAttemptRouter = Router({ mergeParams: true });
quizAttemptRouter.use(authenticate);

quizAttemptRouter.post(
  '/start',
  validateRequest({ params: quizIdParamSchema }),
  attemptController.startQuiz
);

quizAttemptRouter.post(
  '/submit',
  validateRequest({ params: quizIdParamSchema, body: submitQuizSchema }),
  attemptController.submitQuizByQuizId
);

export { attemptRouter, quizAttemptRouter };
