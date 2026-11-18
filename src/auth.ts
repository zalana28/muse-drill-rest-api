import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config';
import { findUser } from './store';
import { ApiError } from './errors';

export interface AuthPayload {
  sub: string;
  username: string;
}

// Attach the verified JWT payload to Express's Request type.
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthPayload;
  }
}

/** Validate credentials and return a signed JWT. Throws ApiError(401) on failure. */
export function login(username: string, password: string): string {
  const user = findUser(username);
  if (!user || user.password !== password) {
    throw new ApiError(401, 'Invalid credentials');
  }
  const payload: AuthPayload = { sub: user.id, username: user.username };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

/** Express middleware: require a valid `Authorization: Bearer <token>` header. */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    next(new ApiError(401, 'Missing token'));
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof decoded.sub !== 'string'
    ) {
      next(new ApiError(401, 'Invalid token'));
      return;
    }
    req.user = {
      sub: decoded.sub,
      username:
        typeof decoded.username === 'string' ? decoded.username : '',
    };
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}
