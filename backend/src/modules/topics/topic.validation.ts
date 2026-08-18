import { z } from 'zod';
import { ContentStatus } from '@prisma/client';

export const createTopicSchema = z.object({
  title: z.string().min(2, 'Topic title must be at least 2 characters').max(200),
  description: z.string().max(2000).optional(),
  displayOrder: z.coerce.number().int().min(1).default(1),
  status: z.nativeEnum(ContentStatus).optional(),
});

export const updateTopicSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  displayOrder: z.coerce.number().int().min(1).optional(),
  status: z.nativeEnum(ContentStatus).optional(),
});

export const topicIdParamSchema = z.object({
  id: z.string().uuid('Invalid topic ID format'),
});

export const unitIdParamSchema = z.object({
  unitId: z.string().uuid('Invalid unit ID format'),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
