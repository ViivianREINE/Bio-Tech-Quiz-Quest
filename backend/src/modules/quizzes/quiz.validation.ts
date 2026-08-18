import { z } from 'zod';
import { Difficulty, ContentStatus } from '@prisma/client';

export const createQuizSchema = z.object({
  topicId: z.string().uuid('Invalid topic ID format'),
  title: z.string().min(2, 'Quiz title must be at least 2 characters').max(200),
  description: z.string().max(2000).optional(),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
  duration: z.coerce.number().int().min(1, 'Duration must be at least 1 minute').max(300),
  passingPercentage: z.coerce.number().min(0).max(100).default(50.0),
  maximumAttempts: z.coerce.number().int().min(1).default(3),
  negativeMarking: z.boolean().default(false),
  correctMark: z.coerce.number().min(0.1, 'Correct mark must be positive').default(1.0),
  incorrectMark: z.coerce.number().min(0).default(0.0),
  unansweredMark: z.coerce.number().default(0.0),
  randomizeQuestions: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
  status: z.nativeEnum(ContentStatus).optional(),
});

export const updateQuizSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  duration: z.coerce.number().int().min(1).max(300).optional(),
  passingPercentage: z.coerce.number().min(0).max(100).optional(),
  maximumAttempts: z.coerce.number().int().min(1).optional(),
  negativeMarking: z.boolean().optional(),
  correctMark: z.coerce.number().min(0.1).optional(),
  incorrectMark: z.coerce.number().min(0).optional(),
  unansweredMark: z.coerce.number().optional(),
  randomizeQuestions: z.boolean().optional(),
  randomizeOptions: z.boolean().optional(),
  status: z.nativeEnum(ContentStatus).optional(),
});

export const publishQuizSchema = z.object({
  status: z.nativeEnum(ContentStatus),
});

export const quizIdParamSchema = z.object({
  id: z.string().uuid('Invalid quiz ID format'),
});

export const quizQuerySchema = z.object({
  topicId: z.string().uuid().optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  status: z.nativeEnum(ContentStatus).optional(),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type PublishQuizInput = z.infer<typeof publishQuizSchema>;
export type QuizQueryParams = z.infer<typeof quizQuerySchema>;
