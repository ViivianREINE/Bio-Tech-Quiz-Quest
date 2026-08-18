import { Response, NextFunction } from 'express';
import { learningContentService } from './learning-content.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../types/index.js';

export class LearningContentController {
  async createContent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const topicId = req.params.topicId as string;
      const result = await learningContentService.createContent(topicId, req.body);
      return sendSuccess(res, { content: result }, 'Learning content created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getContentByTopic(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const topicId = req.params.topicId as string;
      const result = await learningContentService.getContentByTopic(topicId, req.user!.role);
      return sendSuccess(res, { contents: result }, 'Learning contents retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getContentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await learningContentService.getContentById(id, req.user!.role);
      return sendSuccess(res, { content: result }, 'Learning content retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateContent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await learningContentService.updateContent(id, req.body);
      return sendSuccess(res, { content: result }, 'Learning content updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteContent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await learningContentService.deleteContent(id);
      return sendSuccess(res, result, 'Learning content deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const learningContentController = new LearningContentController();
