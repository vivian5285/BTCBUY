import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SecurityLogService {
  // 记录安全事件
  static async logSecurityEvent(data: {
    userId?: string;
    ipAddress?: string;
    action: string;
    details?: string;
    status: string;
  }) {
    try {
      await prisma.securityLog.create({
        data: {
          userId: data.userId,
          ipAddress: data.ipAddress,
          action: data.action,
          details: data.details,
          status: data.status,
        },
      });
    } catch (error) {
      console.error('记录安全事件失败:', error);
    }
  }

  // 记录登录尝试
  static async logLoginAttempt(data: {
    userId?: string;
    ipAddress: string;
    success: boolean;
    details?: string;
  }) {
    await this.logSecurityEvent({
      userId: data.userId,
      ipAddress: data.ipAddress,
      action: 'login_attempt',
      details: data.details,
      status: data.success ? 'success' : 'failed',
    });
  }

  // 记录敏感操作
  static async logSensitiveOperation(data: {
    userId: string;
    operation: string;
    success: boolean;
    details?: string;
  }) {
    await this.logSecurityEvent({
      userId: data.userId,
      action: `sensitive_operation_${data.operation}`,
      details: data.details,
      status: data.success ? 'success' : 'failed',
    });
  }

  // 记录设备验证
  static async logDeviceVerification(data: {
    userId: string;
    deviceFingerprint: string;
    success: boolean;
    details?: string;
  }) {
    await this.logSecurityEvent({
      userId: data.userId,
      action: 'device_verification',
      details: data.details,
      status: data.success ? 'success' : 'failed',
    });
  }

  // 记录IP黑名单事件
  static async logIPBlacklistEvent(data: {
    ipAddress: string;
    action: 'add' | 'remove';
    reason?: string;
  }) {
    await this.logSecurityEvent({
      ipAddress: data.ipAddress,
      action: `ip_blacklist_${data.action}`,
      details: data.reason,
      status: 'success',
    });
  }

  // 记录令牌失效
  static async logTokenInvalidation(data: {
    userId: string;
    token: string;
    reason: string;
  }) {
    await this.logSecurityEvent({
      userId: data.userId,
      action: 'token_invalidation',
      details: data.reason,
      status: 'success',
    });
  }

  // 获取用户的安全日志
  static async getUserSecurityLogs(userId: string, limit: number = 50) {
    return prisma.securityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // 获取IP地址的安全日志
  static async getIPSecurityLogs(ipAddress: string, limit: number = 50) {
    return prisma.securityLog.findMany({
      where: { ipAddress },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // 检查IP是否可疑
  static async isIPSuspicious(ipAddress: string): Promise<boolean> {
    const recentLogs = await prisma.securityLog.findMany({
      where: {
        ipAddress,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24小时内
        },
      },
    });

    const failedAttempts = recentLogs.filter(log => log.status === 'failed').length;
    return failedAttempts >= 5; // 如果24小时内有5次以上失败尝试，则认为可疑
  }

  // 清理过期的安全日志
  static async cleanupOldLogs(days: number = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    await prisma.securityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
  }
} 