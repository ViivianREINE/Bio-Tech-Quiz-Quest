import { Response, NextFunction } from 'express';
import { xpService } from './xp.service.js';
import { badgeService } from './badge.service.js';
import { calculateLevel } from './level.calculator.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../types/index.js';

export class GamificationController {
  async getMyXP(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const totalXP = await xpService.getTotalXP(userId);
      const level = calculateLevel(totalXP);
      const transactions = await xpService.getUserXPTransactions(userId);
      return sendSuccess(res, { totalXP, level, transactions }, 'XP data retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getMyBadges(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const badges = await badgeService.getUserBadges(req.user!.id);
      return sendSuccess(res, { badges }, 'Badges retrieved');
    } catch (error) {
      next(error);
    }
  }

  async adminAdjustXP(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { targetUserId, amount, description } = req.body;
      const transaction = await xpService.adminAdjustXP(req.user!.id, targetUserId, amount, description);
      return sendSuccess(res, { transaction }, 'XP adjustment applied', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const gamificationController = new GamificationController();
