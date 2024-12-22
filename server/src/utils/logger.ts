import winston from 'winston';
import 'winston-daily-rotate-file';
import { prisma } from '../db';

// Custom format for logging
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create file transport for error logs
const errorFileTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error',
});

// Create file transport for combined logs
const combinedFileTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

// Create console transport
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
});

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'api' },
  transports: [
    errorFileTransport,
    combinedFileTransport,
    ...(process.env.NODE_ENV !== 'production' ? [consoleTransport] : []),
  ],
});

// Add database logging transport
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.Stream({
      stream: {
        write: async (message: string) => {
          try {
            const logEntry = JSON.parse(message);
            await prisma.systemLog.create({
              data: {
                level: logEntry.level,
                message: logEntry.message,
                timestamp: new Date(logEntry.timestamp),
                metadata: logEntry,
              },
            });
          } catch (error) {
            console.error('Failed to write log to database:', error);
          }
        },
      },
    })
  );
}

// Add error event handler
logger.on('error', (error) => {
  console.error('Logger error:', error);
});

// Export a wrapper function to add request context
export const createRequestLogger = (req: any) => {
  return {
    error: (message: string, meta: any = {}) => {
      logger.error(message, {
        ...meta,
        requestId: req.id,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
      });
    },
    warn: (message: string, meta: any = {}) => {
      logger.warn(message, {
        ...meta,
        requestId: req.id,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
      });
    },
    info: (message: string, meta: any = {}) => {
      logger.info(message, {
        ...meta,
        requestId: req.id,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
      });
    },
    debug: (message: string, meta: any = {}) => {
      logger.debug(message, {
        ...meta,
        requestId: req.id,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
      });
    },
  };
};

// Export stream for Morgan integration
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};