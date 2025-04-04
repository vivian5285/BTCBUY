import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

// 获取通知列表
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (type) where.type = String(type);
    if (userId) where.userId = String(userId);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      data: notifications,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error('获取通知列表失败:', error);
    res.status(500).json({ error: '获取通知列表失败' });
  }
});

// 删除通知
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.notification.delete({
      where: { id },
    });

    res.json({ message: '通知已删除' });
  } catch (error) {
    console.error('删除通知失败:', error);
    res.status(500).json({ error: '删除通知失败' });
  }
});

// 批量删除通知
router.post('/batch-delete', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '无效的通知ID列表' });
    }

    await prisma.notification.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    res.json({ message: '通知已批量删除' });
  } catch (error) {
    console.error('批量删除通知失败:', error);
    res.status(500).json({ error: '批量删除通知失败' });
  }
});

// 发送通知
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId, type, message } = req.body;

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
      },
    });

    res.json(notification);
  } catch (error) {
    console.error('发送通知失败:', error);
    res.status(500).json({ error: '发送通知失败' });
  }
});

export default router; 