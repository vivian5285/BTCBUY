import { PrismaClient } from '@prisma/client';
import { SecurityLogService } from './securityLogService';
import { SecurityConfigService } from './securityConfigService';
import { createNotification } from '../controllers/notification';

const prisma = new PrismaClient();

interface AlertRule {
  id: string;
  name: string;
  type: 'LOGIN_ATTEMPT' | 'SENSITIVE_OPERATION' | 'IP_BLOCK' | 'DEVICE_BLOCK' | 'CONCURRENT_SESSION';
  threshold: number;
  timeWindow: number; // 时间窗口（分钟）
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  notificationChannels: string[]; // ['EMAIL', 'SMS', 'SYSTEM']
  createdAt: Date;
  updatedAt: Date;
}

export class SecurityAlertService {
  // 创建告警规则
  static async createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>) {
    return await prisma.alertRule.create({
      data: rule
    });
  }

  // 更新告警规则
  static async updateAlertRule(id: string, rule: Partial<AlertRule>) {
    return await prisma.alertRule.update({
      where: { id },
      data: rule
    });
  }

  // 删除告警规则
  static async deleteAlertRule(id: string) {
    return await prisma.alertRule.delete({
      where: { id }
    });
  }

  // 获取所有告警规则
  static async getAlertRules() {
    return await prisma.alertRule.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  // 检查登录尝试告警
  static async checkLoginAttemptAlert(ipAddress: string) {
    const rules = await prisma.alertRule.findMany({
      where: {
        type: 'LOGIN_ATTEMPT',
        enabled: true
      }
    });

    for (const rule of rules) {
      const logs = await SecurityLogService.getIPSecurityLogs(ipAddress, rule.threshold);
      const recentLogs = logs.filter(log => {
        const logTime = new Date(log.createdAt).getTime();
        const now = Date.now();
        return now - logTime <= rule.timeWindow * 60 * 1000;
      });

      if (recentLogs.length >= rule.threshold) {
        await this.triggerAlert(rule, {
          ipAddress,
          count: recentLogs.length,
          timeWindow: rule.timeWindow
        });
      }
    }
  }

  // 检查敏感操作告警
  static async checkSensitiveOperationAlert(userId: string) {
    const rules = await prisma.alertRule.findMany({
      where: {
        type: 'SENSITIVE_OPERATION',
        enabled: true
      }
    });

    for (const rule of rules) {
      const logs = await SecurityLogService.getUserSecurityLogs(userId, rule.threshold);
      const recentLogs = logs.filter(log => {
        const logTime = new Date(log.createdAt).getTime();
        const now = Date.now();
        return now - logTime <= rule.timeWindow * 60 * 1000;
      });

      if (recentLogs.length >= rule.threshold) {
        await this.triggerAlert(rule, {
          userId,
          count: recentLogs.length,
          timeWindow: rule.timeWindow
        });
      }
    }
  }

  // 检查IP封禁告警
  static async checkIPBlockAlert(ipAddress: string) {
    const rules = await prisma.alertRule.findMany({
      where: {
        type: 'IP_BLOCK',
        enabled: true
      }
    });

    for (const rule of rules) {
      const blacklistDuration = await SecurityConfigService.getIPBlacklistDuration();
      const blockedIPs = await prisma.iPBlacklist.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - blacklistDuration)
          }
        }
      });

      if (blockedIPs >= rule.threshold) {
        await this.triggerAlert(rule, {
          blockedIPs,
          timeWindow: blacklistDuration / (24 * 60 * 60 * 1000) // 转换为天
        });
      }
    }
  }

  // 检查设备封禁告警
  static async checkDeviceBlockAlert(deviceFingerprint: string) {
    const rules = await prisma.alertRule.findMany({
      where: {
        type: 'DEVICE_BLOCK',
        enabled: true
      }
    });

    for (const rule of rules) {
      const blockedDevices = await prisma.deviceBlacklist.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - rule.timeWindow * 60 * 1000)
          }
        }
      });

      if (blockedDevices >= rule.threshold) {
        await this.triggerAlert(rule, {
          blockedDevices,
          timeWindow: rule.timeWindow
        });
      }
    }
  }

  // 检查并发会话告警
  static async checkConcurrentSessionAlert(userId: string) {
    const rules = await prisma.alertRule.findMany({
      where: {
        type: 'CONCURRENT_SESSION',
        enabled: true
      }
    });

    for (const rule of rules) {
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
        await this.triggerAlert(rule, {
          userId,
          activeSessions,
          maxSessions
        });
      }
    }
  }

  // 触发告警
  private static async triggerAlert(rule: AlertRule, context: any) {
    const alert = await prisma.securityAlert.create({
      data: {
        ruleId: rule.id,
        type: rule.type,
        severity: rule.severity,
        details: JSON.stringify(context),
        status: 'ACTIVE'
      }
    });

    // 发送通知
    for (const channel of rule.notificationChannels) {
      switch (channel) {
        case 'EMAIL':
          // TODO: 实现邮件通知
          break;
        case 'SMS':
          // TODO: 实现短信通知
          break;
        case 'SYSTEM':
          await createNotification(
            'ADMIN', // 管理员用户ID
            'security_alert',
            `安全告警: ${rule.name} - ${this.formatAlertMessage(rule, context)}`
          );
          break;
      }
    }

    return alert;
  }

  // 格式化告警消息
  private static formatAlertMessage(rule: AlertRule, context: any): string {
    switch (rule.type) {
      case 'LOGIN_ATTEMPT':
        return `IP地址 ${context.ipAddress} 在 ${context.timeWindow} 分钟内尝试登录 ${context.count} 次`;
      case 'SENSITIVE_OPERATION':
        return `用户 ${context.userId} 在 ${context.timeWindow} 分钟内执行敏感操作 ${context.count} 次`;
      case 'IP_BLOCK':
        return `在过去 ${context.timeWindow} 天内封禁了 ${context.blockedIPs} 个IP地址`;
      case 'DEVICE_BLOCK':
        return `在过去 ${context.timeWindow} 分钟内封禁了 ${context.blockedDevices} 个设备`;
      case 'CONCURRENT_SESSION':
        return `用户 ${context.userId} 当前有 ${context.activeSessions} 个活跃会话，超过限制 ${context.maxSessions}`;
      default:
        return '未知告警类型';
    }
  }
} 