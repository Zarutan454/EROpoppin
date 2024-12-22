type ErrorType = 'network' | 'validation' | 'auth' | 'unknown';

interface AppError extends Error {
  type: ErrorType;
  statusCode?: number;
}

class CustomError extends Error implements AppError {
  type: ErrorType;
  statusCode?: number;

  constructor(message: string, type: ErrorType = 'unknown', statusCode?: number) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.name = 'CustomError';
  }
}

export const handleError = (error: Error | AppError | unknown): AppError => {
  if (error instanceof CustomError) {
    return error;
  }

  if (error instanceof Error) {
    // Netzwerkfehler erkennen
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new CustomError(
        'Netzwerkfehler aufgetreten. Bitte überprüfen Sie Ihre Internetverbindung.',
        'network'
      );
    }

    // Authentifizierungsfehler
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      return new CustomError(
        'Authentifizierungsfehler. Bitte melden Sie sich erneut an.',
        'auth',
        401
      );
    }

    return new CustomError(error.message, 'unknown');
  }

  return new CustomError('Ein unbekannter Fehler ist aufgetreten.', 'unknown');
};

export const logError = (error: AppError): void => {
  // In Produktion würden wir hier einen error logging service wie Sentry verwenden
  console.error(`[${error.type.toUpperCase()}] ${error.message}`, {
    type: error.type,
    statusCode: error.statusCode,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
};

export const showErrorMessage = (error: AppError): string => {
  switch (error.type) {
    case 'network':
      return 'Netzwerkfehler aufgetreten. Bitte überprüfen Sie Ihre Internetverbindung.';
    case 'validation':
      return 'Bitte überprüfen Sie Ihre Eingaben.';
    case 'auth':
      return 'Bitte melden Sie sich erneut an.';
    default:
      return 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
  }
};

export { CustomError, type AppError, type ErrorType };