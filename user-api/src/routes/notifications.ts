import express from 'express';
import { PrismaClient } from '@prisma/client';
import { checkAuth } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// 获取用户的通知列表
router.get('/', checkAuth, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: '获取通知失败' });
  }
});

// 标记通知为已读
router.put('/:id/read', checkAuth, async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      data: {
        read: true,
      },
    });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: '更新通知状态失败' });
  }
});

// 标记所有通知为已读
router.put('/read-all', checkAuth, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });
    res.json({ message: '所有通知已标记为已读' });
  } catch (error) {
    res.status(500).json({ message: '更新通知状态失败' });
  }
});

// 删除通知
router.delete('/:id', checkAuth, async (req, res) => {
  try {
    await prisma.notification.delete({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    res.json({ message: '通知已删除' });
  } catch (error) {
    res.status(500).json({ message: '删除通知失败' });
  }
});

// 删除所有通知
router.delete('/all', checkAuth, async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: {
        userId: req.user.id,
      },
    });
    res.json({ message: '所有通知已删除' });
  } catch (error) {
    res.status(500).json({ message: '删除通知失败' });
  }
});

export default router; 