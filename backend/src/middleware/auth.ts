import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { sendError } from '../utils/response.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      sendError(res, 'Access token required', 401);
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let payload: JwtPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (err: unknown) {
      const isExpired = err instanceof Error && err.message === 'jwt expired';
      sendError(res, isExpired ? 'Token expired' : 'Invalid token', 401);
      return;
    }

    // Confirm user still exists
    const user = await User.findById(payload.userId).select('_id email');
    if (!user) {
      sendError(res, 'User no longer exists', 401);
      return;
    }

    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch (error) {
    next(error);
  }
};

// Optional: attach user if token present, don't block if not
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyAccessToken(token);
      req.user = { userId: payload.userId, email: payload.email };
    }
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
  next();
};
