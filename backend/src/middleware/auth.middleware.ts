import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { verifyToken } from '../utils/jwt.js';
import { prisma } from '../config/prisma.js';
import { sendError } from '../utils/apiResponse.js';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication token is required.');
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication token is required.');
      return;
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      sendError(res, 401, 'INVALID_TOKEN', 'Authentication token is invalid or expired.');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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
      sendError(res, 401, 'USER_NOT_FOUND', 'User associated with this token no longer exists.');
      return;
    }

    if (user.status === 'INACTIVE') {
      sendError(res, 403, 'ACCOUNT_INACTIVE', 'Account is deactivated. Please contact support.');
      return;
    }

    if (user.status === 'SUSPENDED') {
      sendError(res, 403, 'ACCOUNT_SUSPENDED', 'Account is suspended due to violations.');
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
