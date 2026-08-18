import { Response, NextFunction } from 'express';
import { unitService } from './unit.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../types/index.js';

export class UnitController {
  async createUnit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const subjectId = req.params.subjectId as string;
      const result = await unitService.createUnit(subjectId, req.body);
      return sendSuccess(res, { unit: result }, 'Unit created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getUnitsBySubject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const subjectId = req.params.subjectId as string;
      const result = await unitService.getUnitsBySubject(subjectId, req.user!.role);
      return sendSuccess(res, { units: result }, 'Units retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getUnitById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await unitService.getUnitById(id, req.user!.role);
      return sendSuccess(res, { unit: result }, 'Unit retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateUnit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await unitService.updateUnit(id, req.body);
      return sendSuccess(res, { unit: result }, 'Unit updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteUnit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await unitService.deleteUnit(id);
      return sendSuccess(res, result, 'Unit deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const unitController = new UnitController();
