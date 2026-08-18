import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/apiResponse.js';
import { env } from '../config/env.js';

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  if (err instanceof ZodError) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', err.errors);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      return sendError(
        res,
        409,
        'DUPLICATE_ENTITY',
        `A record with that unique field (${target.join(', ') || 'field'}) already exists.`
      );
    }
    if (err.code === 'P2025') {
      return sendError(res, 404, 'NOT_FOUND', 'Requested resource was not found.');
    }
    if (err.code === 'P2003') {
      return sendError(res, 400, 'FOREIGN_KEY_VIOLATION', 'Foreign key constraint failed.');
    }
  }

  if (env.NODE_ENV !== 'production') {
    console.error('Unhandled server error:', err);
  }

  return sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    'An unexpected internal server error occurred.'
  );
};
