import { Router } from 'express';
import * as controller from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authLimiter, resetLimiter } from '../../middleware/rateLimiter.js';
import { validate, signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.validation.js';

const router = Router();

// Public routes
router.post('/signup',          authLimiter, validate(signupSchema),          controller.signup);
router.post('/login',           authLimiter, validate(loginSchema),           controller.login);
router.post('/refresh',                                                        controller.refresh);
router.post('/forgot-password', resetLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password',  resetLimiter, validate(resetPasswordSchema),  controller.resetPassword);

// Protected routes
router.post('/logout',          authenticate, controller.logout);
router.post('/onboarding',      authenticate, controller.completeOnboarding);
router.get('/me',               authenticate, controller.getMe);

export { router as authRouter };
