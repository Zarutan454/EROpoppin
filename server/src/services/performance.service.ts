import { Injectable } from '@nestjs/common';
import { RedisService } from './redis';
import { promisify } from 'util';
import * as os from 'os';
import { createClient } from 'redis';

@Injectable()
export class PerformanceService {
  private metrics: Map<string, number[]> = new Map();
  private readonly maxMetricsAge = 3600; // 1 hour in seconds
  private readonly samplingRate = 60; // 1 minute in seconds

  constructor(private readonly redisService: RedisService) {
    this.startPerformanceMonitoring();
  }

  private startPerformanceMonitoring() {
    setInterval(() => {
      this.collectMetrics();
    }, this.samplingRate * 1000);
  }

  private async collectMetrics() {
    const metrics = {
      timestamp: Date.now(),
      cpu: os.loadavg()[0], // 1 minute load average
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      redis: await this.getRedisMetrics(),
      responseTimeAvg: await this.getAverageResponseTime(),
      errorRate: await this.getErrorRate(),
      activeConnections: await this.getActiveConnections(),
    };

    await this.redisService.set(
      `metrics:${metrics.timestamp}`,
      JSON.stringify(metrics),
      'EX',
      this.maxMetricsAge
    );
  }

  async getRedisMetrics() {
    const info = await this.redisService.info();
    return {
      connectedClients: parseInt(info['connected_clients']),
      usedMemory: parseInt(info['used_memory']),
      hitRate: parseInt(info['keyspace_hits']) / (parseInt(info['keyspace_hits']) + parseInt(info['keyspace_misses'])),
    };
  }

  recordResponseTime(route: string, time: number) {
    if (!this.metrics.has(route)) {
      this.metrics.set(route, []);
    }
    this.metrics.get(route).push(time);

    // Keep only last hour of metrics
    const cutoff = Date.now() - (this.maxMetricsAge * 1000);
    this.metrics.set(
      route,
      this.metrics.get(route).filter(t => t > cutoff)
    );
  }

  private async getAverageResponseTime(): Promise<number> {
    let total = 0;
    let count = 0;
    
    for (const times of this.metrics.values()) {
      total += times.reduce((sum, time) => sum + time, 0);
      count += times.length;
    }

    return count > 0 ? total / count : 0;
  }

  private async getErrorRate(): Promise<number> {
    const errorCount = await this.redisService.get('error_count');
    const requestCount = await this.redisService.get('request_count');
    
    if (!requestCount || parseInt(requestCount) === 0) return 0;
    return (parseInt(errorCount) || 0) / parseInt(requestCount);
  }

  private async getActiveConnections(): Promise<number> {
    return parseInt(await this.redisService.get('active_connections') || '0');
  }

  async getMetrics(timeRange: number = 3600): Promise<any> {
    const now = Date.now();
    const start = now - (timeRange * 1000);
    
    const keys = await this.redisService.keys('metrics:*');
    const metrics = await Promise.all(
      keys
        .filter(key => parseInt(key.split(':')[1]) > start)
        .map(async key => JSON.parse(await this.redisService.get(key)))
    );

    return {
      metrics: metrics.sort((a, b) => a.timestamp - b.timestamp),
      summary: this.calculateMetricsSummary(metrics),
    };
  }

  private calculateMetricsSummary(metrics: any[]) {
    if (metrics.length === 0) return null;

    return {
      avgResponseTime: metrics.reduce((sum, m) => sum + m.responseTimeAvg, 0) / metrics.length,
      maxCpu: Math.max(...metrics.map(m => m.cpu)),
      avgMemoryUsage: metrics.reduce((sum, m) => sum + (m.memory.used / m.memory.total), 0) / metrics.length,
      errorRate: metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length,
      peakConnections: Math.max(...metrics.map(m => m.activeConnections)),
    };
  }

  async optimizeRedisCache() {
    const keys = await this.redisService.keys('*');
    const analytics = [];

    for (const key of keys) {
      const ttl = await this.redisService.ttl(key);
      const size = await this.getKeySize(key);
      
      analytics.push({
        key,
        ttl,
        size,
        accessCount: await this.getKeyAccessCount(key),
      });
    }

    // Identify and remove unused cache entries
    const unusedKeys = analytics
      .filter(a => a.accessCount === 0 && a.ttl > 3600)
      .map(a => a.key);

    if (unusedKeys.length > 0) {
      await this.redisService.del(unusedKeys);
    }

    return {
      totalKeys: keys.length,
      optimizedKeys: unusedKeys.length,
      cacheAnalytics: analytics,
    };
  }

  private async getKeySize(key: string): Promise<number> {
    const value = await this.redisService.get(key);
    return value ? Buffer.byteLength(value) : 0;
  }

  private async getKeyAccessCount(key: string): Promise<number> {
    return parseInt(await this.redisService.get(`access_count:${key}`) || '0');
  }
}