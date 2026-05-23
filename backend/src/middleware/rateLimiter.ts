import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Too many requests. Please slow down.', 429);
  },
});

// Stricter limiter for auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failures
  handler: (_req, res) => {
    sendError(res, 'Too many authentication attempts. Try again in 15 minutes.', 429);
  },
});

// Very strict limiter for password reset
export const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  handler: (_req, res) => {
    sendError(res, 'Too many reset attempts. Try again in an hour.', 429);
  },
});

// AI generation limiter
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 AI generations per hour
  handler: (_req, res) => {
    sendError(res, 'AI reflection generation limit reached. Try again later.', 429);
  },
});
