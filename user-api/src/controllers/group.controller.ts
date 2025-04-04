import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 扩展 Request 类型以包含用户信息
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    iat: number;
    exp: number;
  };
}

// 发起拼团
export const startGroupBuyController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const { productId, maxMembers, expiresIn } = req.body;

    // 验证产品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }

    // 计算过期时间（expiresIn 为小时数）
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresIn);

    // 创建拼团
    const groupBuy = await prisma.groupBuy.create({
      data: {
        productId,
        initiatorId: userId,
        maxMembers,
        expiresAt,
        participants: {
          connect: { id: userId } // 发起人自动加入
        }
      },
      include: {
        product: true,
        initiator: true,
        participants: true
      }
    });

    res.status(201).json(groupBuy);
  } catch (error) {
    res.status(500).json({ error: '发起拼团失败' });
  }
};

// 加入拼团
export const joinGroupBuyController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const { id } = req.params;

    // 检查拼团是否存在且未过期
    const groupBuy = await prisma.groupBuy.findUnique({
      where: { id },
      include: {
        participants: true
      }
    });

    if (!groupBuy) {
      return res.status(404).json({ error: '拼团不存在' });
    }

    if (groupBuy.expiresAt < new Date()) {
      return res.status(400).json({ error: '拼团已过期' });
    }

    if (groupBuy.isSuccess) {
      return res.status(400).json({ error: '拼团已完成' });
    }

    // 检查用户是否已经加入
    if (groupBuy.participants.some(p => p.id === userId)) {
      return res.status(400).json({ error: '您已加入该拼团' });
    }

    // 检查是否达到人数上限
    if (groupBuy.participants.length >= groupBuy.maxMembers) {
      return res.status(400).json({ error: '拼团人数已满' });
    }

    // 加入拼团
    const updatedGroupBuy = await prisma.groupBuy.update({
      where: { id },
      data: {
        participants: {
          connect: { id: userId }
        }
      },
      include: {
        product: true,
        initiator: true,
        participants: true
      }
    });

    // 检查是否达到人数上限，自动完成拼团
    if (updatedGroupBuy.participants.length >= updatedGroupBuy.maxMembers) {
      await prisma.groupBuy.update({
        where: { id },
        data: { isSuccess: true }
      });
    }

    res.json(updatedGroupBuy);
  } catch (error) {
    res.status(500).json({ error: '加入拼团失败' });
  }
};

// 获取我的拼团列表
export const getMyGroupBuysController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const groupBuys = await prisma.groupBuy.findMany({
      where: {
        OR: [
          { initiatorId: userId },
          { participants: { some: { id: userId } } }
        ]
      },
      include: {
        product: true,
        initiator: true,
        participants: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(groupBuys);
  } catch (error) {
    res.status(500).json({ error: '获取拼团列表失败' });
  }
}; 