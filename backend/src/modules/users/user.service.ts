import { Role, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.middleware.js';
import { UpdateUserInput, UpdateStatusInput, UserQueryParams } from './user.validation.js';

export class UserService {
  async getUsers(params: UserQueryParams) {
    const { role, status, search, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found.');
    }

    return user;
  }

  async updateUser(id: string, input: UpdateUserInput, requesterRole: Role, requesterId: string) {
    // If not admin, cannot update other users and cannot change role
    if (requesterRole !== Role.ADMIN) {
      if (requesterId !== id) {
        throw new AppError(403, 'FORBIDDEN', 'Cannot update profile of other users.');
      }
      if (input.role && input.role !== requesterRole) {
        throw new AppError(403, 'FORBIDDEN', 'Cannot modify own role.');
      }
    }

    if (input.email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: input.email.toLowerCase(),
          NOT: { id },
        },
      });
      if (existing) {
        throw new AppError(409, 'EMAIL_EXISTS', 'Email address is already in use by another account.');
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.email ? { email: input.email.toLowerCase() } : {}),
        ...(input.role && requesterRole === Role.ADMIN ? { role: input.role } : {}),
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

    return updated;
  }

  async updateStatus(id: string, input: UpdateStatusInput) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found.');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: input.status },
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

    return updated;
  }

  async deleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found.');
    }

    await prisma.user.delete({ where: { id } });
    return { deleted: true };
  }
}

export const userService = new UserService();
