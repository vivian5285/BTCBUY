import { PrismaClient } from '@prisma/client';
import { SecurityLogService } from './securityLogService';
import { SecurityConfigService } from './securityConfigService';
import { NotificationStorageService } from './notificationStorageService';

const prisma = new PrismaClient();

export class ScheduledTaskService {
  // 清理过期的安全日志
  static async cleanupSecurityLogs() {
    try {
      const retentionDays = await SecurityConfigService.getLogRetentionDays();
      await SecurityLogService.cleanupOldLogs(retentionDays);
      console.log('安全日志清理完成');
    } catch (error) {
      console.error('清理安全日志失败:', error);
    }
  }

  // 清理过期的会话
  static async cleanupExpiredSessions() {
    try {
      const sessionTimeout = await SecurityConfigService.getSessionTimeout();
      const expiredTime = new Date(Date.now() - sessionTimeout);

      await prisma.session.deleteMany({
        where: {
          lastActivity: {
            lt: expiredTime
          }
        }
      });
      console.log('过期会话清理完成');
    } catch (error) {
      console.error('清理过期会话失败:', error);
    }
  }

  // 清理过期的令牌黑名单
  static async cleanupTokenBlacklist() {
    try {
      await prisma.tokenBlacklist.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
      console.log('令牌黑名单清理完成');
    } catch (error) {
      console.error('清理令牌黑名单失败:', error);
    }
  }

  // 清理过期的IP黑名单
  static async cleanupIPBlacklist() {
    try {
      const blacklistDuration = await SecurityConfigService.getIPBlacklistDuration();
      const expiredTime = new Date(Date.now() - blacklistDuration);

      await prisma.iPBlacklist.deleteMany({
        where: {
          createdAt: {
            lt: expiredTime
          }
        }
      });
      console.log('IP黑名单清理完成');
    } catch (error) {
      console.error('清理IP黑名单失败:', error);
    }
  }

  // 清理过期的设备黑名单
  static async cleanupDeviceBlacklist() {
    try {
      await prisma.deviceBlacklist.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
      console.log('设备黑名单清理完成');
    } catch (error) {
      console.error('清理设备黑名单失败:', error);
    }
  }

  // 清理过期的敏感操作记录
  static async cleanupSensitiveOperations() {
    try {
      await prisma.sensitiveOperation.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
      console.log('敏感操作记录清理完成');
    } catch (error) {
      console.error('清理敏感操作记录失败:', error);
    }
  }

  static async cleanupNotifications() {
    try {
      const days = Number(process.env.NOTIFICATION_RETENTION_DAYS) || 30;
      await NotificationStorageService.cleanupOldNotifications(days);
      console.log('通知清理完成');
    } catch (error) {
      console.error('通知清理失败:', error);
    }
  }

  // 启动所有定时任务
  static startScheduledTasks() {
    // 每小时清理一次安全日志
    setInterval(() => this.cleanupSecurityLogs(), 60 * 60 * 1000);

    // 每30分钟清理一次过期会话
    setInterval(() => this.cleanupExpiredSessions(), 30 * 60 * 1000);

    // 每天清理一次令牌黑名单
    setInterval(() => this.cleanupTokenBlacklist(), 24 * 60 * 60 * 1000);

    // 每天清理一次IP黑名单
    setInterval(() => this.cleanupIPBlacklist(), 24 * 60 * 60 * 1000);

    // 每天清理一次设备黑名单
    setInterval(() => this.cleanupDeviceBlacklist(), 24 * 60 * 60 * 1000);

    // 每天清理一次敏感操作记录
    setInterval(() => this.cleanupSensitiveOperations(), 24 * 60 * 60 * 1000);

    // 每天凌晨2点清理过期通知
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        this.cleanupNotifications();
      }
    }, 60 * 1000); // 每分钟检查一次

    console.log('所有定时任务已启动');
  }
} 