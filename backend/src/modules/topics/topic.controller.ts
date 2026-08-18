import { Response, NextFunction } from 'express';
import { topicService } from './topic.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../types/index.js';

export class TopicController {
  async createTopic(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const unitId = req.params.unitId as string;
      const result = await topicService.createTopic(unitId, req.body);
      return sendSuccess(res, { topic: result }, 'Topic created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getTopicsByUnit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const unitId = req.params.unitId as string;
      const result = await topicService.getTopicsByUnit(unitId, req.user!.role);
      return sendSuccess(res, { topics: result }, 'Topics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getTopicById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await topicService.getTopicById(id, req.user!.role);
      return sendSuccess(res, { topic: result }, 'Topic retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateTopic(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await topicService.updateTopic(id, req.body);
      return sendSuccess(res, { topic: result }, 'Topic updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteTopic(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await topicService.deleteTopic(id);
      return sendSuccess(res, result, 'Topic deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const topicController = new TopicController();
