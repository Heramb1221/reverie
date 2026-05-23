import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { getRefreshCookieOptions, getClearCookieOptions } from '../../utils/jwt.js';
import { env } from '../../config/env.js';

const REFRESH_TOKEN_COOKIE = 'reverie_refresh';

// SIGNUP
export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip || '';

    const result = await authService.signup(req.body, deviceInfo, ip);

    if (!req.headers['x-mobile-client']) {
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, getRefreshCookieOptions());
    }

    sendSuccess(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        // For mobile: send refresh token in body (stored in SecureStore)
        ...(req.headers['x-mobile-client'] ? { refreshToken: result.refreshToken } : {}),
      },
      'Account created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

// LOGIN
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip || '';

    const result = await authService.login(req.body.email, req.body.password, deviceInfo, ip);

    if (!req.headers['x-mobile-client']) {
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, getRefreshCookieOptions());
    }

    sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
      ...(req.headers['x-mobile-client'] ? { refreshToken: result.refreshToken } : {}),
    });
  } catch (error) {
    next(error);
  }
};

// REFRESH
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Web: get from cookie; Mobile: get from body
    const rawToken =
      req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body?.refreshToken;

    if (!rawToken) {
      sendError(res, 'Refresh token required', 401);
      return;
    }

    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip || '';

    const result = await authService.refresh(rawToken, deviceInfo, ip);

    // Rotate cookie for web
    if (!req.headers['x-mobile-client']) {
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, getRefreshCookieOptions());
    }

    sendSuccess(res, {
      accessToken: result.accessToken,
      user: result.user,
      ...(req.headers['x-mobile-client'] ? { refreshToken: result.refreshToken } : {}),
    });
  } catch (error) {
    next(error);
  }
};

// LOGOUT
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawToken = req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body?.refreshToken;
    await authService.logout(rawToken, req.user?.userId);

    res.clearCookie(REFRESH_TOKEN_COOKIE, getClearCookieOptions());
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// FORGOT PASSWORD
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.forgotPassword(req.body.email);
    // Always return success (prevents email enumeration)
    sendSuccess(res, null, 'If that email exists, a reset link is on its way.');
  } catch (error) {
    next(error);
  }
};

// RESET PASSWORD
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    sendSuccess(res, null, 'Password reset successful. Please log in.');
  } catch (error) {
    next(error);
  }
};

// COMPLETE ONBOARDING
export const completeOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.completeOnboarding(req.user!.userId);
    sendSuccess(res, null, 'Onboarding complete');
  } catch (error) {
    next(error);
  }
};

// GET ME
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getMe(req.user!.userId);
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};
