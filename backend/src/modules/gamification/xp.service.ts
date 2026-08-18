import { XPActionType } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { GAMIFICATION_CONFIG } from '../../config/gamification.js';
import { AppError } from '../../middleware/errorHandler.middleware.js';

export class XPService {
  async awardXP(params: {
    userId: string;
    actionType: XPActionType;
    amount: number;
    description: string;
    referenceId?: string;
  }) {
    const { userId, actionType, amount, description, referenceId } = params;

    // Idempotency: prevent duplicate XP for the same reference + action
    if (referenceId) {
      const existing = await prisma.xPTransaction.findFirst({
        where: { userId, actionType, referenceId },
      });
      if (existing) {
        return null; // Already awarded — silently skip
      }
    }

    try {
      const transaction = await prisma.xPTransaction.create({
        data: { userId, actionType, amount, description, referenceId },
      });
      return transaction;
    } catch (error) {
      if (
        referenceId &&
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        return null;
      }
      throw error;
    }
  }

  async awardCorrectAnswerXP(userId: string, attemptId: string, correctCount: number) {
    if (correctCount <= 0) return;
    const amount = GAMIFICATION_CONFIG.XP_REWARDS.CORRECT_ANSWER * correctCount;
    await this.awardXP({
      userId,
      actionType: XPActionType.CORRECT_ANSWER,
      amount,
      description: `${correctCount} correct answer(s)`,
      referenceId: `CORRECT_ANSWER:${attemptId}`,
    });
  }

  async awardQuizCompletionXP(userId: string, attemptId: string) {
    await this.awardXP({
      userId,
      actionType: XPActionType.QUIZ_COMPLETION,
      amount: GAMIFICATION_CONFIG.XP_REWARDS.QUIZ_COMPLETION,
      description: 'Quiz completed',
      referenceId: `QUIZ_COMPLETION:${attemptId}`,
    });
  }

  async awardPerfectScoreXP(userId: string, attemptId: string) {
    await this.awardXP({
      userId,
      actionType: XPActionType.PERFECT_SCORE,
      amount: GAMIFICATION_CONFIG.XP_REWARDS.PERFECT_SCORE,
      description: 'Perfect score achieved',
      referenceId: `PERFECT_SCORE:${attemptId}`,
    });
  }

  async awardTopicCompletionXP(userId: string, topicId: string) {
    await this.awardXP({
      userId,
      actionType: XPActionType.TOPIC_COMPLETION,
      amount: GAMIFICATION_CONFIG.XP_REWARDS.TOPIC_COMPLETION,
      description: 'Topic completed',
      referenceId: `TOPIC_COMPLETION:${userId}:${topicId}`,
    });
  }

  async awardUnitCompletionXP(userId: string, unitId: string) {
    await this.awardXP({
      userId,
      actionType: XPActionType.UNIT_COMPLETION,
      amount: GAMIFICATION_CONFIG.XP_REWARDS.UNIT_COMPLETION,
      description: 'Unit completed',
      referenceId: `UNIT_COMPLETION:${userId}:${unitId}`,
    });
  }

  async awardStreakBonusXP(userId: string, streakKey: string) {
    await this.awardXP({
      userId,
      actionType: XPActionType.STREAK_BONUS,
      amount: GAMIFICATION_CONFIG.XP_REWARDS.STREAK_BONUS,
      description: 'Consecutive day streak bonus',
      referenceId: `STREAK_BONUS:${streakKey}`,
    });
  }

  async adminAdjustXP(adminUserId: string, targetUserId: string, amount: number, description: string) {
    if (!description || description.trim().length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Admin XP adjustment requires a description.');
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Target user not found.');
    }

    const transaction = await prisma.xPTransaction.create({
      data: {
        userId: targetUserId,
        actionType: XPActionType.ADMIN_ADJUSTMENT,
        amount,
        description: description.trim(),
        referenceId: `ADMIN_ADJUSTMENT:${adminUserId}:${Date.now()}`,
      },
    });

    return transaction;
  }

  async getTotalXP(userId: string): Promise<number> {
    const result = await prisma.xPTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  async getUserXPTransactions(userId: string) {
    return prisma.xPTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const xpService = new XPService();
