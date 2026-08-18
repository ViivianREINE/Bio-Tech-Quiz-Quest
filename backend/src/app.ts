import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { sendSuccess, sendError } from './utils/apiResponse.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { userRouter } from './modules/users/user.routes.js';
import { subjectRouter } from './modules/subjects/subject.routes.js';
import { unitRouter, subjectUnitRouter } from './modules/units/unit.routes.js';
import { topicRouter, unitTopicRouter } from './modules/topics/topic.routes.js';
import { contentRouter, topicContentRouter } from './modules/learning-content/learning-content.routes.js';
import { quizRouter } from './modules/quizzes/quiz.routes.js';
import { questionRouter, quizQuestionRouter } from './modules/questions/question.routes.js';
import { attemptRouter, quizAttemptRouter } from './modules/attempts/attempt.routes.js';
import { progressRouter } from './modules/progress/progress.routes.js';
import { gamificationRouter } from './modules/gamification/gamification.routes.js';
import { leaderboardRouter } from './modules/leaderboard/leaderboard.routes.js';
import { badgeService } from './modules/gamification/badge.service.js';
import { GAMIFICATION_CONFIG } from './config/gamification.js';
import { adminRouter } from './modules/admin/analytics/analytics.routes.js';

export const createApp = (): Express => {
  const app = express();

  // Security Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL === '*' ? '*' : [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Parsing Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/subjects', subjectRouter);
  app.use('/api/subjects/:subjectId/units', subjectUnitRouter);
  app.use('/api/units', unitRouter);
  app.use('/api/units/:unitId/topics', unitTopicRouter);
  app.use('/api/topics', topicRouter);
  app.use('/api/topics/:topicId/content', topicContentRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/quizzes', quizRouter);
  app.use('/api/quizzes/:quizId/questions', quizQuestionRouter);
  app.use('/api/quizzes/:quizId', quizAttemptRouter);
  app.use('/api/questions', questionRouter);
  app.use('/api/attempts', attemptRouter);
  app.use('/api/progress', progressRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/gamification', gamificationRouter);
  app.use('/api/leaderboard', leaderboardRouter);

  // Seed default badges on startup (idempotent upsert)
  badgeService.seedBadges(GAMIFICATION_CONFIG.DEFAULT_BADGES).catch((err) =>
    console.error('[Badge Seeder] Failed to seed badges:', err)
  );

  // Health Endpoint
  const healthHandler = async (_req: Request, res: Response) => {
    try {
      // Test DB connection with a lightweight query
      await prisma.$queryRaw`SELECT 1`;
      return sendSuccess(
        res,
        {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: 'connected',
          uptime: process.uptime(),
          environment: env.NODE_ENV,
          service: 'bio-tech-quiz-quest-api',
        },
        'System is healthy'
      );
    } catch (error) {
      return sendError(
        res,
        503,
        'SERVICE_UNAVAILABLE',
        'Database connection failed',
        error instanceof Error ? error.message : 'Unknown database error'
      );
    }
  };

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  // 404 Handler for undefined routes
  app.use((req: Request, res: Response) => {
    return sendError(res, 404, 'NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`);
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
