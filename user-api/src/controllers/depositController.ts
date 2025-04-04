import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 获取用户的充值记录
export const getMyDeposits = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { chain, page = 1, limit = 10 } = req.query;

    // 构建查询条件
    const where: any = { userId };
    if (chain) {
      where.chain = chain;
    }

    // 计算分页
    const skip = (Number(page) - 1) * Number(limit);

    // 并行查询充值记录和总数
    const [deposits, total] = await Promise.all([
      prisma.deposit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        select: {
          id: true,
          chain: true,
          amount: true,
          txHash: true,
          confirmed: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.deposit.count({ where }),
    ]);

    // 计算统计数据
    const stats = await prisma.deposit.aggregate({
      where: { userId },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
        confirmed: true,
      },
    });

    res.json({
      deposits,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      stats: {
        totalAmount: stats._sum.amount || 0,
        totalDeposits: stats._count._all,
        confirmedDeposits: stats._count.confirmed,
      },
    });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    res.status(500).json({ error: 'Failed to fetch deposit records' });
  }
};

// 获取单条充值记录详情
export const getDepositDetail = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const deposit = await prisma.deposit.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        chain: true,
        amount: true,
        txHash: true,
        confirmed: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit record not found' });
    }

    res.json(deposit);
  } catch (error) {
    console.error('Error fetching deposit detail:', error);
    res.status(500).json({ error: 'Failed to fetch deposit detail' });
  }
}; 