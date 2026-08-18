import { z } from 'zod';

export const adminXPAdjustSchema = z.object({
  targetUserId: z.string().uuid('Invalid user ID'),
  amount: z.number().int('Amount must be an integer'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
});

export type AdminXPAdjustInput = z.infer<typeof adminXPAdjustSchema>;
