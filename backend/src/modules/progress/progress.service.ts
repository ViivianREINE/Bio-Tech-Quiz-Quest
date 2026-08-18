import { ContentStatus, AttemptStatus, ProgressScope } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.middleware.js';
import { AuthenticatedUser } from '../../types/index.js';
import { Role } from '@prisma/client';

export class ProgressService {
  /**
   * Recalculates and upserts UserProgress records for the quiz, topic, unit and subject
   * after any finalized quiz attempt. Safe to call multiple times (idempotent).
   */
  async recalculateAfterAttempt(userId: string, attemptId: string) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            topic: {
              include: { unit: { include: { subject: true } } },
            },
          },
        },
      },
    });

    if (!attempt) return;

    const { quizId, quiz } = attempt;
    const topicId = quiz.topicId;
    const unitId = quiz.topic.unitId;
    const subjectId = quiz.topic.unit.subjectId;

    await Promise.all([
      this.recalculateQuizProgress(userId, quizId),
      this.recalculateTopicProgress(userId, topicId),
      this.recalculateUnitProgress(userId, unitId),
      this.recalculateSubjectProgress(userId, subjectId),
    ]);
  }

  private async recalculateQuizProgress(userId: string, quizId: string) {
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        quizId,
        status: { in: [AttemptStatus.COMPLETED, AttemptStatus.EXPIRED] },
      },
      select: { percentage: true, submittedAt: true },
    });

    if (attempts.length === 0) return;

    const quizzesAttempted = attempts.length;
    const quizzesCompleted = attempts.length;
    const scores = attempts.map((a) => a.percentage);
    const averageScore = scores.reduce((s, v) => s + v, 0) / scores.length;
    const highestScore = Math.max(...scores);
    // Quiz is "complete" once it has at least one finalized attempt; percentage = 100 if passed
    const completionPercentage = quizzesCompleted > 0 ? 100.0 : 0;
    const lastActivityAt = attempts
      .map((a) => a.submittedAt)
      .filter(Boolean)
      .sort((a, b) => b!.getTime() - a!.getTime())[0] ?? new Date();

    await prisma.userProgress.upsert({
      where: { userId_scopeType_scopeId: { userId, scopeType: ProgressScope.QUIZ, scopeId: quizId } },
      create: {
        userId,
        scopeType: ProgressScope.QUIZ,
        scopeId: quizId,
        quizId,
        quizzesAttempted,
        quizzesCompleted,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore: Math.round(highestScore * 100) / 100,
        completionPercentage,
        lastActivityAt,
      },
      update: {
        quizzesAttempted,
        quizzesCompleted,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore: Math.round(highestScore * 100) / 100,
        completionPercentage,
        lastActivityAt,
      },
    });
  }

  private async recalculateTopicProgress(userId: string, topicId: string) {
    const publishedQuizzes = await prisma.quiz.findMany({
      where: { topicId, status: ContentStatus.PUBLISHED },
      select: { id: true },
    });
    const total = publishedQuizzes.length;

    const completedAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        quizId: { in: publishedQuizzes.map((q) => q.id) },
        status: { in: [AttemptStatus.COMPLETED, AttemptStatus.EXPIRED] },
      },
      select: { quizId: true, percentage: true, submittedAt: true },
      distinct: ['quizId'],
    });

    const quizzesCompleted = completedAttempts.length;
    const scores = completedAttempts.map((a) => a.percentage);
    const averageScore = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const completionPercentage = total > 0 ? (quizzesCompleted / total) * 100 : 0;
    const lastActivityAt = completedAttempts
      .map((a) => a.submittedAt)
      .filter(Boolean)
      .sort((a, b) => b!.getTime() - a!.getTime())[0] ?? new Date();

    await prisma.userProgress.upsert({
      where: { userId_scopeType_scopeId: { userId, scopeType: ProgressScope.TOPIC, scopeId: topicId } },
      create: {
        userId,
        scopeType: ProgressScope.TOPIC,
        scopeId: topicId,
        topicId,
        quizzesAttempted: quizzesCompleted,
        quizzesCompleted,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore: Math.round(highestScore * 100) / 100,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        lastActivityAt,
      },
      update: {
        quizzesAttempted: quizzesCompleted,
        quizzesCompleted,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore: Math.round(highestScore * 100) / 100,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        lastActivityAt,
      },
    });
  }

  private async recalculateUnitProgress(userId: string, unitId: string) {
    const topics = await prisma.topic.findMany({ where: { unitId }, select: { id: true } });
    const publishedQuizzes = await prisma.quiz.findMany({
      where: { topicId: { in: topics.map((t) => t.id) }, status: ContentStatus.PUBLISHED },
      select: { id: true },
    });
    const total = publishedQuizzes.length;

    const completedAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        quizId: { in: publishedQuizzes.map((q) => q.id) },
        status: { in: [AttemptStatus.COMPLETED, AttemptStatus.EXPIRED] },
      },
      select: { quizId: true, percentage: true, submittedAt: true },
      distinct: ['quizId'],
    });

    const quizzesCompleted = completedAttempts.length;
    const scores = completedAttempts.map((a) => a.percentage);
    const averageScore = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const completionPercentage = total > 0 ? (quizzesCompleted / total) * 100 : 0;
    const lastActivityAt = completedAttempts
      .map((a) => a.submittedAt)
      .filter(Boolean)
      .sort((a, b) => b!.getTime() - a!.getTime())[0] ?? new Date();

    await prisma.userProgress.upsert({
      where: { userId_scopeType_scopeId: { userId, scopeType: ProgressScope.UNIT, scopeId: unitId } },
      create: {
        userId,
        scopeType: ProgressScope.UNIT,
        scopeId: unitId,
        unitId,
        quizzesAttempted: quizzesCompleted,
        quizzesCompleted,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore: Math.round(highestScore * 100) / 100,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        lastActivityAt,
      },
      update: {
        quizzesAttempted: quizzesCompleted,
        quizzesCompleted,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore: Math.round(highestScore * 100) / 100,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        lastActivityAt,
      },
    });
  }

  private async recalculateSubjectProgress(userId: string, subjectId: string) {
    const allTopics = await prisma.topic.findMany({
      where: { unit: { subjectId } },
      select: { id: true },
    });
    const publishedQuizzes = await prisma.quiz.findMany({
      where: {
        topicId: { in: allTopics.map((t) => t.id) },
        status: ContentStatus.PUBLISHED,
      },
      select: { id: true },
    });
    const total = publishedQuizzes.length;

    const completedAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        quizId: { in: publishedQuizzes.map((q) => q.id) },
        status: { in: [AttemptStatus.COMPLETED, AttemptStatus.EXPIRED] },
      },
      select: { quizId: true, percentage: true, submittedAt: true },
      distinct: ['quizId'],
    });

    const quizzesCompleted = completedAttempts.length;
    const scores = completedAttempts.map((a) => a.percentage);
    const averageScore = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const completionPercentage = total > 0 ? (quizzesCompleted / total) * 100 : 0;
    const lastActivityAt = completedAttempts
      .map((a) => a.submittedAt)
      .filter(Boolean)
      .sort((a, b) => b!.getTime() - a!.getTime())[0] ?? new Date();

    await prisma.userProgress.upsert({
      where: { userId_scopeType_scopeId: { userId, scopeType: ProgressScope.SUBJECT, scopeId: subjectId } },
      create: {
        userId,
        scopeType: ProgressScope.SUBJECT,
        scopeId: subjectId,
        subjectId,
        quizzesAttempted: quizzesCompleted,
        quizzesCompleted,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore: Math.round(highestScore * 100) / 100,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        lastActivityAt,
      },
      update: {
        quizzesAttempted: quizzesCompleted,
        quizzesCompleted,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore: Math.round(highestScore * 100) / 100,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        lastActivityAt,
      },
    });
  }

  async getProgressForUser(user: AuthenticatedUser, targetUserId: string) {
    if (user.role !== Role.ADMIN && user.id !== targetUserId) {
      throw new AppError(403, 'FORBIDDEN', "Cannot access another user's progress.");
    }
    return prisma.userProgress.findMany({ where: { userId: targetUserId } });
  }

  async getSubjectProgress(user: AuthenticatedUser, subjectId: string) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Subject not found.');
    return prisma.userProgress.findFirst({
      where: { userId: user.id, scopeType: ProgressScope.SUBJECT, scopeId: subjectId },
    });
  }

  async getUnitProgress(user: AuthenticatedUser, unitId: string) {
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new AppError(404, 'UNIT_NOT_FOUND', 'Unit not found.');
    return prisma.userProgress.findFirst({
      where: { userId: user.id, scopeType: ProgressScope.UNIT, scopeId: unitId },
    });
  }

  async getTopicProgress(user: AuthenticatedUser, topicId: string) {
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic) throw new AppError(404, 'TOPIC_NOT_FOUND', 'Topic not found.');
    return prisma.userProgress.findFirst({
      where: { userId: user.id, scopeType: ProgressScope.TOPIC, scopeId: topicId },
    });
  }

  async getQuizProgress(user: AuthenticatedUser, quizId: string) {
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new AppError(404, 'QUIZ_NOT_FOUND', 'Quiz not found.');
    return prisma.userProgress.findFirst({
      where: { userId: user.id, scopeType: ProgressScope.QUIZ, scopeId: quizId },
    });
  }
}

export const progressService = new ProgressService();
