import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { RefreshToken } from '../models/RefreshToken.js';
import mongoose from 'mongoose';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// ACCESS TOKEN
export const signAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    algorithm: 'HS256',
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
};

// REFRESH TOKEN
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const saveRefreshToken = async (
  userId: mongoose.Types.ObjectId,
  rawToken: string,
  deviceInfo: string,
  ipAddress: string
): Promise<void> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await RefreshToken.create({
    userId,
    tokenHash: hashToken(rawToken),
    deviceInfo,
    ipAddress,
    expiresAt,
  });
};

export const validateRefreshToken = async (
  rawToken: string
): Promise<InstanceType<typeof RefreshToken> | null> => {
  const tokenHash = hashToken(rawToken);
  const found = await RefreshToken.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });
  return found;
};

export const revokeRefreshToken = async (rawToken: string): Promise<void> => {
  await RefreshToken.deleteOne({ tokenHash: hashToken(rawToken) });
};

export const revokeAllUserTokens = async (
  userId: mongoose.Types.ObjectId
): Promise<void> => {
  await RefreshToken.deleteMany({ userId });
};

// ── PASSWORD RESET TOKEN ──
export const generateResetToken = (): { raw: string; hashed: string } => {
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hashed };
};

// ── COOKIE OPTIONS ──
export const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/',
});

export const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
});
