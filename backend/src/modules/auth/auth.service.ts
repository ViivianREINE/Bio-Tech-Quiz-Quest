import { Role, UserStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';
import { AppError } from '../../middleware/errorHandler.middleware.js';
import { RegisterInput, LoginInput } from './auth.validation.js';

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', 'A user with this email already exists.');
    }

    const passwordHash = await hashPassword(input.password);

    // Hardcode STUDENT role during self-registration to prevent privilege escalation
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user,
      token,
    };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new AppError(403, 'ACCOUNT_INACTIVE', 'Account is deactivated. Please contact support.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError(403, 'ACCOUNT_SUSPENDED', 'Account is suspended due to violations.');
    }

    const isMatch = await comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  }
}

export const authService = new AuthService();
