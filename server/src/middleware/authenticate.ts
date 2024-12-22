import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { redis } from '../services/redis';

declare global {
  namespace Express {
    interface Request {
      user: any;
      token: string;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ApiError(401, 'No token provided');
    }

    // Check token blacklist
    const isBlacklisted = await redis.get(`bl_${token}`);
    if (isBlacklisted) {
      throw new ApiError(401, 'Token has been invalidated');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (!decoded) {
      throw new ApiError(401, 'Invalid token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        full_name: true,
        role: true,
        status: true,
        verified: true,
        stripe_customer_id: true,
      },
    });

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (user.status === 'suspended') {
      throw new ApiError(403, 'Account suspended');
    }

    // Update last activity
    await prisma.user.update({
      where: { id: user.id },
      data: { last_seen: new Date() },
    });

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'Token expired'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, 'Invalid token'));
    }
    logger.error('Authentication error:', error);
    next(error);
  }
};