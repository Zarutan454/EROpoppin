import { Request, Response, NextFunction } from 'express';
import { validationResult, matchedData } from 'express-validator';
import { ApiError } from '../utils/ApiError';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));

    throw new ApiError(400, 'Validation error', formattedErrors);
  }

  // Replace request body with sanitized data
  req.body = matchedData(req, {
    locations: ['body'],
    includeOptionals: true,
  });

  next();
};