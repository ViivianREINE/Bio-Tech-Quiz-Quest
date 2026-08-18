import { Router } from 'express';
import { progressController } from './progress.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const progressRouter = Router();
progressRouter.use(authenticate);

progressRouter.get('/', progressController.getMyProgress);
progressRouter.get('/subjects/:subjectId', progressController.getSubjectProgress);
progressRouter.get('/units/:unitId', progressController.getUnitProgress);
progressRouter.get('/topics/:topicId', progressController.getTopicProgress);
progressRouter.get('/quizzes/:quizId', progressController.getQuizProgress);

export { progressRouter };
