import { Router } from 'express';
import { Role } from '@prisma/client';
import { subjectController } from './subject.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createSubjectSchema,
  updateSubjectSchema,
  publishSubjectSchema,
  subjectIdParamSchema,
} from './subject.validation.js';

const router = Router();

// All subject routes require authentication
router.use(authenticate);

// Public/student-accessible read endpoints
router.get('/', subjectController.getSubjects);
router.get('/:id', validateRequest({ params: subjectIdParamSchema }), subjectController.getSubjectById);

// Admin-only mutation endpoints
router.post(
  '/',
  authorize(Role.ADMIN),
  validateRequest({ body: createSubjectSchema }),
  subjectController.createSubject
);

router.put(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest({ params: subjectIdParamSchema, body: updateSubjectSchema }),
  subjectController.updateSubject
);

router.patch(
  '/:id/publish',
  authorize(Role.ADMIN),
  validateRequest({ params: subjectIdParamSchema, body: publishSubjectSchema }),
  subjectController.publishSubject
);

router.delete(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest({ params: subjectIdParamSchema }),
  subjectController.deleteSubject
);

export const subjectRouter = router;
