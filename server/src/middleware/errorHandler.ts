import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user?.id,
  });

  // Handle API errors
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint failed
        return res.status(409).json({
          error: 'A record with this value already exists',
        });
      case 'P2014': // Required relation not found
        return res.status(404).json({
          error: 'Related record not found',
        });
      case 'P2003': // Foreign key constraint failed
        return res.status(400).json({
          error: 'Invalid reference to related record',
        });
      case 'P2025': // Record not found
        return res.status(404).json({
          error: 'Record not found',
        });
      default:
        return res.status(500).json({
          error: 'Database error occurred',
          ...(process.env.NODE_ENV === 'development' && {
            code: error.code,
            meta: error.meta,
          }),
        });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      error: 'Invalid data provided',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: error.message,
    });
  }

  // Handle Stripe errors
  if (error.name === 'StripeError') {
    const stripeError = error as any;
    return res.status(stripeError.statusCode || 500).json({
      error: stripeError.message,
      type: stripeError.type,
      ...(process.env.NODE_ENV === 'development' && {
        code: stripeError.code,
        decline_code: stripeError.decline_code,
      }),
    });
  }

  // Handle multer errors
  if (error.name === 'MulterError') {
    return res.status(400).json({
      error: 'File upload error',
      details: error.message,
    });
  }

  // Handle rate limit errors
  if (error.name === 'TooManyRequests') {
    return res.status(429).json({
      error: 'Too many requests, please try again later',
    });
  }

  // Handle all other errors
  return res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      message: error.message,
      stack: error.stack,
    }),
  });
};