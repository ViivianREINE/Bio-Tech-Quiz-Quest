import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { authorize } from '../../../middleware/role.middleware.js';
import { validateRequest } from '../../../middleware/validate.middleware.js';
import { adminAnalyticsController } from './analytics.controller.js';
import {
  adminAttemptIdParamSchema,
  adminAttemptQuerySchema,
  adminDateRangeQuerySchema,
  studentPerformanceParamSchema,
} from './analytics.validation.js';

const router = Router();
router.use(authenticate);
router.use(authorize(Role.ADMIN));

router.get(
  '/analytics',
  validateRequest({ query: adminDateRangeQuerySchema }),
  adminAnalyticsController.getDashboard
);
router.get('/analytics/users', adminAnalyticsController.getUserAnalytics);
router.get(
  '/analytics/subjects',
  validateRequest({ query: adminDateRangeQuerySchema }),
  adminAnalyticsController.getSubjectAnalytics
);
router.get(
  '/analytics/quizzes',
  validateRequest({ query: adminDateRangeQuerySchema }),
  adminAnalyticsController.getQuizAnalytics
);
router.get(
  '/analytics/questions',
  validateRequest({ query: adminDateRangeQuerySchema }),
  adminAnalyticsController.getQuestionAnalytics
);
router.get('/analytics/top-performers', adminAnalyticsController.getTopPerformers);
router.get('/analytics/popular-content', adminAnalyticsController.getPopularContent);
router.get(
  '/attempts',
  validateRequest({ query: adminAttemptQuerySchema }),
  adminAnalyticsController.getAttempts
);
router.get(
  '/attempts/:id',
  validateRequest({ params: adminAttemptIdParamSchema }),
  adminAnalyticsController.getAttemptDetail
);
router.get(
  '/students/:id/performance',
  validateRequest({ params: studentPerformanceParamSchema }),
  adminAnalyticsController.getStudentPerformance
);

export const adminRouter = router;
