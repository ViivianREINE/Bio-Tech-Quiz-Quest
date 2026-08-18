import { z } from 'zod';
import { AttemptStatus } from '@prisma/client';

export const adminDateRangeQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const adminAttemptQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID format').optional(),
  quizId: z.string().uuid('Invalid quiz ID format').optional(),
  subjectId: z.string().uuid('Invalid subject ID format').optional(),
  status: z.nativeEnum(AttemptStatus).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const studentPerformanceParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

export const adminAttemptIdParamSchema = z.object({
  id: z.string().uuid('Invalid attempt ID format'),
});

export type AdminDateRangeQuery = z.infer<typeof adminDateRangeQuerySchema>;
export type AdminAttemptQueryParams = z.infer<typeof adminAttemptQuerySchema>;
export type StudentPerformanceParams = z.infer<typeof studentPerformanceParamSchema>;
export type AdminAttemptIdParams = z.infer<typeof adminAttemptIdParamSchema>;
