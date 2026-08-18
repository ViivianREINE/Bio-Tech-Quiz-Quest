import { Router } from 'express';
import { Role } from '@prisma/client';
import { quizController } from './quiz.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createQuizSchema,
  updateQuizSchema,
  publishQuizSchema,
  quizIdParamSchema,
  quizQuerySchema,
} from './quiz.validation.js';

const router = Router();

router.use(authenticate);

// Student/Admin view endpoints
router.get('/', validateRequest({ query: quizQuerySchema }), quizController.getQuizzes);
router.get('/:id', validateRequest({ params: quizIdParamSchema }), quizController.getQuizById);

// Admin-only mutation endpoints
router.post(
  '/',
  authorize(Role.ADMIN),
  validateRequest({ body: createQuizSchema }),
  quizController.createQuiz
);

router.put(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest({ params: quizIdParamSchema, body: updateQuizSchema }),
  quizController.updateQuiz
);

router.patch(
  '/:id/publish',
  authorize(Role.ADMIN),
  validateRequest({ params: quizIdParamSchema, body: publishQuizSchema }),
  quizController.publishQuiz
);

router.delete(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest({ params: quizIdParamSchema }),
  quizController.deleteQuiz
);

export const quizRouter = router;
