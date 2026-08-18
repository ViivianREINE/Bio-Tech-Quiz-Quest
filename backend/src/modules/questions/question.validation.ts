import { z } from 'zod';
import { QuestionType, Difficulty } from '@prisma/client';

export const optionInputSchema = z.object({
  id: z.string().uuid().optional(),
  optionText: z.string().min(1, 'Option text cannot be empty'),
  displayOrder: z.coerce.number().int().min(1).default(1),
  isCorrect: z.boolean().default(false),
});

export const createQuestionSchema = z
  .object({
    questionText: z.string().min(3, 'Question text must be at least 3 characters long'),
    questionType: z.nativeEnum(QuestionType).default(QuestionType.SINGLE_CHOICE),
    explanation: z.string().max(3000).optional(),
    marks: z.coerce.number().min(0.5, 'Marks must be at least 0.5').default(1.0),
    difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
    displayOrder: z.coerce.number().int().min(1).default(1),
    options: z
      .array(optionInputSchema)
      .min(2, 'A question must have at least 2 options for single choice or true/false'),
  })
  .refine(
    (data) => {
      if (
        data.questionType === QuestionType.SINGLE_CHOICE ||
        data.questionType === QuestionType.TRUE_FALSE
      ) {
        const correctCount = data.options.filter((opt) => opt.isCorrect).length;
        return correctCount === 1;
      }
      return true;
    },
    {
      message: 'Single Choice and True/False questions must have exactly ONE correct option.',
      path: ['options'],
    }
  );

export const updateQuestionSchema = z
  .object({
    questionText: z.string().min(3).optional(),
    questionType: z.nativeEnum(QuestionType).optional(),
    explanation: z.string().max(3000).optional(),
    marks: z.coerce.number().min(0.5).optional(),
    difficulty: z.nativeEnum(Difficulty).optional(),
    displayOrder: z.coerce.number().int().min(1).optional(),
    options: z.array(optionInputSchema).min(2).optional(),
  })
  .refine(
    (data) => {
      if (
        data.options &&
        (data.questionType === QuestionType.SINGLE_CHOICE ||
          data.questionType === QuestionType.TRUE_FALSE ||
          !data.questionType)
      ) {
        const correctCount = data.options.filter((opt) => opt.isCorrect).length;
        return correctCount === 1;
      }
      return true;
    },
    {
      message: 'Single Choice and True/False questions must have exactly ONE correct option.',
      path: ['options'],
    }
  );

export const questionIdParamSchema = z.object({
  id: z.string().uuid('Invalid question ID format'),
});

export const quizIdParamSchema = z.object({
  quizId: z.string().uuid('Invalid quiz ID format'),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
