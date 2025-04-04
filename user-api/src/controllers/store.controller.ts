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

// 创建店铺
export const createStoreController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const { name, logo } = req.body;

    // 检查用户是否已有店铺
    const existingStore = await prisma.store.findFirst({
      where: { ownerId: userId }
    });

    if (existingStore) {
      return res.status(400).json({ error: '您已拥有店铺' });
    }

    // 创建店铺
    const store = await prisma.store.create({
      data: {
        ownerId: userId,
        name,
        logo,
        status: 'pending'
      }
    });

    res.status(201).json(store);
  } catch (error) {
    res.status(500).json({ error: '创建店铺失败' });
  }
};

// 获取我的店铺信息
export const getMyStoreController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const store = await prisma.store.findFirst({
      where: { ownerId: userId },
      include: {
        products: true
      }
    });

    if (!store) {
      return res.status(404).json({ error: '店铺不存在' });
    }

    res.json(store);
  } catch (error) {
    res.status(500).json({ error: '获取店铺信息失败' });
  }
};

// 更新店铺信息
export const updateStoreController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const { name, logo } = req.body;

    const store = await prisma.store.findFirst({
      where: { ownerId: userId }
    });

    if (!store) {
      return res.status(404).json({ error: '店铺不存在' });
    }

    if (store.status !== 'approved') {
      return res.status(400).json({ error: '店铺未通过审核' });
    }

    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: { name, logo }
    });

    res.json(updatedStore);
  } catch (error) {
    res.status(500).json({ error: '更新店铺信息失败' });
  }
};

// 获取店铺订单列表
export const getStoreOrdersController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const store = await prisma.store.findFirst({
      where: { ownerId: userId }
    });

    if (!store) {
      return res.status(404).json({ error: '店铺不存在' });
    }

    // 获取店铺所有商品的订单
    const orders = await prisma.order.findMany({
      where: {
        product: {
          storeId: store.id
        }
      },
      include: {
        product: true,
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: '获取订单列表失败' });
  }
}; 