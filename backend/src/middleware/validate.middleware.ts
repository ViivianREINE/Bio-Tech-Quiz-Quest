import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/apiResponse.js';

export const validateRequest =
  (schema: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
  }) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(
          res,
          400,
          'VALIDATION_ERROR',
          'Invalid request parameters or payload',
          error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        );
        return;
      }
      next(error);
    }
  };
