import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

// 获取佣金规则列表
router.get('/rules', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    const where = type ? { type: String(type) } : {};

    const rules = await prisma.commissionRule.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { level: 'asc' },
      ],
    });

    res.json(rules);
  } catch (error) {
    console.error('获取佣金规则列表失败:', error);
    res.status(500).json({ error: '获取佣金规则列表失败' });
  }
});

// 创建佣金规则
router.post('/rules', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type, level, rate, description } = req.body;

    const rule = await prisma.commissionRule.create({
      data: {
        type,
        level,
        rate,
        description,
      },
    });

    res.json(rule);
  } catch (error) {
    console.error('创建佣金规则失败:', error);
    res.status(500).json({ error: '创建佣金规则失败' });
  }
});

// 更新佣金规则
router.put('/rules/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { rate, description, status } = req.body;

    const rule = await prisma.commissionRule.update({
      where: { id },
      data: {
        rate,
        description,
        status,
      },
    });

    res.json(rule);
  } catch (error) {
    console.error('更新佣金规则失败:', error);
    res.status(500).json({ error: '更新佣金规则失败' });
  }
});

// 删除佣金规则
router.delete('/rules/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.commissionRule.delete({
      where: { id },
    });

    res.json({ message: '佣金规则已删除' });
  } catch (error) {
    console.error('删除佣金规则失败:', error);
    res.status(500).json({ error: '删除佣金规则失败' });
  }
});

// 获取佣金记录列表
router.get('/records', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = type ? { type: String(type) } : {};

    const [records, total] = await Promise.all([
      prisma.referralCommission.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          fromUser: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          toUser: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          order: {
            select: {
              id: true,
              amount: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.referralCommission.count({ where }),
    ]);

    res.json({
      data: records,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error('获取佣金记录列表失败:', error);
    res.status(500).json({ error: '获取佣金记录列表失败' });
  }
});

export default router; 