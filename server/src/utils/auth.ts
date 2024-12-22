import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ApiError } from './ApiError';
import { redis } from '../services/redis';

interface TokenPayload {
  id: string;
  role: string;
  email: string;
}

// Generate access and refresh tokens
export const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Verify refresh token
export const verifyRefreshToken = async (token: string): Promise<TokenPayload> => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET!
    ) as TokenPayload & { type: string };

    if (decoded.type !== 'refresh') {
      throw new ApiError(401, 'Invalid token type');
    }

    return {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'Refresh token expired');
    }
    throw new ApiError(401, 'Invalid refresh token');
  }
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare password
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate verification token
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate reset token
export const generateResetToken = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(32).toString('hex');
  await redis.set(
    `reset_token:${token}`,
    userId,
    'EX',
    60 * 60 // 1 hour
  );
  return token;
};

// Verify reset token
export const verifyResetToken = async (token: string): Promise<string> => {
  const userId = await redis.get(`reset_token:${token}`);
  if (!userId) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }
  return userId;
};

// Invalidate token
export const invalidateToken = async (token: string): Promise<void> => {
  const decoded = jwt.decode(token) as { exp: number } | null;
  if (decoded?.exp) {
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redis.set(`bl_${token}`, '1', 'EX', ttl);
    }
  }
};

// Generate temp auth token (for email verification, password reset, etc.)
export const generateTempToken = async (
  type: string,
  userId: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> => {
  const token = crypto.randomBytes(32).toString('hex');
  await redis.set(
    `${type}_token:${token}`,
    userId,
    'EX',
    expiresIn
  );
  return token;
};

// Verify temp token
export const verifyTempToken = async (
  type: string,
  token: string
): Promise<string> => {
  const userId = await redis.get(`${type}_token:${token}`);
  if (!userId) {
    throw new ApiError(400, 'Invalid or expired token');
  }
  await redis.del(`${type}_token:${token}`);
  return userId;
};

// Validate password strength
export const validatePassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};

// Check if user is authenticated
export const isAuthenticated = (user: any): boolean => {
  return !!user && user.verified;
};

// Check if user has required role
export const hasRole = (user: any, requiredRole: string | string[]): boolean => {
  if (!user) return false;
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(user.role);
};