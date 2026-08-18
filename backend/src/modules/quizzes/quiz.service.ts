import { ContentStatus, Role, QuestionType } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.middleware.js';
import {
  CreateQuizInput,
  UpdateQuizInput,
  PublishQuizInput,
  QuizQueryParams,
} from './quiz.validation.js';

// Deterministic array shuffle helper for randomization
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export class QuizService {
  async createQuiz(input: CreateQuizInput) {
    const topic = await prisma.topic.findUnique({
      where: { id: input.topicId },
      include: {
        unit: {
          include: { subject: true },
        },
      },
    });

    if (!topic) {
      throw new AppError(404, 'TOPIC_NOT_FOUND', 'Parent topic not found.');
    }

    const quiz = await prisma.quiz.create({
      data: {
        topicId: input.topicId,
        title: input.title.trim(),
        description: input.description?.trim(),
        difficulty: input.difficulty,
        duration: input.duration,
        passingPercentage: input.passingPercentage,
        maximumAttempts: input.maximumAttempts,
        negativeMarking: input.negativeMarking,
        correctMark: input.correctMark,
        incorrectMark: input.negativeMarking ? input.incorrectMark : 0.0,
        unansweredMark: input.unansweredMark,
        randomizeQuestions: input.randomizeQuestions,
        randomizeOptions: input.randomizeOptions,
        status: input.status || ContentStatus.DRAFT,
      },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            unitId: true,
          },
        },
      },
    });

    return quiz;
  }

  async getQuizzes(userRole: Role, params: QuizQueryParams) {
    const { topicId, difficulty, status } = params;

    const where: any = {
      ...(topicId ? { topicId } : {}),
      ...(difficulty ? { difficulty } : {}),
    };

    if (userRole === Role.STUDENT) {
      where.status = ContentStatus.PUBLISHED;
      where.topic = {
        status: ContentStatus.PUBLISHED,
        unit: {
          status: ContentStatus.PUBLISHED,
          subject: {
            status: ContentStatus.PUBLISHED,
          },
        },
      };
    } else if (status) {
      where.status = status;
    }

    const quizzes = await prisma.quiz.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { questions: true },
        },
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
    });

    return quizzes;
  }

  async getQuizById(id: string, userRole: Role) {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
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

    if (userRole === Role.STUDENT) {
      if (
        quiz.status !== ContentStatus.PUBLISHED ||
        quiz.topic.status !== ContentStatus.PUBLISHED ||
        quiz.topic.unit.status !== ContentStatus.PUBLISHED ||
        quiz.topic.unit.subject.status !== ContentStatus.PUBLISHED
      ) {
        throw new AppError(404, 'QUIZ_NOT_FOUND', 'Quiz is not available.');
      }

      // Sanitize response for student: STRIP isCorrect from options & apply randomization
      let questions = quiz.questions.map((q) => {
        let options = q.options.map((opt) => ({
          id: opt.id,
          optionText: opt.optionText,
          displayOrder: opt.displayOrder,
          // CRITICAL SECURITY: isCorrect is NEVER returned to students
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
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        duration: quiz.duration,
        passingPercentage: quiz.passingPercentage,
        maximumAttempts: quiz.maximumAttempts,
        negativeMarking: quiz.negativeMarking,
        correctMark: quiz.correctMark,
        incorrectMark: quiz.incorrectMark,
        unansweredMark: quiz.unansweredMark,
        totalQuestions: questions.length,
        status: quiz.status,
        topic: {
          id: quiz.topic.id,
          title: quiz.topic.title,
          unit: {
            id: quiz.topic.unit.id,
            title: quiz.topic.unit.title,
            subject: {
              id: quiz.topic.unit.subject.id,
              name: quiz.topic.unit.subject.name,
            },
          },
        },
        questions,
      };
    }

    // Admin response includes questions and options with isCorrect and explanations
    return quiz;
  }

  async updateQuiz(id: string, input: UpdateQuizInput) {
    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) {
      throw new AppError(404, 'QUIZ_NOT_FOUND', 'Quiz not found.');
    }

    const updated = await prisma.quiz.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description?.trim() } : {}),
        ...(input.difficulty ? { difficulty: input.difficulty } : {}),
        ...(input.duration !== undefined ? { duration: input.duration } : {}),
        ...(input.passingPercentage !== undefined ? { passingPercentage: input.passingPercentage } : {}),
        ...(input.maximumAttempts !== undefined ? { maximumAttempts: input.maximumAttempts } : {}),
        ...(input.negativeMarking !== undefined ? { negativeMarking: input.negativeMarking } : {}),
        ...(input.correctMark !== undefined ? { correctMark: input.correctMark } : {}),
        ...(input.incorrectMark !== undefined ? { incorrectMark: input.incorrectMark } : {}),
        ...(input.unansweredMark !== undefined ? { unansweredMark: input.unansweredMark } : {}),
        ...(input.randomizeQuestions !== undefined ? { randomizeQuestions: input.randomizeQuestions } : {}),
        ...(input.randomizeOptions !== undefined ? { randomizeOptions: input.randomizeOptions } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
    });

    return updated;
  }

  async publishQuiz(id: string, input: PublishQuizInput) {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new AppError(404, 'QUIZ_NOT_FOUND', 'Quiz not found.');
    }

    if (input.status === ContentStatus.PUBLISHED) {
      // Validate quiz publication criteria
      if (quiz.questions.length === 0) {
        throw new AppError(
          400,
          'INVALID_QUIZ_CONFIGURATION',
          'Cannot publish an empty quiz. Add at least one question before publishing.'
        );
      }

      for (const question of quiz.questions) {
        if (
          question.questionType === QuestionType.SINGLE_CHOICE ||
          question.questionType === QuestionType.TRUE_FALSE
        ) {
          if (question.options.length < 2) {
            throw new AppError(
              400,
              'INVALID_QUIZ_CONFIGURATION',
              `Question "${question.questionText.slice(0, 40)}..." must have at least 2 options.`
            );
          }

          const correctCount = question.options.filter((opt) => opt.isCorrect).length;
          if (correctCount !== 1) {
            throw new AppError(
              400,
              'INVALID_QUIZ_CONFIGURATION',
              `Question "${question.questionText.slice(0, 40)}..." must have exactly 1 correct option (found ${correctCount}).`
            );
          }
        }
      }
    }

    const updated = await prisma.quiz.update({
      where: { id },
      data: { status: input.status },
    });

    return updated;
  }

  async deleteQuiz(id: string) {
    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) {
      throw new AppError(404, 'QUIZ_NOT_FOUND', 'Quiz not found.');
    }

    await prisma.quiz.delete({ where: { id } });
    return { deleted: true };
  }
}

export const quizService = new QuizService();
