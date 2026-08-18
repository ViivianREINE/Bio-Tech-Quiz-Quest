import { ContentStatus, Role, AttemptStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.middleware.js';
import { AuthenticatedUser } from '../../types/index.js';
import { SubmitQuizInput, AttemptQueryParams } from './attempt.validation.js';
import { scoringService } from './scoring.service.js';
import { shuffleArray } from '../quizzes/quiz.service.js';
import { gamificationOrchestrator } from '../gamification/gamification.orchestrator.js';

export class AttemptService {
  async startQuizAttempt(quizId: string, user: AuthenticatedUser) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        topic: {
          include: {
            unit: {
              include: { subject: true },
            },
          },
        },
        questions: {
          orderBy: { displayOrder: 'asc' },
          include: {
            options: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new AppError(404, 'QUIZ_NOT_FOUND', 'Quiz not found.');
    }

    if (
      quiz.status !== ContentStatus.PUBLISHED ||
      quiz.topic.status !== ContentStatus.PUBLISHED ||
      quiz.topic.unit.status !== ContentStatus.PUBLISHED ||
      quiz.topic.unit.subject.status !== ContentStatus.PUBLISHED
    ) {
      throw new AppError(404, 'QUIZ_NOT_FOUND', 'Quiz is not available.');
    }

    if (quiz.questions.length === 0) {
      throw new AppError(400, 'EMPTY_QUIZ', 'Quiz does not have any questions.');
    }

    // Check maximum attempts for this user on this quiz
    const previousAttemptsCount = await prisma.quizAttempt.count({
      where: {
        userId: user.id,
        quizId: quiz.id,
      },
    });

    if (previousAttemptsCount >= quiz.maximumAttempts) {
      throw new AppError(
        403,
        'MAX_ATTEMPTS_EXCEEDED',
        `You have exceeded the maximum allowed attempts (${quiz.maximumAttempts}) for this quiz.`
      );
    }

    // Check if there is an existing IN_PROGRESS attempt that hasn't expired yet
    const activeAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId: user.id,
        quizId: quiz.id,
        status: AttemptStatus.IN_PROGRESS,
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    if (activeAttempt) {
      if (now <= activeAttempt.expiresAt) {
        // Return existing active attempt
        return this.formatSanitizedStartResponse(quiz, activeAttempt);
      } else {
        // Mark stale active attempt as EXPIRED
        await prisma.quizAttempt.update({
          where: { id: activeAttempt.id },
          data: { status: AttemptStatus.EXPIRED, timeTakenSec: quiz.duration * 60 },
        });
      }
    }

    const startedAt = now;
    const expiresAt = new Date(startedAt.getTime() + quiz.duration * 60 * 1000);
    const attemptNumber = previousAttemptsCount + 1;

    const totalMarks = quiz.questions.reduce((sum, q) => sum + (q.marks || quiz.correctMark), 0);

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        quizId: quiz.id,
        attemptNumber,
        startedAt,
        expiresAt,
        status: AttemptStatus.IN_PROGRESS,
        totalQuestions: quiz.questions.length,
        totalMarks: Math.round(totalMarks * 100) / 100,
        snapshotPassingPercentage: quiz.passingPercentage,
        snapshotCorrectMark: quiz.correctMark,
        snapshotIncorrectMark: quiz.incorrectMark,
        snapshotUnansweredMark: quiz.unansweredMark,
        snapshotNegativeMarking: quiz.negativeMarking,
      },
    });

    return this.formatSanitizedStartResponse(quiz, attempt);
  }

  private formatSanitizedStartResponse(quiz: any, attempt: any) {
    let questions = quiz.questions.map((q: any) => {
      let options = q.options.map((opt: any) => ({
        id: opt.id,
        optionText: opt.optionText,
        displayOrder: opt.displayOrder,
        // CRITICAL SECURITY: isCorrect is NEVER returned
      }));

      if (quiz.randomizeOptions) {
        options = shuffleArray(options);
      }

      return {
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        difficulty: q.difficulty,
        displayOrder: q.displayOrder,
        options,
      };
    });

    if (quiz.randomizeQuestions) {
      questions = shuffleArray(questions);
    }

    return {
      attemptId: attempt.id,
      quizId: quiz.id,
      quizTitle: quiz.title,
      attemptNumber: attempt.attemptNumber,
      maximumAttempts: quiz.maximumAttempts,
      duration: quiz.duration,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      totalQuestions: questions.length,
      totalMarks: attempt.totalMarks,
      questions,
    };
  }

  async submitAttempt(attemptId: string, user: AuthenticatedUser, input: SubmitQuizInput) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new AppError(404, 'ATTEMPT_NOT_FOUND', 'Quiz attempt not found.');
    }

    // IDOR Protection: Verify ownership
    if (attempt.userId !== user.id && user.role !== Role.ADMIN) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot submit an attempt belonging to another user.');
    }

    // Duplicate Submission Protection
    if (attempt.status === AttemptStatus.COMPLETED || attempt.status === AttemptStatus.EXPIRED) {
      throw new AppError(
        400,
        'ATTEMPT_ALREADY_SUBMITTED',
        'This quiz attempt has already been finalized and cannot be resubmitted.'
      );
    }

    const now = new Date();
    const isExpired = now > attempt.expiresAt;
    const finalStatus = isExpired ? AttemptStatus.EXPIRED : AttemptStatus.COMPLETED;

    const timeTakenSec = isExpired
      ? Math.round((attempt.expiresAt.getTime() - attempt.startedAt.getTime()) / 1000)
      : Math.max(0, Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000));

    const scoringConfig = {
      passingPercentage: attempt.snapshotPassingPercentage ?? attempt.quiz.passingPercentage,
      negativeMarking: attempt.snapshotNegativeMarking ?? attempt.quiz.negativeMarking,
      correctMark: attempt.snapshotCorrectMark ?? attempt.quiz.correctMark,
      incorrectMark: attempt.snapshotIncorrectMark ?? attempt.quiz.incorrectMark,
      unansweredMark: attempt.snapshotUnansweredMark ?? attempt.quiz.unansweredMark,
    };

    const scoring = scoringService.evaluateQuiz(
      attempt.quiz.questions,
      input.answers,
      scoringConfig
    );

    // Atomic Transaction: persist Answer records and finalize QuizAttempt
    const updatedAttempt = await prisma.$transaction(async (tx) => {
      // Create Answer records
      if (scoring.evaluatedAnswers.length > 0) {
        await tx.answer.createMany({
          data: scoring.evaluatedAnswers.map((ea) => ({
            attemptId: attempt.id,
            questionId: ea.questionId,
            selectedOptionId: ea.selectedOptionId,
            isCorrect: ea.isCorrect,
            marksAwarded: ea.marksAwarded,
          })),
        });
      }

      return tx.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          status: finalStatus,
          submittedAt: now,
          timeTakenSec,
          answeredCount: scoring.answeredCount,
          unansweredCount: scoring.unansweredCount,
          correctCount: scoring.correctCount,
          incorrectCount: scoring.incorrectCount,
          obtainedMarks: scoring.obtainedMarks,
          totalMarks: scoring.totalMarks,
          percentage: scoring.percentage,
          isPassed: scoring.isPassed,
        },
      });
    });

    // Post-transaction: trigger gamification (progress, XP, badges, streak) — non-blocking, idempotent
    gamificationOrchestrator.processAttempt(attempt.userId, updatedAttempt.id, {
      correctCount: updatedAttempt.correctCount,
      percentage: updatedAttempt.percentage,
      status: updatedAttempt.status,
    }).catch((err) => console.error('[Gamification] Error processing attempt:', err));

    return {
      attemptId: updatedAttempt.id,
      quizId: updatedAttempt.quizId,
      status: updatedAttempt.status,
      attemptNumber: updatedAttempt.attemptNumber,
      totalQuestions: updatedAttempt.totalQuestions,
      answeredCount: updatedAttempt.answeredCount,
      unansweredCount: updatedAttempt.unansweredCount,
      correctCount: updatedAttempt.correctCount,
      incorrectCount: updatedAttempt.incorrectCount,
      totalMarks: updatedAttempt.totalMarks,
      obtainedMarks: updatedAttempt.obtainedMarks,
      percentage: updatedAttempt.percentage,
      isPassed: updatedAttempt.isPassed,
      timeTakenSec: updatedAttempt.timeTakenSec,
      submittedAt: updatedAttempt.submittedAt,
    };
  }

  async submitAttemptByQuizId(quizId: string, user: AuthenticatedUser, input: SubmitQuizInput) {
    const activeAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId: user.id,
        quizId,
        status: AttemptStatus.IN_PROGRESS,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeAttempt) {
      throw new AppError(404, 'NO_ACTIVE_ATTEMPT', 'No active in-progress attempt found for this quiz.');
    }

    return this.submitAttempt(activeAttempt.id, user, input);
  }

  async getAttempts(user: AuthenticatedUser, params: AttemptQueryParams) {
    const { quizId, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(quizId ? { quizId } : {}),
      ...(status ? { status } : {}),
    };

    // If STUDENT: only their own attempts
    if (user.role === Role.STUDENT) {
      where.userId = user.id;
    }

    const [attempts, total] = await Promise.all([
      prisma.quizAttempt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              difficulty: true,
              duration: true,
              topic: {
                select: {
                  id: true,
                  title: true,
                  unit: {
                    select: {
                      id: true,
                      title: true,
                      subject: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
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
      attempts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAttemptById(attemptId: string, user: AuthenticatedUser) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            topic: {
              include: {
                unit: {
                  include: { subject: true },
                },
              },
            },
            questions: {
              orderBy: { displayOrder: 'asc' },
              include: {
                options: {
                  orderBy: { displayOrder: 'asc' },
                },
              },
            },
          },
        },
        answers: {
          include: {
            selectedOption: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new AppError(404, 'ATTEMPT_NOT_FOUND', 'Quiz attempt not found.');
    }

    // IDOR Protection
    if (attempt.userId !== user.id && user.role !== Role.ADMIN) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied to this quiz attempt.');
    }

    // Lazy auto-expiration check for in-progress attempts
    if (attempt.status === AttemptStatus.IN_PROGRESS && new Date() > attempt.expiresAt) {
      await prisma.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          status: AttemptStatus.EXPIRED,
          timeTakenSec: attempt.quiz.duration * 60,
        },
      });
      attempt.status = AttemptStatus.EXPIRED;
    }

    if (attempt.status === AttemptStatus.IN_PROGRESS) {
      // In-progress: do NOT reveal correct answers
      return {
        id: attempt.id,
        quizId: attempt.quizId,
        quizTitle: attempt.quiz.title,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        totalQuestions: attempt.totalQuestions,
        totalMarks: attempt.totalMarks,
      };
    }

    // COMPLETED or EXPIRED: Review mode — allow student to see question review, selected answers, and correct answers
    const answersMap = new Map<string, any>();
    for (const ans of attempt.answers) {
      answersMap.set(ans.questionId, ans);
    }

    const reviewQuestions = attempt.quiz.questions.map((q) => {
      const studentAnswer = answersMap.get(q.id);
      const correctOption = q.options.find((opt) => opt.isCorrect);

      return {
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        explanation: q.explanation,
        selectedOption: studentAnswer?.selectedOption
          ? {
              id: studentAnswer.selectedOption.id,
              optionText: studentAnswer.selectedOption.optionText,
            }
          : null,
        correctOption: correctOption
          ? {
              id: correctOption.id,
              optionText: correctOption.optionText,
            }
          : null,
        isCorrect: studentAnswer ? studentAnswer.isCorrect : false,
        marksAwarded: studentAnswer ? studentAnswer.marksAwarded : 0.0,
        options: q.options.map((opt) => ({
          id: opt.id,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
        })),
      };
    });

    return {
      id: attempt.id,
      quizId: attempt.quizId,
      quizTitle: attempt.quiz.title,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      submittedAt: attempt.submittedAt,
      timeTakenSec: attempt.timeTakenSec,
      totalQuestions: attempt.totalQuestions,
      answeredCount: attempt.answeredCount,
      unansweredCount: attempt.unansweredCount,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      totalMarks: attempt.totalMarks,
      obtainedMarks: attempt.obtainedMarks,
      percentage: attempt.percentage,
      isPassed: attempt.isPassed,
      reviewQuestions,
    };
  }
}

export const attemptService = new AttemptService();
