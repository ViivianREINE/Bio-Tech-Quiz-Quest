import { z } from 'zod';
import { AttemptStatus } from '@prisma/client';

export const submitAnswerItemSchema = z.object({
  questionId: z.string().uuid('Invalid question ID format'),
  selectedOptionId: z.string().uuid('Invalid option ID format').nullable().optional(),
});

export const submitQuizSchema = z.object({
  answers: z.array(submitAnswerItemSchema).default([]),
});

export const attemptIdParamSchema = z.object({
  id: z.string().uuid('Invalid attempt ID format'),
});

export const quizIdParamSchema = z.object({
  quizId: z.string().uuid('Invalid quiz ID format'),
});

export const attemptQuerySchema = z.object({
  quizId: z.string().uuid().optional(),
  status: z.nativeEnum(AttemptStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SubmitAnswerItem = z.infer<typeof submitAnswerItemSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type AttemptQueryParams = z.infer<typeof attemptQuerySchema>;
