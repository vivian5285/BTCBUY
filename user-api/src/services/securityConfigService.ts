import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SecurityConfigService {
  // 默认安全配置
  private static defaultConfig = {
    maxLoginAttempts: 5,
    loginLockoutDuration: 60 * 60 * 1000, // 1小时
    sessionTimeout: 24 * 60 * 60 * 1000, // 24小时
    passwordMinLength: 8,
    requireTwoFactor: false,
    requireDeviceVerification: true,
    maxConcurrentSessions: 3,
    sensitiveOperationVerification: true,
    ipBlacklistDuration: 7 * 24 * 60 * 60 * 1000, // 7天
    logRetentionDays: 30,
  };

  // 获取安全配置
  static async getSecurityConfig() {
    try {
      const config = await prisma.securityConfig.findFirst();
      return config || this.defaultConfig;
    } catch (error) {
      console.error('获取安全配置失败:', error);
      return this.defaultConfig;
    }
  }

  // 更新安全配置
  static async updateSecurityConfig(config: Partial<typeof this.defaultConfig>) {
    try {
      const existingConfig = await prisma.securityConfig.findFirst();
      
      if (existingConfig) {
        return await prisma.securityConfig.update({
          where: { id: existingConfig.id },
          data: config,
        });
      } else {
        return await prisma.securityConfig.create({
          data: config,
        });
      }
    } catch (error) {
      console.error('更新安全配置失败:', error);
      throw error;
    }
  }

  // 检查是否需要设备验证
  static async requiresDeviceVerification(): Promise<boolean> {
    const config = await this.getSecurityConfig();
    return config.requireDeviceVerification;
  }

  // 检查是否需要二次验证
  static async requiresTwoFactor(): Promise<boolean> {
    const config = await this.getSecurityConfig();
    return config.requireTwoFactor;
  }

  // 获取最大登录尝试次数
  static async getMaxLoginAttempts(): Promise<number> {
    const config = await this.getSecurityConfig();
    return config.maxLoginAttempts;
  }

  // 获取登录锁定时间
  static async getLoginLockoutDuration(): Promise<number> {
    const config = await this.getSecurityConfig();
    return config.loginLockoutDuration;
  }

  // 获取会话超时时间
  static async getSessionTimeout(): Promise<number> {
    const config = await this.getSecurityConfig();
    return config.sessionTimeout;
  }

  // 获取密码最小长度
  static async getPasswordMinLength(): Promise<number> {
    const config = await this.getSecurityConfig();
    return config.passwordMinLength;
  }

  // 获取最大并发会话数
  static async getMaxConcurrentSessions(): Promise<number> {
    const config = await this.getSecurityConfig();
    return config.maxConcurrentSessions;
  }

  // 检查是否需要敏感操作验证
  static async requiresSensitiveOperationVerification(): Promise<boolean> {
    const config = await this.getSecurityConfig();
    return config.sensitiveOperationVerification;
  }

  // 获取IP黑名单持续时间
  static async getIPBlacklistDuration(): Promise<number> {
    const config = await this.getSecurityConfig();
    return config.ipBlacklistDuration;
  }

  // 获取日志保留天数
  static async getLogRetentionDays(): Promise<number> {
    const config = await this.getSecurityConfig();
    return config.logRetentionDays;
  }

  // 验证密码强度
  static validatePasswordStrength(password: string): boolean {
    const config = this.defaultConfig;
    const minLength = config.passwordMinLength;
    
    // 检查最小长度
    if (password.length < minLength) {
      return false;
    }
    
    // 检查是否包含数字
    const hasNumber = /\d/.test(password);
    
    // 检查是否包含小写字母
    const hasLowercase = /[a-z]/.test(password);
    
    // 检查是否包含大写字母
    const hasUppercase = /[A-Z]/.test(password);
    
    // 检查是否包含特殊字符
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    // 至少需要满足3个条件
    const conditions = [hasNumber, hasLowercase, hasUppercase, hasSpecialChar];
    return conditions.filter(Boolean).length >= 3;
  }

  // 生成设备指纹
  static generateDeviceFingerprint(userAgent: string, ip: string): string {
    const data = `${userAgent}-${ip}`;
    // 使用简单的哈希函数，实际应用中应使用更安全的哈希算法
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
} 