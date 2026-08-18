import { Response, NextFunction } from 'express';
import { progressService } from './progress.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../types/index.js';

export class ProgressController {
  async getMyProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await progressService.getProgressForUser(req.user!, req.user!.id);
      return sendSuccess(res, { progress: result }, 'Progress retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSubjectProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await progressService.getSubjectProgress(req.user!, req.params.subjectId as string);
      return sendSuccess(res, { progress: result }, 'Subject progress retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getUnitProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await progressService.getUnitProgress(req.user!, req.params.unitId as string);
      return sendSuccess(res, { progress: result }, 'Unit progress retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getTopicProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await progressService.getTopicProgress(req.user!, req.params.topicId as string);
      return sendSuccess(res, { progress: result }, 'Topic progress retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getQuizProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await progressService.getQuizProgress(req.user!, req.params.quizId as string);
      return sendSuccess(res, { progress: result }, 'Quiz progress retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const progressController = new ProgressController();
