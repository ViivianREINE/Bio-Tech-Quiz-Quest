import { Router } from 'express';
import { Role } from '@prisma/client';
import { unitController } from './unit.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  createUnitSchema,
  updateUnitSchema,
  unitIdParamSchema,
  subjectIdParamSchema,
} from './unit.validation.js';

// Top-level /api/units router
const unitRouter = Router();
unitRouter.use(authenticate);

unitRouter.get('/:id', validateRequest({ params: unitIdParamSchema }), unitController.getUnitById);
unitRouter.put(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest({ params: unitIdParamSchema, body: updateUnitSchema }),
  unitController.updateUnit
);
unitRouter.delete(
  '/:id',
  authorize(Role.ADMIN),
  validateRequest({ params: unitIdParamSchema }),
  unitController.deleteUnit
);

// Subject-nested /api/subjects/:subjectId/units router
const subjectUnitRouter = Router({ mergeParams: true });
subjectUnitRouter.use(authenticate);

subjectUnitRouter.get(
  '/',
  validateRequest({ params: subjectIdParamSchema }),
  unitController.getUnitsBySubject
);

subjectUnitRouter.post(
  '/',
  authorize(Role.ADMIN),
  validateRequest({ params: subjectIdParamSchema, body: createUnitSchema }),
  unitController.createUnit
);

export { unitRouter, subjectUnitRouter };
