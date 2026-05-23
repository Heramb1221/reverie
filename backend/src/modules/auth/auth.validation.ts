import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name too long')
      .trim(),
    email: z
      .string()
      .email('Invalid email address')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and a number'
      ),
    // E2E encryption keys generated client-side
    publicKey: z.string().optional().default(''),
    encryptedPrivateKey: z.string().optional().default(''),
    encryptionSalt: z.string().optional().default(''),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email').toLowerCase().trim(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and a number'
      ),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60).trim().optional(),
    theme: z.enum(['light', 'dark']).optional(),
    notificationsEnabled: z.boolean().optional(),
    reminderFrequency: z.enum(['daily', 'every3days', 'weekly']).optional(),
    // E2E key update (on password change)
    publicKey: z.string().optional(),
    encryptedPrivateKey: z.string().optional(),
    encryptionSalt: z.string().optional(),
  }),
});

// Generic Zod validator middleware
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../../utils/response';

export const validate = (schema: z.ZodObject<z.ZodRawShape>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!result.success) {
      const message = result.error.errors[0]?.message || 'Validation failed';
      sendError(res, message, 422);
      return;
    }
    // Merge validated data back
    if (result.data.body) req.body = result.data.body;
    next();
  };
