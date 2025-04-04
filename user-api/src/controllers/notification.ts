import { Request, Response } from 'express';
import { NotificationStorageService } from '../services/notificationStorageService';

// 获取用户通知列表
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const result = await NotificationStorageService.getUserNotifications(
      userId,
      Number(page),
      Number(limit)
    );

    res.json(result);
  } catch (error) {
    console.error('获取通知失败:', error);
    res.status(500).json({ message: '获取通知失败' });
  }
};

// 标记通知为已读
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await NotificationStorageService.markAsRead(
      notificationId,
      userId
    );

    res.json(notification);
  } catch (error) {
    console.error('标记通知已读失败:', error);
    res.status(500).json({ message: '标记通知已读失败' });
  }
};

// 标记所有通知为已读
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    await NotificationStorageService.markAllAsRead(userId);

    res.json({ message: '所有通知已标记为已读' });
  } catch (error) {
    console.error('标记所有通知已读失败:', error);
    res.status(500).json({ message: '标记所有通知已读失败' });
  }
};

// 删除通知
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    await NotificationStorageService.deleteNotification(notificationId, userId);

    res.json({ message: '通知已删除' });
  } catch (error) {
    console.error('删除通知失败:', error);
    res.status(500).json({ message: '删除通知失败' });
  }
};

// 删除所有通知
export const deleteAllNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    await NotificationStorageService.deleteAllNotifications(userId);

    res.json({ message: '所有通知已删除' });
  } catch (error) {
    console.error('删除所有通知失败:', error);
    res.status(500).json({ message: '删除所有通知失败' });
  }
};

// 获取通知偏好设置
export const getNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const preferences = await NotificationStorageService.getNotificationPreferences(
      userId
    );

    res.json(preferences);
  } catch (error) {
    console.error('获取通知偏好设置失败:', error);
    res.status(500).json({ message: '获取通知偏好设置失败' });
  }
};

// 更新通知偏好设置
export const updateNotificationPreferences = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    const updatedPreferences = await NotificationStorageService.updateNotificationPreferences(
      userId,
      preferences
    );

    res.json(updatedPreferences);
  } catch (error) {
    console.error('更新通知偏好设置失败:', error);
    res.status(500).json({ message: '更新通知偏好设置失败' });
  }
};

// 创建通知
export const createNotification = async (userId: string, type: string, message: string) => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        message
      }
    });
  } catch (error) {
    console.error('创建通知失败:', error);
    throw error;
  }
}; 