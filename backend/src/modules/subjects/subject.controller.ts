import { Response, NextFunction } from 'express';
import { subjectService } from './subject.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../types/index.js';
import { ContentStatus } from '@prisma/client';

export class SubjectController {
  async createSubject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await subjectService.createSubject(req.body);
      return sendSuccess(res, { subject: result }, 'Subject created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getSubjects(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const statusFilter = req.query.status as ContentStatus | undefined;
      const result = await subjectService.getSubjects(req.user!.role, statusFilter);
      return sendSuccess(res, { subjects: result }, 'Subjects retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getSubjectById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await subjectService.getSubjectById(id, req.user!.role);
      return sendSuccess(res, { subject: result }, 'Subject retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateSubject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await subjectService.updateSubject(id, req.body);
      return sendSuccess(res, { subject: result }, 'Subject updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async publishSubject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await subjectService.publishSubject(id, req.body);
      return sendSuccess(res, { subject: result }, 'Subject status updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteSubject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await subjectService.deleteSubject(id);
      return sendSuccess(res, result, 'Subject deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const subjectController = new SubjectController();
