import Redis from 'ioredis';
import { promisify } from 'util';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// 缓存键前缀
const CACHE_PREFIX = {
  PRODUCT: 'product:',
  USER: 'user:',
  ORDER: 'order:',
  MERCHANT: 'merchant:',
  COMMISSION: 'commission:',
};

// 缓存过期时间（秒）
const CACHE_TTL = {
  PRODUCT: 3600, // 1小时
  USER: 1800, // 30分钟
  ORDER: 7200, // 2小时
  MERCHANT: 3600, // 1小时
  COMMISSION: 86400, // 24小时
};

class CacheService {
  // 设置缓存
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, stringValue);
    } else {
      await redis.set(key, stringValue);
    }
  }

  // 获取缓存
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value);
  }

  // 删除缓存
  async del(key: string): Promise<void> {
    await redis.del(key);
  }

  // 批量删除缓存
  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  // 商品相关缓存方法
  async getProduct(id: string) {
    return this.get(`${CACHE_PREFIX.PRODUCT}${id}`);
  }

  async setProduct(id: string, data: any) {
    await this.set(`${CACHE_PREFIX.PRODUCT}${id}`, data, CACHE_TTL.PRODUCT);
  }

  async delProduct(id: string) {
    await this.del(`${CACHE_PREFIX.PRODUCT}${id}`);
  }

  // 用户相关缓存方法
  async getUser(id: string) {
    return this.get(`${CACHE_PREFIX.USER}${id}`);
  }

  async setUser(id: string, data: any) {
    await this.set(`${CACHE_PREFIX.USER}${id}`, data, CACHE_TTL.USER);
  }

  async delUser(id: string) {
    await this.del(`${CACHE_PREFIX.USER}${id}`);
  }

  // 订单相关缓存方法
  async getOrder(id: string) {
    return this.get(`${CACHE_PREFIX.ORDER}${id}`);
  }

  async setOrder(id: string, data: any) {
    await this.set(`${CACHE_PREFIX.ORDER}${id}`, data, CACHE_TTL.ORDER);
  }

  async delOrder(id: string) {
    await this.del(`${CACHE_PREFIX.ORDER}${id}`);
  }

  // 商家相关缓存方法
  async getMerchant(id: string) {
    return this.get(`${CACHE_PREFIX.MERCHANT}${id}`);
  }

  async setMerchant(id: string, data: any) {
    await this.set(`${CACHE_PREFIX.MERCHANT}${id}`, data, CACHE_TTL.MERCHANT);
  }

  async delMerchant(id: string) {
    await this.del(`${CACHE_PREFIX.MERCHANT}${id}`);
  }

  // 分佣相关缓存方法
  async getCommission(id: string) {
    return this.get(`${CACHE_PREFIX.COMMISSION}${id}`);
  }

  async setCommission(id: string, data: any) {
    await this.set(`${CACHE_PREFIX.COMMISSION}${id}`, data, CACHE_TTL.COMMISSION);
  }

  async delCommission(id: string) {
    await this.del(`${CACHE_PREFIX.COMMISSION}${id}`);
  }
}

export const cacheService = new CacheService(); 