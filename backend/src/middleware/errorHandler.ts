import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError, sendError } from '../utils/response.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (env.NODE_ENV === 'development') {
    console.error('Error:', err);
  } else {
    console.error('Error:', err.message);
  }

  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map(e => e.message);
    sendError(res, messages.join('. '), 400);
    return;
  }

  if ((err as NodeJS.ErrnoException).name === 'MongoServerError' &&
      (err as { code?: number }).code === 11000) {
    const field = Object.keys((err as { keyPattern?: object }).keyPattern || {})[0];
    sendError(res, `${field} already exists`, 409);
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    sendError(res, `Invalid ${err.path}: ${err.value}`, 400);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 401);
    return;
  }
  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', 401);
    return;
  }

  // Multer error
  if (err.name === 'MulterError') {
    sendError(res, `Upload error: ${err.message}`, 400);
    return;
  }

  // Unknown/unhandled errors
  sendError(
    res,
    env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    500,
    err.stack
  );
};

export const notFound = (_req: Request, res: Response): void => {
  sendError(res, 'Route not found', 404);
};
