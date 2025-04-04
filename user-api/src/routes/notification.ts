import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationPreferences,
  updateNotificationPreferences
} from '../controllers/notification';

const router = Router();

// 获取用户通知列表
router.get('/', auth, getUserNotifications);

// 标记通知为已读
router.patch('/:notificationId/read', auth, markAsRead);

// 标记所有通知为已读
router.patch('/read-all', auth, markAllAsRead);

// 删除通知
router.delete('/:notificationId', auth, deleteNotification);

// 删除所有通知
router.delete('/', auth, deleteAllNotifications);

// 获取通知偏好设置
router.get('/preferences', auth, getNotificationPreferences);

// 更新通知偏好设置
router.patch('/preferences', auth, updateNotificationPreferences);

export default router; 