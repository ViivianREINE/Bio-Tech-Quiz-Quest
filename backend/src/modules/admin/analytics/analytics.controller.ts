import { NextFunction, Response } from 'express';
import { adminAnalyticsService } from './analytics.service.js';
import { AuthRequest } from '../../../types/index.js';
import { sendSuccess } from '../../../utils/apiResponse.js';

export class AdminAnalyticsController {
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const summary = await adminAnalyticsService.getDashboardSummary(req.query as any);
      return sendSuccess(res, summary, 'Admin analytics dashboard retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getUserAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await adminAnalyticsService.getUserAnalytics();
      return sendSuccess(res, data, 'User analytics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getSubjectAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await adminAnalyticsService.getSubjectAnalytics(req.query as any);
      return sendSuccess(res, data, 'Subject analytics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getQuizAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await adminAnalyticsService.getQuizAnalytics(req.query as any);
      return sendSuccess(res, data, 'Quiz analytics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getQuestionAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await adminAnalyticsService.getQuestionAnalytics(req.query as any);
      return sendSuccess(res, data, 'Question analytics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getTopPerformers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await adminAnalyticsService.getTopPerformers();
      return sendSuccess(res, data, 'Top performers retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getPopularContent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await adminAnalyticsService.getPopularContent();
      return sendSuccess(res, data, 'Popular content retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getAttempts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminAnalyticsService.getAttempts(req.query as any);
      return sendSuccess(res, result, 'Admin attempts retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getAttemptDetail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminAnalyticsService.getAttemptDetail(req.params.id as string);
      return sendSuccess(res, result, 'Attempt details retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getStudentPerformance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminAnalyticsService.getStudentPerformance(req.params.id as string);
      return sendSuccess(res, result, 'Student performance retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const adminAnalyticsController = new AdminAnalyticsController();
