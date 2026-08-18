import { z } from 'zod';
import { ContentType, Difficulty, ContentStatus } from '@prisma/client';

export const createContentSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(300),
  contentType: z.nativeEnum(ContentType).default(ContentType.TEXT),
  body: z.string().min(1, 'Body content is required'),
  displayOrder: z.coerce.number().int().min(1).default(1),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
  status: z.nativeEnum(ContentStatus).optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateContentSchema = z.object({
  title: z.string().min(2).max(300).optional(),
  contentType: z.nativeEnum(ContentType).optional(),
  body: z.string().min(1).optional(),
  displayOrder: z.coerce.number().int().min(1).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  status: z.nativeEnum(ContentStatus).optional(),
  metadata: z.record(z.any()).optional(),
});

export const contentIdParamSchema = z.object({
  id: z.string().uuid('Invalid content ID format'),
});

export const topicIdParamSchema = z.object({
  topicId: z.string().uuid('Invalid topic ID format'),
});

export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
