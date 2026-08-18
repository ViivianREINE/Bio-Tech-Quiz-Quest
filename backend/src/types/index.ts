import { Request } from 'express';
import { Role, UserStatus } from '@prisma/client';

export interface UserJwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}
