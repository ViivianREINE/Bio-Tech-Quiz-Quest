import { Response, NextFunction } from 'express';
import { leaderboardService } from './leaderboard.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../types/index.js';

export class LeaderboardController {
  async getGlobalLeaderboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const rankings = await leaderboardService.getGlobalLeaderboard(limit);
      return sendSuccess(res, { rankings, total: rankings.length }, 'Leaderboard retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const leaderboardController = new LeaderboardController();
