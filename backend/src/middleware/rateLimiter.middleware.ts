import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/apiResponse.js';
import { env } from '../config/env.js';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 1000 : 50, // Higher limit in tests
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      429,
      'TOO_MANY_REQUESTS',
      'Too many login/registration attempts. Please try again after 15 minutes.'
    );
  },
});
