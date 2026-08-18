import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserJwtPayload } from '../types/index.js';

export const signToken = (payload: UserJwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): UserJwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as UserJwtPayload;
};
