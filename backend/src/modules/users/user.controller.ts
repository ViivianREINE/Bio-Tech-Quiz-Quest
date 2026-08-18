import { Response, NextFunction } from 'express';
import { userService } from './user.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../types/index.js';

export class UserController {
  async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await userService.getUsers(req.query as any);
      return sendSuccess(res, result, 'Users retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const user = await userService.getUserById(id);
      return sendSuccess(res, { user }, 'User retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const updated = await userService.updateUser(
        id,
        req.body,
        req.user!.role,
        req.user!.id
      );
      return sendSuccess(res, { user: updated }, 'User updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const updated = await userService.updateStatus(id, req.body);
      return sendSuccess(res, { user: updated }, 'User status updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await userService.deleteUser(id);
      return sendSuccess(res, result, 'User deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
