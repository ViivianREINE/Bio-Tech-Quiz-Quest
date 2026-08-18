import { Response, NextFunction } from 'express';
import { questionService } from './question.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../types/index.js';

export class QuestionController {
  async createQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quizId = req.params.quizId as string;
      const result = await questionService.createQuestion(quizId, req.body);
      return sendSuccess(res, { question: result }, 'Question created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getQuestionsByQuiz(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quizId = req.params.quizId as string;
      const result = await questionService.getQuestionsByQuiz(quizId, req.user!.role);
      return sendSuccess(res, { questions: result }, 'Questions retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await questionService.updateQuestion(id, req.body);
      return sendSuccess(res, { question: result }, 'Question updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await questionService.deleteQuestion(id);
      return sendSuccess(res, result, 'Question deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const questionController = new QuestionController();
