import { z } from 'zod';
import { ContentStatus } from '@prisma/client';

export const createSubjectSchema = z.object({
  name: z.string().min(2, 'Subject name must be at least 2 characters').max(150),
  description: z.string().max(1000).optional(),
  status: z.nativeEnum(ContentStatus).optional(),
});

export const updateSubjectSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  description: z.string().max(1000).optional(),
  status: z.nativeEnum(ContentStatus).optional(),
});

export const publishSubjectSchema = z.object({
  status: z.nativeEnum(ContentStatus),
});

export const subjectIdParamSchema = z.object({
  id: z.string().uuid('Invalid subject ID format'),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type PublishSubjectInput = z.infer<typeof publishSubjectSchema>;
