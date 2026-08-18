import { ContentStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.middleware.js';
import { CreateQuestionInput, UpdateQuestionInput } from './question.validation.js';
import { shuffleArray } from '../quizzes/quiz.service.js';

export class QuestionService {
  async createQuestion(quizId: string, input: CreateQuestionInput) {
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      throw new AppError(404, 'QUIZ_NOT_FOUND', 'Quiz not found.');
    }

    const question = await prisma.$transaction(async (tx) => {
      const createdQuestion = await tx.question.create({
        data: {
          quizId,
          questionText: input.questionText.trim(),
          questionType: input.questionType,
          explanation: input.explanation?.trim(),
          marks: input.marks,
          difficulty: input.difficulty,
          displayOrder: input.displayOrder || 1,
        },
      });

      const optionData = input.options.map((opt, index) => ({
        questionId: createdQuestion.id,
        optionText: opt.optionText.trim(),
        displayOrder: opt.displayOrder || index + 1,
        isCorrect: opt.isCorrect,
      }));

      await tx.option.createMany({
        data: optionData,
      });

      return tx.question.findUnique({
        where: { id: createdQuestion.id },
        include: {
          options: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
    });

    return question;
  }

  async getQuestionsByQuiz(quizId: string, userRole: Role) {
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

    if (userRole === Role.STUDENT) {
      if (
        quiz.status !== ContentStatus.PUBLISHED ||
        quiz.topic.status !== ContentStatus.PUBLISHED ||
        quiz.topic.unit.status !== ContentStatus.PUBLISHED ||
        quiz.topic.unit.subject.status !== ContentStatus.PUBLISHED
      ) {
        throw new AppError(404, 'QUIZ_NOT_FOUND', 'Quiz is not available.');
      }

      let questions = quiz.questions.map((q) => {
        let options = q.options.map((opt) => ({
          id: opt.id,
          optionText: opt.optionText,
          displayOrder: opt.displayOrder,
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

      return questions;
    }

    return quiz.questions;
  }

  async updateQuestion(id: string, input: UpdateQuestionInput) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });

    if (!question) {
      throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.question.update({
        where: { id },
        data: {
          ...(input.questionText ? { questionText: input.questionText.trim() } : {}),
          ...(input.questionType ? { questionType: input.questionType } : {}),
          ...(input.explanation !== undefined ? { explanation: input.explanation?.trim() } : {}),
          ...(input.marks !== undefined ? { marks: input.marks } : {}),
          ...(input.difficulty ? { difficulty: input.difficulty } : {}),
          ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
        },
      });

      if (input.options && input.options.length > 0) {
        // Delete previous options and recreate
        await tx.option.deleteMany({ where: { questionId: id } });
        await tx.option.createMany({
          data: input.options.map((opt, index) => ({
            questionId: id,
            optionText: opt.optionText.trim(),
            displayOrder: opt.displayOrder || index + 1,
            isCorrect: opt.isCorrect,
          })),
        });
      }

      return tx.question.findUnique({
        where: { id },
        include: {
          options: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
    });

    return updated;
  }

  async deleteQuestion(id: string) {
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) {
      throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found.');
    }

    await prisma.question.delete({ where: { id } });
    return { deleted: true };
  }
}

export const questionService = new QuestionService();
