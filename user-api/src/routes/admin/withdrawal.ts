import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

// 获取提现设置列表
router.get('/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const settings = await prisma.withdrawalSettings.findMany({
      orderBy: {
        chain: 'asc',
      },
    });

    res.json(settings);
  } catch (error) {
    console.error('获取提现设置失败:', error);
    res.status(500).json({ error: '获取提现设置失败' });
  }
});

// 更新提现设置
router.put('/settings/:chain', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { chain } = req.params;
    const { minAmount, maxAmount, fee, feeType, status } = req.body;

    const settings = await prisma.withdrawalSettings.upsert({
      where: { chain },
      update: {
        minAmount,
        maxAmount,
        fee,
        feeType,
        status,
      },
      create: {
        chain,
        minAmount,
        maxAmount,
        fee,
        feeType,
        status,
      },
    });

    res.json(settings);
  } catch (error) {
    console.error('更新提现设置失败:', error);
    res.status(500).json({ error: '更新提现设置失败' });
  }
});

// 获取提现申请列表
router.get('/requests', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = status ? { status: String(status) } : {};

    const [requests, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
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
      prisma.withdrawalRequest.count({ where }),
    ]);

    res.json({
      data: requests,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error('获取提现申请列表失败:', error);
    res.status(500).json({ error: '获取提现申请列表失败' });
  }
});

// 审核提现申请
router.post('/requests/:id/review', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, txHash } = req.body;

    if (!['completed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '无效的状态' });
    }

    const request = await prisma.withdrawalRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return res.status(404).json({ error: '提现申请不存在' });
    }

    const updatedRequest = await prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status,
        txHash: status === 'completed' ? txHash : null,
      },
    });

    // 创建通知
    await prisma.notification.create({
      data: {
        userId: request.userId,
        type: 'withdrawal_review',
        message: status === 'completed'
          ? `您的提现申请已通过审核，交易哈希：${txHash}`
          : '很抱歉，您的提现申请未通过审核。',
      },
    });

    res.json(updatedRequest);
  } catch (error) {
    console.error('审核提现申请失败:', error);
    res.status(500).json({ error: '审核提现申请失败' });
  }
});

export default router; 