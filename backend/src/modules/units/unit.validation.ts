import { z } from 'zod';
import { ContentStatus } from '@prisma/client';

export const createUnitSchema = z.object({
  title: z.string().min(2, 'Unit title must be at least 2 characters').max(200),
  description: z.string().max(1000).optional(),
  unitNumber: z.coerce.number().int().min(1, 'Unit number must be at least 1'),
  displayOrder: z.coerce.number().int().min(1).default(1),
  status: z.nativeEnum(ContentStatus).optional(),
});

export const updateUnitSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).optional(),
  unitNumber: z.coerce.number().int().min(1).optional(),
  displayOrder: z.coerce.number().int().min(1).optional(),
  status: z.nativeEnum(ContentStatus).optional(),
});

export const unitIdParamSchema = z.object({
  id: z.string().uuid('Invalid unit ID format'),
});

export const subjectIdParamSchema = z.object({
  subjectId: z.string().uuid('Invalid subject ID format'),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
