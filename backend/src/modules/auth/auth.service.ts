import crypto from 'crypto';
import { User, IUser } from '../../models/User.js';
import {
  signAccessToken,
  generateRefreshToken,
  saveRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  generateResetToken,
} from '../../utils/jwt.js';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from '../../utils/email.js';
import { AppError } from '../../utils/response.js';
import { env } from '../../config/env.js';
import mongoose from 'mongoose';

interface SignupInput {
  name: string;
  email: string;
  password: string;
  publicKey?: string;
  encryptedPrivateKey?: string;
  encryptionSalt?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Partial<IUser>;
}

export class AuthService {

  // SIGNUP
  async signup(data: SignupInput, deviceInfo: string, ip: string): Promise<AuthTokens> {
    const existing = await User.findOne({ email: data.email });
    if (existing) throw new AppError('An account with this email already exists', 409);

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      publicKey: data.publicKey || '',
      encryptedPrivateKey: data.encryptedPrivateKey || '',
      encryptionSalt: data.encryptionSalt || '',
    });

    // Generate tokens
    const accessToken = signAccessToken({ userId: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(user._id, refreshToken, deviceInfo, ip);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  // LOGIN
  async login(email: string, password: string, deviceInfo: string, ip: string): Promise<AuthTokens> {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new AppError('Invalid email or password', 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new AppError('Invalid email or password', 401);

    // Generate tokens
    const accessToken = signAccessToken({ userId: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(user._id, refreshToken, deviceInfo, ip);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  // REFRESH TOKEN
  async refresh(rawRefreshToken: string, deviceInfo: string, ip: string): Promise<AuthTokens> {
    const tokenRecord = await validateRefreshToken(rawRefreshToken);
    if (!tokenRecord) throw new AppError('Invalid or expired refresh token', 401);

    const user = await User.findById(tokenRecord.userId);
    if (!user) throw new AppError('User not found', 401);

    // Rotate refresh token (revoke old, issue new)
    await revokeRefreshToken(rawRefreshToken);
    const newRefreshToken = generateRefreshToken();
    await saveRefreshToken(user._id, newRefreshToken, deviceInfo, ip);

    const accessToken = signAccessToken({ userId: user._id.toString(), email: user.email });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: this.sanitizeUser(user),
    };
  }

  // LOGOUT
  async logout(rawRefreshToken?: string, userId?: string): Promise<void> {
    if (rawRefreshToken) {
      await revokeRefreshToken(rawRefreshToken);
    } else if (userId) {
      // Logout all devices
      await revokeAllUserTokens(new mongoose.Types.ObjectId(userId));
    }
  }

  // FORGOT PASSWORD
  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    // Always return success to prevent email enumeration
    if (!user) return;

    const { raw, hashed } = generateResetToken();
    user.passwordResetToken = hashed;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${raw}`;

    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (err) {
      // Rollback token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw new AppError('Email could not be sent. Please try again.', 500);
    }
  }

  // RESET PASSWORD
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) throw new AppError('Reset token is invalid or has expired', 400);

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all refresh tokens for security
    await revokeAllUserTokens(user._id);
  }

  // COMPLETE ONBOARDING
  async completeOnboarding(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { onboardingComplete: true });
  }

  // GET ME
  async getMe(userId: string): Promise<Partial<IUser>> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return this.sanitizeUser(user);
  }

  // HELPERS
  private sanitizeUser(user: IUser): Partial<IUser> {
    const obj = user.toJSON() as Record<string, unknown>;
    delete obj.password;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpires;
    return obj as Partial<IUser>;
  }
}

export const authService = new AuthService();
