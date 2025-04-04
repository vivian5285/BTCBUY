import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';

const router = Router();
const prisma = new PrismaClient();

// 获取商户列表
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = status ? { status: String(status) } : {};

    const [merchants, total] = await Promise.all([
      prisma.merchant.findMany({
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
      prisma.merchant.count({ where }),
    ]);

    res.json({
      data: merchants,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error('获取商户列表失败:', error);
    res.status(500).json({ error: '获取商户列表失败' });
  }
});

// 获取商户详情
router.get('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    if (!merchant) {
      return res.status(404).json({ error: '商户不存在' });
    }

    res.json(merchant);
  } catch (error) {
    console.error('获取商户详情失败:', error);
    res.status(500).json({ error: '获取商户详情失败' });
  }
});

// 审核商户
router.post('/:id/review', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '无效的状态' });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id },
    });

    if (!merchant) {
      return res.status(404).json({ error: '商户不存在' });
    }

    const updatedMerchant = await prisma.merchant.update({
      where: { id },
      data: { status },
    });

    // 创建通知
    await prisma.notification.create({
      data: {
        userId: merchant.userId,
        type: 'merchant_review',
        message: status === 'approved' 
          ? '恭喜！您的商户申请已通过审核。' 
          : `很抱歉，您的商户申请未通过审核。原因：${reason || '未提供具体原因'}`,
      },
    });

    res.json(updatedMerchant);
  } catch (error) {
    console.error('审核商户失败:', error);
    res.status(500).json({ error: '审核商户失败' });
  }
});

// 导出商户数据
router.get('/export', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const merchants = await prisma.merchant.findMany({
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 转换为CSV格式
    const csvHeader = '商户ID,用户名,邮箱,商户名称,联系人,电话,邮箱,地址,状态,创建时间\n';
    const csvRows = merchants.map(merchant => {
      return `${merchant.id},${merchant.user.username},${merchant.user.email},${merchant.businessName},${merchant.contactPerson},${merchant.phoneNumber},${merchant.email},${merchant.address || ''},${merchant.status},${merchant.createdAt}`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=merchants.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('导出商户数据失败:', error);
    res.status(500).json({ error: '导出商户数据失败' });
  }
});

export default router; 