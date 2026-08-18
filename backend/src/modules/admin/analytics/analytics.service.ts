import {
  AttemptStatus,
  ContentStatus,
  Prisma,
  ProgressScope,
  Role,
  UserStatus,
} from '@prisma/client';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../middleware/errorHandler.middleware.js';
import { calculateLevel } from '../../gamification/level.calculator.js';
import type { AdminAttemptQueryParams, AdminDateRangeQuery } from './analytics.validation.js';

const FINALIZED_STATUSES: AttemptStatus[] = [AttemptStatus.COMPLETED, AttemptStatus.EXPIRED];

function round2(value: number | null | undefined): number {
  return Number((value ?? 0).toFixed(2));
}

function buildStartedAtFilter(from?: Date, to?: Date): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
}

function computeRates(total: number, passCount: number) {
  const passRate = total > 0 ? (passCount / total) * 100 : 0;
  const failRate = total > 0 ? ((total - passCount) / total) * 100 : 0;
  return { passRate: round2(passRate), failRate: round2(failRate) };
}

export class AdminAnalyticsService {
  async getDashboardSummary(dateRange?: AdminDateRangeQuery) {
    const startedAtFilter = buildStartedAtFilter(dateRange?.from, dateRange?.to);
    const attemptWhere: Prisma.QuizAttemptWhereInput = startedAtFilter
      ? { startedAt: startedAtFilter }
      : {};

    const [
      userCounts,
      subjectCount,
      publishedSubjectCount,
      unitCount,
      topicCount,
      learningContentCount,
      quizCount,
      publishedQuizCount,
      questionCount,
      attemptCounts,
      performanceAgg,
      passCount,
      totalXP,
      usersWithAttempts,
      quizAttemptGroups,
      topPerformers,
      popularContent,
    ] = await Promise.all([
      this.getUserCountBreakdown(),
      prisma.subject.count(),
      prisma.subject.count({ where: { status: ContentStatus.PUBLISHED } }),
      prisma.unit.count(),
      prisma.topic.count(),
      prisma.learningContent.count(),
      prisma.quiz.count(),
      prisma.quiz.count({ where: { status: ContentStatus.PUBLISHED } }),
      prisma.question.count(),
      this.getAttemptCountBreakdown(attemptWhere),
      prisma.quizAttempt.aggregate({
        where: { ...attemptWhere, status: { in: FINALIZED_STATUSES } },
        _avg: { percentage: true },
      }),
      prisma.quizAttempt.count({
        where: { ...attemptWhere, status: { in: FINALIZED_STATUSES }, isPassed: true },
      }),
      prisma.xPTransaction.aggregate({ _sum: { amount: true } }),
      prisma.quizAttempt.groupBy({
        by: ['userId'],
        where: attemptWhere,
      }).then((rows) => rows.length),
      prisma.quizAttempt.groupBy({
        by: ['quizId'],
        where: attemptWhere,
        _count: { _all: true },
        orderBy: { _count: { quizId: 'desc' } },
        take: 1,
      }),
      this.getTopPerformers(attemptWhere),
      this.getPopularContent(attemptWhere),
    ]);

    const finalizedTotal =
      attemptCounts.completedAttempts + attemptCounts.expiredAttempts;
    const { passRate, failRate } = computeRates(finalizedTotal, passCount);

    let mostAttemptedQuiz: { quizId: string; quizTitle: string; attempts: number } | null = null;
    if (quizAttemptGroups.length > 0) {
      const topQuiz = quizAttemptGroups[0];
      const quiz = await prisma.quiz.findUnique({
        where: { id: topQuiz.quizId },
        select: { id: true, title: true },
      });
      if (quiz) {
        mostAttemptedQuiz = {
          quizId: quiz.id,
          quizTitle: quiz.title,
          attempts: topQuiz._count._all,
        };
      }
    }

    const mostAttemptedSubject = popularContent.mostAttemptedSubjects[0] ?? null;

    return {
      users: userCounts,
      academic: {
        subjects: subjectCount,
        publishedSubjects: publishedSubjectCount,
        units: unitCount,
        topics: topicCount,
        learningContent: learningContentCount,
        quizzes: quizCount,
        publishedQuizzes: publishedQuizCount,
        questions: questionCount,
      },
      attempts: attemptCounts,
      performance: {
        averageScore: round2(performanceAgg._avg.percentage),
        passRate,
        failRate,
      },
      engagement: {
        totalXP: Number(totalXP._sum.amount ?? 0),
        usersWithAttempts,
        mostAttemptedQuiz,
        mostAttemptedSubject,
      },
      topPerformers,
      popularContent,
    };
  }

  async getUserAnalytics() {
    const counts = await this.getUserCountBreakdown();
    const [usersWithAttempts, usersWithCompletedAttempts] = await Promise.all([
      prisma.quizAttempt.groupBy({ by: ['userId'] }).then((rows) => rows.length),
      prisma.quizAttempt
        .groupBy({
          by: ['userId'],
          where: { status: AttemptStatus.COMPLETED },
        })
        .then((rows) => rows.length),
    ]);

    return {
      totalUsers: counts.total,
      totalStudents: counts.students,
      totalAdmins: counts.admins,
      activeUsers: counts.active,
      inactiveUsers: counts.inactive,
      suspendedUsers: counts.suspended,
      usersWithAttempts,
      usersWithCompletedAttempts,
    };
  }

  async getSubjectAnalytics(dateRange?: AdminDateRangeQuery) {
    const startedAtFilter = buildStartedAtFilter(dateRange?.from, dateRange?.to);

    const subjects = await prisma.subject.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const [unitCounts, topicCounts, quizRecords, attemptRecords] = await Promise.all([
      prisma.unit.groupBy({
        by: ['subjectId'],
        _count: { _all: true },
      }),
      prisma.topic.findMany({
        select: { id: true, unit: { select: { subjectId: true } } },
      }),
      prisma.quiz.findMany({
        select: {
          id: true,
          status: true,
          topic: { select: { unit: { select: { subjectId: true } } } },
        },
      }),
      prisma.quizAttempt.findMany({
        where: {
          ...(startedAtFilter ? { startedAt: startedAtFilter } : {}),
          status: { in: FINALIZED_STATUSES },
        },
        select: {
          status: true,
          percentage: true,
          isPassed: true,
          quiz: { select: { topic: { select: { unit: { select: { subjectId: true } } } } } },
        },
      }),
    ]);

    const unitMap = new Map(unitCounts.map((row) => [row.subjectId, row._count._all]));
    const topicMap = new Map<string, number>();
    for (const topic of topicCounts) {
      const subjectId = topic.unit.subjectId;
      topicMap.set(subjectId, (topicMap.get(subjectId) ?? 0) + 1);
    }

    const quizCountMap = new Map<string, number>();
    const publishedQuizCountMap = new Map<string, number>();
    for (const quiz of quizRecords) {
      const subjectId = quiz.topic.unit.subjectId;
      quizCountMap.set(subjectId, (quizCountMap.get(subjectId) ?? 0) + 1);
      if (quiz.status === ContentStatus.PUBLISHED) {
        publishedQuizCountMap.set(subjectId, (publishedQuizCountMap.get(subjectId) ?? 0) + 1);
      }
    }

    const attemptMap = new Map<
      string,
      { attempts: number; completedAttempts: number; scoreTotal: number; passCount: number }
    >();

    for (const attempt of attemptRecords) {
      const subjectId = attempt.quiz.topic.unit.subjectId;
      const current = attemptMap.get(subjectId) ?? {
        attempts: 0,
        completedAttempts: 0,
        scoreTotal: 0,
        passCount: 0,
      };
      current.attempts += 1;
      if (attempt.status === AttemptStatus.COMPLETED) current.completedAttempts += 1;
      current.scoreTotal += attempt.percentage;
      if (attempt.isPassed) current.passCount += 1;
      attemptMap.set(subjectId, current);
    }

    return subjects.map((subject) => {
      const stats = attemptMap.get(subject.id) ?? {
        attempts: 0,
        completedAttempts: 0,
        scoreTotal: 0,
        passCount: 0,
      };
      const averageScore = stats.attempts > 0 ? stats.scoreTotal / stats.attempts : 0;
      const { passRate, failRate } = computeRates(stats.attempts, stats.passCount);

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        units: unitMap.get(subject.id) ?? 0,
        topics: topicMap.get(subject.id) ?? 0,
        quizzes: quizCountMap.get(subject.id) ?? 0,
        publishedQuizzes: publishedQuizCountMap.get(subject.id) ?? 0,
        attempts: stats.attempts,
        completedAttempts: stats.completedAttempts,
        averageScore: round2(averageScore),
        passRate,
        failRate,
      };
    });
  }

  async getQuizAnalytics(dateRange?: AdminDateRangeQuery) {
    const startedAtFilter = buildStartedAtFilter(dateRange?.from, dateRange?.to);

    const quizzes = await prisma.quiz.findMany({
      select: {
        id: true,
        title: true,
        topic: {
          select: {
            title: true,
            unit: {
              select: {
                title: true,
                subject: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { title: 'asc' },
    });

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        ...(startedAtFilter ? { startedAt: startedAtFilter } : {}),
        status: { in: FINALIZED_STATUSES },
      },
      select: {
        quizId: true,
        status: true,
        percentage: true,
        isPassed: true,
      },
    });

    const statsMap = new Map<
      string,
      {
        attempts: number;
        completed: number;
        expired: number;
        scoreTotal: number;
        highest: number;
        lowest: number;
        passCount: number;
      }
    >();

    for (const attempt of attempts) {
      const current = statsMap.get(attempt.quizId) ?? {
        attempts: 0,
        completed: 0,
        expired: 0,
        scoreTotal: 0,
        highest: -Infinity,
        lowest: Infinity,
        passCount: 0,
      };
      current.attempts += 1;
      if (attempt.status === AttemptStatus.COMPLETED) current.completed += 1;
      if (attempt.status === AttemptStatus.EXPIRED) current.expired += 1;
      current.scoreTotal += attempt.percentage;
      current.highest = Math.max(current.highest, attempt.percentage);
      current.lowest = Math.min(current.lowest, attempt.percentage);
      if (attempt.isPassed) current.passCount += 1;
      statsMap.set(attempt.quizId, current);
    }

    const quizAnalytics = quizzes.map((quiz) => {
      const stats = statsMap.get(quiz.id) ?? {
        attempts: 0,
        completed: 0,
        expired: 0,
        scoreTotal: 0,
        highest: 0,
        lowest: 0,
        passCount: 0,
      };
      const averageScore = stats.attempts > 0 ? stats.scoreTotal / stats.attempts : 0;
      const { passRate, failRate } = computeRates(stats.attempts, stats.passCount);

      return {
        quizId: quiz.id,
        quizTitle: quiz.title,
        subject: quiz.topic.unit.subject.name,
        unit: quiz.topic.unit.title,
        topic: quiz.topic.title,
        attempts: stats.attempts,
        completedAttempts: stats.completed,
        expiredAttempts: stats.expired,
        averageScore: round2(averageScore),
        highestScore: stats.attempts > 0 ? round2(stats.highest) : 0,
        lowestScore: stats.attempts > 0 ? round2(stats.lowest) : 0,
        passRate,
        failRate,
      };
    });

    const withAttempts = quizAnalytics.filter((quiz) => quiz.attempts > 0);

    const byAttempts = [...withAttempts].sort(
      (a, b) => b.attempts - a.attempts || a.quizTitle.localeCompare(b.quizTitle)
    );
    const byScoreDesc = [...withAttempts].sort(
      (a, b) =>
        b.averageScore - a.averageScore ||
        b.attempts - a.attempts ||
        a.quizTitle.localeCompare(b.quizTitle)
    );
    const byScoreAsc = [...withAttempts].sort(
      (a, b) =>
        a.averageScore - b.averageScore ||
        b.attempts - a.attempts ||
        a.quizTitle.localeCompare(b.quizTitle)
    );

    return {
      quizzes: quizAnalytics,
      rankings: {
        mostAttempted: byAttempts[0] ?? null,
        highestPerforming: byScoreDesc[0] ?? null,
        lowestPerforming: byScoreAsc[0] ?? null,
      },
    };
  }

  async getQuestionAnalytics(dateRange?: AdminDateRangeQuery) {
    const startedAtFilter = buildStartedAtFilter(dateRange?.from, dateRange?.to);

    const answerWhere: Prisma.AnswerWhereInput = startedAtFilter
      ? { attempt: { startedAt: startedAtFilter } }
      : {};

    const [questions, answerStats, correctStats, marksStats] = await Promise.all([
      prisma.question.findMany({
        select: {
          id: true,
          questionText: true,
          quizId: true,
          quiz: { select: { title: true } },
        },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.answer.groupBy({
        by: ['questionId'],
        where: answerWhere,
        _count: { _all: true },
      }),
      prisma.answer.groupBy({
        by: ['questionId', 'isCorrect'],
        where: answerWhere,
        _count: { _all: true },
      }),
      prisma.answer.groupBy({
        by: ['questionId'],
        where: answerWhere,
        _avg: { marksAwarded: true },
      }),
    ]);

    const totalMap = new Map(answerStats.map((row) => [row.questionId, row._count._all]));
    const correctMap = new Map<string, number>();
    for (const row of correctStats) {
      if (row.isCorrect) {
        correctMap.set(row.questionId, row._count._all);
      }
    }
    const marksMap = new Map(
      marksStats.map((row) => [row.questionId, row._avg.marksAwarded ?? 0])
    );

    const questionAnalytics = questions.map((question) => {
      const totalAnswers = totalMap.get(question.id) ?? 0;
      const correctAnswers = correctMap.get(question.id) ?? 0;
      const incorrectAnswers = totalAnswers - correctAnswers;
      const accuracyPercentage =
        totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

      return {
        questionId: question.id,
        questionText: question.questionText,
        quizId: question.quizId,
        quizTitle: question.quiz.title,
        totalAnswers,
        correctAnswers,
        incorrectAnswers,
        accuracyPercentage: round2(accuracyPercentage),
        averageMarksAwarded: round2(marksMap.get(question.id)),
      };
    });

    const difficultQuestions = questionAnalytics
      .filter((question) => question.totalAnswers > 0)
      .sort(
        (a, b) =>
          a.accuracyPercentage - b.accuracyPercentage ||
          b.totalAnswers - a.totalAnswers ||
          a.questionText.localeCompare(b.questionText)
      )
      .slice(0, 10);

    return {
      questions: questionAnalytics,
      difficultQuestions,
    };
  }

  async getTopPerformers(attemptWhere: Prisma.QuizAttemptWhereInput = {}) {
    const [xpRows, completedAttempts] = await Promise.all([
      prisma.xPTransaction.groupBy({
        by: ['userId'],
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.quizAttempt.findMany({
        where: {
          ...attemptWhere,
          status: AttemptStatus.COMPLETED,
        },
        select: {
          userId: true,
          quizId: true,
          percentage: true,
        },
        orderBy: [{ userId: 'asc' }, { quizId: 'asc' }],
      }),
    ]);

    const userIds = new Set<string>();
    for (const row of xpRows) userIds.add(row.userId);
    for (const row of completedAttempts) userIds.add(row.userId);

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(users.map((user) => [user.id, user.name]));

    const highestXP = xpRows
      .map((row) => ({
        userId: row.userId,
        name: nameMap.get(row.userId) ?? 'Unknown',
        totalXP: Number(row._sum.amount ?? 0),
      }))
      .sort(
        (a, b) =>
          b.totalXP - a.totalXP || a.name.localeCompare(b.name) || a.userId.localeCompare(b.userId)
      )
      .slice(0, 10);

    const userScoreMap = new Map<string, { total: number; count: number }>();
    const quizScoreMap = new Map<string, { total: number; count: number }>();

    for (const attempt of completedAttempts) {
      const userStats = userScoreMap.get(attempt.userId) ?? { total: 0, count: 0 };
      userStats.total += attempt.percentage;
      userStats.count += 1;
      userScoreMap.set(attempt.userId, userStats);

      const quizKey = `${attempt.userId}:${attempt.quizId}`;
      const quizStats = quizScoreMap.get(quizKey) ?? { total: 0, count: 0 };
      quizStats.total += attempt.percentage;
      quizStats.count += 1;
      quizScoreMap.set(quizKey, quizStats);
    }

    const highestAverageScore = Array.from(userScoreMap.entries())
      .map(([userId, stats]) => ({
        userId,
        name: nameMap.get(userId) ?? 'Unknown',
        averageScore: round2(stats.total / stats.count),
        completedAttempts: stats.count,
      }))
      .sort(
        (a, b) =>
          b.averageScore - a.averageScore ||
          b.completedAttempts - a.completedAttempts ||
          a.name.localeCompare(b.name) ||
          a.userId.localeCompare(b.userId)
      )
      .slice(0, 10);

    const highestQuizPerformance = Array.from(quizScoreMap.entries())
      .map(([key, stats]) => {
        const [userId, quizId] = key.split(':');
        return {
          userId,
          quizId,
          name: nameMap.get(userId) ?? 'Unknown',
          averageScore: round2(stats.total / stats.count),
          attempts: stats.count,
        };
      })
      .sort(
        (a, b) =>
          b.averageScore - a.averageScore ||
          b.attempts - a.attempts ||
          a.name.localeCompare(b.name) ||
          a.userId.localeCompare(b.userId)
      )
      .slice(0, 10);

    return {
      highestXP,
      highestAverageScore,
      highestQuizPerformance,
    };
  }

  async getPopularContent(attemptWhere: Prisma.QuizAttemptWhereInput = {}) {
    const attempts = await prisma.quizAttempt.findMany({
      where: attemptWhere,
      select: {
        quizId: true,
        quiz: {
          select: {
            id: true,
            title: true,
            topic: {
              select: {
                id: true,
                title: true,
                unit: {
                  select: {
                    subject: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const subjectMap = new Map<string, { subjectId: string; subjectName: string; attempts: number }>();
    const quizMap = new Map<string, { quizId: string; quizTitle: string; attempts: number }>();
    const topicMap = new Map<string, { topicId: string; topicTitle: string; attempts: number }>();

    for (const attempt of attempts) {
      const subject = attempt.quiz.topic.unit.subject;
      const subjectEntry = subjectMap.get(subject.id) ?? {
        subjectId: subject.id,
        subjectName: subject.name,
        attempts: 0,
      };
      subjectEntry.attempts += 1;
      subjectMap.set(subject.id, subjectEntry);

      const quizEntry = quizMap.get(attempt.quizId) ?? {
        quizId: attempt.quiz.id,
        quizTitle: attempt.quiz.title,
        attempts: 0,
      };
      quizEntry.attempts += 1;
      quizMap.set(attempt.quizId, quizEntry);

      const topic = attempt.quiz.topic;
      const topicEntry = topicMap.get(topic.id) ?? {
        topicId: topic.id,
        topicTitle: topic.title,
        attempts: 0,
      };
      topicEntry.attempts += 1;
      topicMap.set(topic.id, topicEntry);
    }

    const sortByAttempts = <T extends { attempts: number }>(a: T, b: T) => b.attempts - a.attempts;

    return {
      mostAttemptedSubjects: Array.from(subjectMap.values())
        .sort(
          (a, b) =>
            sortByAttempts(a, b) || a.subjectName.localeCompare(b.subjectName)
        )
        .slice(0, 10),
      mostAttemptedQuizzes: Array.from(quizMap.values())
        .sort((a, b) => sortByAttempts(a, b) || a.quizTitle.localeCompare(b.quizTitle))
        .slice(0, 10),
      mostActiveTopics: Array.from(topicMap.values())
        .sort((a, b) => sortByAttempts(a, b) || a.topicTitle.localeCompare(b.topicTitle))
        .slice(0, 10),
    };
  }

  async getAttempts(params: AdminAttemptQueryParams) {
    const { userId, quizId, subjectId, status, from, to, page, limit } = params;
    const startedAtFilter = buildStartedAtFilter(from, to);

    const where: Prisma.QuizAttemptWhereInput = {
      ...(userId ? { userId } : {}),
      ...(quizId ? { quizId } : {}),
      ...(status ? { status } : {}),
      ...(startedAtFilter ? { startedAt: startedAtFilter } : {}),
      ...(subjectId
        ? {
            quiz: {
              topic: {
                unit: { subjectId },
              },
            },
          }
        : {}),
    };

    const [attempts, total] = await Promise.all([
      prisma.quizAttempt.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          quiz: {
            select: {
              id: true,
              title: true,
              topic: {
                select: {
                  unit: {
                    select: {
                      subject: { select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.quizAttempt.count({ where }),
    ]);

    return {
      attempts: attempts.map((attempt) => ({
        attemptId: attempt.id,
        studentId: attempt.userId,
        studentName: attempt.user.name,
        quizId: attempt.quizId,
        quizTitle: attempt.quiz.title,
        subjectId: attempt.quiz.topic.unit.subject.id,
        subjectName: attempt.quiz.topic.unit.subject.name,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        expiresAt: attempt.expiresAt,
        percentage: attempt.percentage,
        obtainedMarks: attempt.obtainedMarks,
        totalMarks: attempt.totalMarks,
        isPassed: attempt.isPassed,
        timeTakenSec: attempt.timeTakenSec,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async getAttemptDetail(attemptId: string) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        quiz: {
          select: {
            id: true,
            title: true,
            topic: {
              select: {
                id: true,
                title: true,
                unit: {
                  select: {
                    id: true,
                    title: true,
                    subject: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                explanation: true,
                options: {
                  orderBy: { displayOrder: 'asc' },
                  select: { id: true, optionText: true, isCorrect: true },
                },
              },
            },
            selectedOption: { select: { id: true, optionText: true, isCorrect: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!attempt) {
      throw new AppError(404, 'ATTEMPT_NOT_FOUND', 'Quiz attempt not found.');
    }

    const correctOptionFor = (options: Array<{ id: string; optionText: string; isCorrect: boolean }>) =>
      options.find((option) => option.isCorrect) ?? null;

    return {
      student: {
        id: attempt.user.id,
        name: attempt.user.name,
        email: attempt.user.email,
      },
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
      },
      hierarchy: {
        subject: {
          id: attempt.quiz.topic.unit.subject.id,
          name: attempt.quiz.topic.unit.subject.name,
        },
        unit: {
          id: attempt.quiz.topic.unit.id,
          title: attempt.quiz.topic.unit.title,
        },
        topic: {
          id: attempt.quiz.topic.id,
          title: attempt.quiz.topic.title,
        },
      },
      attempt: {
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        submittedAt: attempt.submittedAt,
        timeTakenSec: attempt.timeTakenSec,
        totalQuestions: attempt.totalQuestions,
        answeredCount: attempt.answeredCount,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        unansweredCount: attempt.unansweredCount,
        totalMarks: attempt.totalMarks,
        obtainedMarks: attempt.obtainedMarks,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
      },
      answers: attempt.answers.map((answer) => ({
        questionId: answer.questionId,
        questionText: answer.question.questionText,
        selectedOption: answer.selectedOption
          ? { id: answer.selectedOption.id, optionText: answer.selectedOption.optionText }
          : null,
        correctOption: correctOptionFor(answer.question.options),
        isCorrect: answer.isCorrect,
        marksAwarded: answer.marksAwarded,
        explanation: answer.question.explanation,
      })),
    };
  }

  async getStudentPerformance(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });

    if (!user || user.role !== Role.STUDENT) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Student not found.');
    }

    const [
      totalAttempts,
      completedAttempts,
      expiredAttempts,
      averageAgg,
      highestAttempt,
      passCount,
      xpTotal,
      badges,
      progressRecords,
      recentAttempts,
    ] = await Promise.all([
      prisma.quizAttempt.count({ where: { userId } }),
      prisma.quizAttempt.count({ where: { userId, status: AttemptStatus.COMPLETED } }),
      prisma.quizAttempt.count({ where: { userId, status: AttemptStatus.EXPIRED } }),
      prisma.quizAttempt.aggregate({
        where: { userId, status: { in: FINALIZED_STATUSES } },
        _avg: { percentage: true },
      }),
      prisma.quizAttempt.findFirst({
        where: { userId, status: AttemptStatus.COMPLETED },
        orderBy: { percentage: 'desc' },
        select: { percentage: true },
      }),
      prisma.quizAttempt.count({
        where: { userId, status: { in: FINALIZED_STATUSES }, isPassed: true },
      }),
      prisma.xPTransaction.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
      prisma.userBadge.findMany({
        where: { userId },
        include: { badge: { select: { id: true, code: true, name: true, description: true } } },
        orderBy: { awardedAt: 'desc' },
      }),
      prisma.userProgress.findMany({
        where: {
          userId,
          scopeType: { in: [ProgressScope.SUBJECT, ProgressScope.UNIT, ProgressScope.TOPIC] },
        },
        include: {
          subject: { select: { id: true, name: true } },
          unit: { select: { id: true, title: true } },
          topic: { select: { id: true, title: true } },
        },
      }),
      prisma.quizAttempt.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          percentage: true,
          submittedAt: true,
          quiz: { select: { id: true, title: true } },
        },
        orderBy: { startedAt: 'desc' },
        take: 10,
      }),
    ]);

    const finalizedTotal = completedAttempts + expiredAttempts;
    const { passRate } = computeRates(finalizedTotal, passCount);
    const totalXP = Number(xpTotal._sum.amount ?? 0);
    const levelInfo = calculateLevel(totalXP);

    const subjectProgress = progressRecords
      .filter((record) => record.scopeType === ProgressScope.SUBJECT)
      .map((record) => ({
        subjectId: record.subjectId,
        subjectName: record.subject?.name ?? null,
        completionPercentage: record.completionPercentage,
        averageScore: record.averageScore,
        quizzesAttempted: record.quizzesAttempted,
        quizzesCompleted: record.quizzesCompleted,
      }));

    const unitProgress = progressRecords
      .filter((record) => record.scopeType === ProgressScope.UNIT)
      .map((record) => ({
        unitId: record.unitId,
        unitTitle: record.unit?.title ?? null,
        completionPercentage: record.completionPercentage,
        averageScore: record.averageScore,
        quizzesAttempted: record.quizzesAttempted,
        quizzesCompleted: record.quizzesCompleted,
      }));

    const topicProgress = progressRecords
      .filter((record) => record.scopeType === ProgressScope.TOPIC)
      .map((record) => ({
        topicId: record.topicId,
        topicTitle: record.topic?.title ?? null,
        completionPercentage: record.completionPercentage,
        averageScore: record.averageScore,
        quizzesAttempted: record.quizzesAttempted,
        quizzesCompleted: record.quizzesCompleted,
      }));

    return {
      user: { id: user.id, name: user.name },
      attempts: {
        total: totalAttempts,
        completed: completedAttempts,
        expired: expiredAttempts,
        averageScore: round2(averageAgg._avg.percentage),
        highestScore: round2(highestAttempt?.percentage),
        passRate,
      },
      gamification: {
        totalXP,
        level: levelInfo.currentLevel,
        badges: badges.map((entry) => ({
          id: entry.badge.id,
          code: entry.badge.code,
          name: entry.badge.name,
          description: entry.badge.description,
          awardedAt: entry.awardedAt,
        })),
      },
      progress: {
        subjects: subjectProgress,
        units: unitProgress,
        topics: topicProgress,
      },
      recentAttempts: recentAttempts.map((attempt) => ({
        quiz: { id: attempt.quiz.id, title: attempt.quiz.title },
        score: attempt.percentage,
        percentage: attempt.percentage,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
      })),
    };
  }

  private async getUserCountBreakdown() {
    const [total, students, admins, active, inactive, suspended] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.user.count({ where: { role: Role.ADMIN } }),
      prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      prisma.user.count({ where: { status: UserStatus.INACTIVE } }),
      prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
    ]);

    return { total, students, admins, active, inactive, suspended };
  }

  private async getAttemptCountBreakdown(where: Prisma.QuizAttemptWhereInput = {}) {
    const [totalAttempts, completedAttempts, expiredAttempts, inProgressAttempts] =
      await Promise.all([
        prisma.quizAttempt.count({ where }),
        prisma.quizAttempt.count({ where: { ...where, status: AttemptStatus.COMPLETED } }),
        prisma.quizAttempt.count({ where: { ...where, status: AttemptStatus.EXPIRED } }),
        prisma.quizAttempt.count({ where: { ...where, status: AttemptStatus.IN_PROGRESS } }),
      ]);

    return { totalAttempts, completedAttempts, expiredAttempts, inProgressAttempts };
  }
}

export const adminAnalyticsService = new AdminAnalyticsService();
