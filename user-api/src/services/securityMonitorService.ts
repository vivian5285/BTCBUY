import { PrismaClient } from '@prisma/client';
import { SecurityLogService } from './securityLogService';
import { SecurityConfigService } from './securityConfigService';

const prisma = new PrismaClient();

export class SecurityMonitorService {
  // 监控登录尝试
  static async monitorLoginAttempt(userId: string, ipAddress: string, success: boolean) {
    try {
      // 记录登录尝试
      await SecurityLogService.logLoginAttempt({
        userId,
        ipAddress,
        success,
        details: success ? '登录成功' : '登录失败'
      });

      if (!success) {
        // 检查是否超过最大尝试次数
        const maxAttempts = await SecurityConfigService.getMaxLoginAttempts();
        const recentAttempts = await prisma.securityLog.count({
          where: {
            ipAddress,
            action: 'login_attempt',
            status: 'failed',
            createdAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000) // 1小时内
            }
          }
        });

        if (recentAttempts >= maxAttempts) {
          // 将IP加入黑名单
          const lockoutDuration = await SecurityConfigService.getLoginLockoutDuration();
          await prisma.iPBlacklist.create({
            data: {
              ipAddress,
              reason: '登录尝试次数过多',
              expiresAt: new Date(Date.now() + lockoutDuration)
            }
          });
        }
      }
    } catch (error) {
      console.error('监控登录尝试失败:', error);
    }
  }

  // 监控敏感操作
  static async monitorSensitiveOperation(userId: string, operation: string, success: boolean) {
    try {
      // 记录敏感操作
      await SecurityLogService.logSensitiveOperation({
        userId,
        operation,
        success,
        details: success ? '操作成功' : '操作失败'
      });

      if (!success) {
        // 检查是否需要二次验证
        const requiresVerification = await SecurityConfigService.requiresSensitiveOperationVerification();
        if (requiresVerification) {
          await prisma.sensitiveOperation.create({
            data: {
              userId,
              operation,
              verified: false,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
            }
          });
        }
      }
    } catch (error) {
      console.error('监控敏感操作失败:', error);
    }
  }

  // 监控设备验证
  static async monitorDeviceVerification(userId: string, deviceFingerprint: string, success: boolean) {
    try {
      // 记录设备验证
      await SecurityLogService.logDeviceVerification({
        userId,
        deviceFingerprint,
        success,
        details: success ? '设备验证成功' : '设备验证失败'
      });

      if (!success) {
        // 检查是否需要将设备加入黑名单
        const recentFailures = await prisma.securityLog.count({
          where: {
            userId,
            action: 'device_verification',
            status: 'failed',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时内
            }
          }
        });

        if (recentFailures >= 5) {
          await prisma.deviceBlacklist.create({
            data: {
              fingerprint: deviceFingerprint,
              reason: '设备验证失败次数过多',
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期
            }
          });
        }
      }
    } catch (error) {
      console.error('监控设备验证失败:', error);
    }
  }

  // 监控IP地址
  static async monitorIPAddress(ipAddress: string) {
    try {
      // 检查IP是否可疑
      const isSuspicious = await SecurityLogService.isIPSuspicious(ipAddress);
      
      if (isSuspicious) {
        // 检查IP是否已经在黑名单中
        const existingBlacklist = await prisma.iPBlacklist.findUnique({
          where: { ipAddress }
        });

        if (!existingBlacklist) {
          // 将IP加入黑名单
          const blacklistDuration = await SecurityConfigService.getIPBlacklistDuration();
          await prisma.iPBlacklist.create({
            data: {
              ipAddress,
              reason: '可疑IP地址',
              expiresAt: new Date(Date.now() + blacklistDuration)
            }
          });
        }
      }
    } catch (error) {
      console.error('监控IP地址失败:', error);
    }
  }

  // 监控并发会话
  static async monitorConcurrentSessions(userId: string) {
    try {
      const maxSessions = await SecurityConfigService.getMaxConcurrentSessions();
      const activeSessions = await prisma.session.count({
        where: {
          userId,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (activeSessions >= maxSessions) {
        // 终止最早的会话
        const oldestSession = await prisma.session.findFirst({
          where: {
            userId,
            expiresAt: {
              gt: new Date()
            }
          },
          orderBy: {
            lastActivity: 'asc'
          }
        });

        if (oldestSession) {
          await prisma.session.delete({
            where: { id: oldestSession.id }
          });
        }
      }
    } catch (error) {
      console.error('监控并发会话失败:', error);
    }
  }
} 