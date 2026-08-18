import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from '../types/index.js';
import { sendError } from '../utils/apiResponse.js';

export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        403,
        'FORBIDDEN',
        `Access denied. Requires one of roles: [${allowedRoles.join(', ')}].`
      );
      return;
    }

    next();
  };
};
