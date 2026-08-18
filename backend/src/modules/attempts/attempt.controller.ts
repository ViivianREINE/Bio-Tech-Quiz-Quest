import { Response, NextFunction } from 'express';
import { attemptService } from './attempt.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../types/index.js';

export class AttemptController {
  async startQuiz(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quizId = req.params.quizId as string;
      const result = await attemptService.startQuizAttempt(quizId, req.user!);
      return sendSuccess(res, result, 'Quiz attempt started successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async submitQuizByQuizId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quizId = req.params.quizId as string;
      const result = await attemptService.submitAttemptByQuizId(quizId, req.user!, req.body);
      return sendSuccess(res, { result }, 'Quiz submitted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async submitAttempt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const attemptId = req.params.id as string;
      const result = await attemptService.submitAttempt(attemptId, req.user!, req.body);
      return sendSuccess(res, { result }, 'Quiz attempt submitted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getAttempts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await attemptService.getAttempts(req.user!, req.query as any);
      return sendSuccess(res, result, 'Attempts retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getAttemptById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await attemptService.getAttemptById(id, req.user!);
      return sendSuccess(res, { attempt: result }, 'Attempt retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const attemptController = new AttemptController();
