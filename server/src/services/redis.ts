import Redis from 'ioredis';
import { logger } from '../utils/logger';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

export const redis = new Redis(redisConfig);

redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('error', (error) => {
  logger.error('Redis client error:', error);
});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

redis.on('close', () => {
  logger.warn('Redis client connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis client reconnecting');
});

// Cache wrapper
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  },

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await redis.set(key, stringValue, 'EX', ttl);
      } else {
        await redis.set(key, stringValue);
      }
    } catch (error) {
      logger.error('Redis set error:', error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Redis del error:', error);
    }
  },

  async remember<T>(
    key: string,
    ttl: number,
    callback: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) {
      return cached;
    }

    const fresh = await callback();
    await this.set(key, fresh, ttl);
    return fresh;
  },

  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error('Redis clearPattern error:', error);
    }
  },
};

// Lock implementation for distributed systems
export const lock = {
  async acquire(
    key: string,
    ttl: number = 30000,
    retries: number = 5,
    retryDelay: number = 200
  ): Promise<boolean> {
    const token = Math.random().toString(36).substring(2);
    let attempts = 0;

    while (attempts < retries) {
      const acquired = await redis.set(
        `lock:${key}`,
        token,
        'NX',
        'PX',
        ttl
      );

      if (acquired) {
        return true;
      }

      attempts++;
      if (attempts < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    return false;
  },

  async release(key: string): Promise<void> {
    await redis.del(`lock:${key}`);
  },
};

// Pub/Sub implementation
export const pubsub = {
  async publish(channel: string, message: any): Promise<void> {
    try {
      await redis.publish(channel, JSON.stringify(message));
    } catch (error) {
      logger.error('Redis publish error:', error);
    }
  },

  subscribe(channel: string, callback: (message: any) => void): void {
    const subscriber = new Redis(redisConfig);

    subscriber.subscribe(channel, (error) => {
      if (error) {
        logger.error('Redis subscribe error:', error);
        return;
      }
    });

    subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          logger.error('Redis message parsing error:', error);
        }
      }
    });
  },
};

// Rate limiter implementation
export const rateLimiter = {
  async isRateLimited(
    key: string,
    maxRequests: number,
    window: number
  ): Promise<boolean> {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, window);
    }
    return current > maxRequests;
  },

  async getRemainingRequests(key: string, maxRequests: number): Promise<number> {
    const current = await redis.get(key);
    return Math.max(0, maxRequests - (current ? parseInt(current) : 0));
  },
};

export default redis;