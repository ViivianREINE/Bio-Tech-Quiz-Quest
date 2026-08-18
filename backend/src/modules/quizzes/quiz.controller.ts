import { Response, NextFunction } from 'express';
import { quizService } from './quiz.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../types/index.js';

export class QuizController {
  async createQuiz(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await quizService.createQuiz(req.body);
      return sendSuccess(res, { quiz: result }, 'Quiz created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getQuizzes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await quizService.getQuizzes(req.user!.role, req.query as any);
      return sendSuccess(res, { quizzes: result }, 'Quizzes retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getQuizById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await quizService.getQuizById(id, req.user!.role);
      return sendSuccess(res, { quiz: result }, 'Quiz retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateQuiz(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await quizService.updateQuiz(id, req.body);
      return sendSuccess(res, { quiz: result }, 'Quiz updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async publishQuiz(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await quizService.publishQuiz(id, req.body);
      return sendSuccess(res, { quiz: result }, 'Quiz status updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteQuiz(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await quizService.deleteQuiz(id);
      return sendSuccess(res, result, 'Quiz deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const quizController = new QuizController();
