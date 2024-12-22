export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: any) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message: string = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message: string = 'Not found') {
    return new ApiError(404, message);
  }

  static conflict(message: string, details?: any) {
    return new ApiError(409, message, details);
  }

  static unprocessableEntity(message: string, details?: any) {
    return new ApiError(422, message, details);
  }

  static tooManyRequests(message: string = 'Too many requests') {
    return new ApiError(429, message);
  }

  static internal(message: string = 'Internal server error') {
    return new ApiError(500, message);
  }
}