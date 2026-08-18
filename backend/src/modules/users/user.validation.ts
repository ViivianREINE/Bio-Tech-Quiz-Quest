import { z } from 'zod';
import { Role, UserStatus } from '@prisma/client';

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

export const userQuerySchema = z.object({
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type UserQueryParams = z.infer<typeof userQuerySchema>;
