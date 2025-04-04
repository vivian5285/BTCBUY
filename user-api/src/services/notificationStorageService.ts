import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationStorageService {
  // 创建通知
  static async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
      },
    });
  }

  // 获取用户的通知列表
  static async getUserNotifications(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
      },
    };
  }

  // 获取未读通知数量
  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  // 标记通知为已读
  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.update({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
      },
    });
  }

  // 标记所有通知为已读
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  // 删除通知
  static async deleteNotification(notificationId: string, userId: string) {
    return prisma.notification.delete({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  // 删除所有通知
  static async deleteAllNotifications(userId: string) {
    return prisma.notification.deleteMany({
      where: {
        userId,
      },
    });
  }

  // 获取用户通知偏好设置
  static async getNotificationPreferences(userId: string) {
    return prisma.notificationPreference.findUnique({
      where: {
        userId,
      },
    });
  }

  // 更新用户通知偏好设置
  static async updateNotificationPreferences(
    userId: string,
    preferences: {
      email?: boolean;
      sms?: boolean;
      system?: boolean;
      websocket?: boolean;
    }
  ) {
    return prisma.notificationPreference.upsert({
      where: {
        userId,
      },
      update: preferences,
      create: {
        userId,
        ...preferences,
      },
    });
  }

  // 清理过期通知
  static async cleanupOldNotifications(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
  }
} 