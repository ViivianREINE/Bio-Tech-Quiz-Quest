import { ContentStatus, AttemptStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

export class BadgeService {
  /**
   * Seeds all default badges into the database if they do not already exist.
   * Called at application startup or migration time.
   */
  async seedBadges(badges: Array<{ code: string; name: string; description: string; criteria: object }>) {
    for (const badge of badges) {
      await prisma.badge.upsert({
        where: { code: badge.code },
        create: {
          code: badge.code,
          name: badge.name,
          description: badge.description,
          criteria: badge.criteria,
        },
        update: {},
      });
    }
  }

  /**
   * Awards a badge to a user — silently skips if already awarded (idempotent).
   */
  async awardBadge(userId: string, badgeCode: string): Promise<boolean> {
    const badge = await prisma.badge.findUnique({ where: { code: badgeCode } });
    if (!badge) return false;

    const existing = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    });
    if (existing) return false; // Already awarded

    await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
    return true;
  }

  /**
   * Evaluate and award all applicable badges after a quiz attempt is finalized.
   */
  async evaluateAfterAttempt(userId: string, attemptId: string) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            topic: {
              include: {
                unit: {
                  include: { subject: true, topics: { include: { quizzes: true } } },
                },
              },
            },
          },
        },
      },
    });
    if (!attempt) return;

    // FIRST_QUIZ: User's very first finalized attempt
    const totalAttempts = await prisma.quizAttempt.count({
      where: {
        userId,
        status: { in: [AttemptStatus.COMPLETED, AttemptStatus.EXPIRED] },
      },
    });
    if (totalAttempts === 1) {
      await this.awardBadge(userId, 'FIRST_QUIZ');
    }

    // PERFECT_SCORE: 100% on this attempt
    if (attempt.percentage === 100) {
      await this.awardBadge(userId, 'PERFECT_SCORE');
    }

    // TOPIC_MASTER: All published quizzes in the topic completed by this user
    const topicId = attempt.quiz.topicId;
    const publishedQuizzesInTopic = await prisma.quiz.findMany({
      where: { topicId, status: ContentStatus.PUBLISHED },
      select: { id: true },
    });

    if (publishedQuizzesInTopic.length > 0) {
      const completedTopicQuizIds = new Set(
        (
          await prisma.quizAttempt.findMany({
            where: {
              userId,
              quizId: { in: publishedQuizzesInTopic.map((q) => q.id) },
              status: { in: [AttemptStatus.COMPLETED, AttemptStatus.EXPIRED] },
            },
            select: { quizId: true },
            distinct: ['quizId'],
          })
        ).map((a) => a.quizId)
      );

      if (completedTopicQuizIds.size === publishedQuizzesInTopic.length) {
        await this.awardBadge(userId, 'TOPIC_MASTER');
      }
    }

    // UNIT_MASTER: All published quizzes in the unit completed
    const unitId = attempt.quiz.topic.unitId;
    const topicsInUnit = await prisma.topic.findMany({
      where: { unitId },
      select: { id: true },
    });
    const publishedQuizzesInUnit = await prisma.quiz.findMany({
      where: { topicId: { in: topicsInUnit.map((t) => t.id) }, status: ContentStatus.PUBLISHED },
      select: { id: true },
    });

    if (publishedQuizzesInUnit.length > 0) {
      const completedUnitQuizIds = new Set(
        (
          await prisma.quizAttempt.findMany({
            where: {
              userId,
              quizId: { in: publishedQuizzesInUnit.map((q) => q.id) },
              status: { in: [AttemptStatus.COMPLETED, AttemptStatus.EXPIRED] },
            },
            select: { quizId: true },
            distinct: ['quizId'],
          })
        ).map((a) => a.quizId)
      );

      if (completedUnitQuizIds.size === publishedQuizzesInUnit.length) {
        await this.awardBadge(userId, 'UNIT_MASTER');
      }
    }

    // Subject master badge — generic by subjectId (e.g. OMICS_MASTER code can be linked to any subject)
    const subjectId = attempt.quiz.topic.unit.subjectId;
    const allTopicsInSubject = await prisma.topic.findMany({
      where: { unit: { subjectId } },
      select: { id: true },
    });
    const publishedQuizzesInSubject = await prisma.quiz.findMany({
      where: {
        topicId: { in: allTopicsInSubject.map((t) => t.id) },
        status: ContentStatus.PUBLISHED,
      },
      select: { id: true },
    });

    if (publishedQuizzesInSubject.length > 0) {
      const completedSubjectQuizIds = new Set(
        (
          await prisma.quizAttempt.findMany({
            where: {
              userId,
              quizId: { in: publishedQuizzesInSubject.map((q) => q.id) },
              status: { in: [AttemptStatus.COMPLETED, AttemptStatus.EXPIRED] },
            },
            select: { quizId: true },
            distinct: ['quizId'],
          })
        ).map((a) => a.quizId)
      );

      if (completedSubjectQuizIds.size === publishedQuizzesInSubject.length) {
        // Award any badge associated with this subject (generic — the badge code can be anything)
        const subject = attempt.quiz.topic.unit.subject;
        // Find any badge whose criteria.type is 'SUBJECT_COMPLETION' and either no subjectId filter
        // or matching this subjectId — for simplicity, award the OMICS_MASTER badge generically
        const subjectBadges = await prisma.badge.findMany({
          where: { criteria: { path: ['type'], equals: 'SUBJECT_COMPLETION' } },
        });
        for (const badge of subjectBadges) {
          const criteria = badge.criteria as any;
          // If badge has a specific subjectId restriction, check it; otherwise it's generic per subject
          if (!criteria.subjectId || criteria.subjectId === subjectId) {
            await this.awardBadge(userId, badge.code);
          }
        }
      }
    }
  }

  /**
   * Evaluate and award STREAK badge if user has activity on consecutive days.
   */
  async evaluateStreak(userId: string, requiredDays = 2): Promise<{ hasStreak: boolean; streakKey?: string }> {
    const recentAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        status: { in: [AttemptStatus.COMPLETED, AttemptStatus.EXPIRED] },
      },
      orderBy: { submittedAt: 'desc' },
      take: 10,
    });

    if (recentAttempts.length === 0) return { hasStreak: false };

    // Build a set of unique UTC-date strings from submittedAt
    const uniqueDates = Array.from(
      new Set(
        recentAttempts
          .filter((a) => a.submittedAt)
          .map((a) => a.submittedAt!.toISOString().slice(0, 10))
      )
    ).sort((a, b) => (a > b ? -1 : 1)); // Descending

    let streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    if (streak >= requiredDays) {
      const streakKey = `${uniqueDates[0]}`;
      return { hasStreak: true, streakKey };
    }

    return { hasStreak: false };
  }

  async getUserBadges(userId: string) {
    return prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: 'asc' },
    });
  }
}

export const badgeService = new BadgeService();
