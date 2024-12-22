import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db';
import { sendEmail } from '../services/email';
import { redis } from '../services/redis';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { generateTokens, verifyRefreshToken } from '../utils/auth';

// Registration
export const register = async (req: Request, res: Response) => {
  const { email, password, username, full_name } = req.body;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    });

    if (existingUser) {
      throw new ApiError(400, 'Email or username already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create verification token
    const verificationToken = uuidv4();

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        full_name,
        password: hashedPassword,
        verification_token: verificationToken,
      },
    });

    // Send verification email
    await sendEmail({
      to: email,
      subject: 'Verify your email',
      template: 'verification',
      context: {
        name: full_name,
        verificationUrl: `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token in Redis
    await redis.set(
      `refresh_token:${user.id}`,
      refreshToken,
      'EX',
      60 * 60 * 24 * 7 // 7 days
    );

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Check if user is verified
    if (!user.verified) {
      throw new ApiError(403, 'Please verify your email first');
    }

    // Check if user is suspended
    if (user.status === 'suspended') {
      throw new ApiError(403, 'Your account has been suspended');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token in Redis
    await redis.set(
      `refresh_token:${user.id}`,
      refreshToken,
      'EX',
      60 * 60 * 24 * 7 // 7 days
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    // Remove refresh token from Redis
    await redis.del(`refresh_token:${userId}`);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    throw error;
  }
};

// Refresh Token
export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  try {
    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);

    // Check if refresh token exists in Redis
    const storedToken = await redis.get(`refresh_token:${payload.id}`);
    if (!storedToken || storedToken !== refreshToken) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Update refresh token in Redis
    await redis.set(
      `refresh_token:${user.id}`,
      tokens.refreshToken,
      'EX',
      60 * 60 * 24 * 7 // 7 days
    );

    res.json(tokens);
  } catch (error) {
    logger.error('Refresh token error:', error);
    throw error;
  }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return res.json({
        message: 'If an account exists, a password reset email has been sent.',
      });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry,
      },
    });

    // Send reset email
    await sendEmail({
      to: email,
      subject: 'Reset your password',
      template: 'reset-password',
      context: {
        name: user.full_name,
        resetUrl: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
      },
    });

    res.json({
      message: 'If an account exists, a password reset email has been sent.',
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    throw error;
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_token_expiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      },
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    logger.error('Reset password error:', error);
    throw error;
  }
};

// Verify Email
export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.params;

  try {
    // Find user with verification token
    const user = await prisma.user.findFirst({
      where: { verification_token: token },
    });

    if (!user) {
      throw new ApiError(400, 'Invalid verification token');
    }

    // Update user verification status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        verification_token: null,
      },
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    logger.error('Email verification error:', error);
    throw error;
  }
};