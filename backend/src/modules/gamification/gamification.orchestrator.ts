import { AttemptStatus } from '@prisma/client';
import { progressService } from '../progress/progress.service.js';
import { xpService } from './xp.service.js';
import { badgeService } from './badge.service.js';
import { GAMIFICATION_CONFIG } from '../../config/gamification.js';

/**
 * GamificationOrchestrator: called once per finalized attempt.
 * Handles all side-effects: progress, XP, badges, streak — in the correct order.
 * All operations are idempotent; safe to re-call.
 */
export class GamificationOrchestrator {
  async processAttempt(userId: string, attemptId: string, attempt: {
    correctCount: number;
    percentage: number;
    status: AttemptStatus;
  }) {
    if (
      attempt.status !== AttemptStatus.COMPLETED &&
      attempt.status !== AttemptStatus.EXPIRED
    ) {
      return; // Only process finalized attempts
    }

    // 1. Recalculate progress at all scopes
    await progressService.recalculateAfterAttempt(userId, attemptId);

    // 2. Award XP — all idempotent via referenceId
    await xpService.awardCorrectAnswerXP(userId, attemptId, attempt.correctCount);
    await xpService.awardQuizCompletionXP(userId, attemptId);
    if (attempt.percentage === 100) {
      await xpService.awardPerfectScoreXP(userId, attemptId);
    }

    // 3. Evaluate and award badges
    await badgeService.evaluateAfterAttempt(userId, attemptId);

    // 4. Streak evaluation
    const { hasStreak, streakKey } = await badgeService.evaluateStreak(
      userId,
      (GAMIFICATION_CONFIG.DEFAULT_BADGES.find((b) => b.code === 'STREAK')?.criteria as any)?.days ?? 2
    );
    if (hasStreak && streakKey) {
      await xpService.awardStreakBonusXP(userId, streakKey);
      await badgeService.awardBadge(userId, 'STREAK');
    }
  }
}

export const gamificationOrchestrator = new GamificationOrchestrator();
