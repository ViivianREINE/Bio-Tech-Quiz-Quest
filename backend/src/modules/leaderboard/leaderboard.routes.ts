import { Router } from 'express';
import { leaderboardController } from './leaderboard.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const leaderboardRouter = Router();
leaderboardRouter.use(authenticate);
leaderboardRouter.get('/', leaderboardController.getGlobalLeaderboard);

export { leaderboardRouter };
