import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user: {
    id: string;
    iat: number;
    exp: number;
  };
}

// 创建店铺
export const createStore = async (req: AuthRequest, res: Response) => {
  try {
    const { name, logo, description } = req.body;
    const userId = req.user.id;

    // 检查用户是否已有店铺
    const existingStore = await prisma.store.findFirst({
      where: { ownerId: userId },
    });

    if (existingStore) {
      return res.status(400).json({ message: '您已经拥有一个店铺' });
    }

    // 创建店铺
    const store = await prisma.store.create({
      data: {
        name,
        logo,
        description,
        ownerId: userId,
      },
    });

    res.status(201).json(store);
  } catch (error) {
    console.error('创建店铺失败:', error);
    res.status(500).json({ message: '创建店铺失败' });
  }
};

// 获取我的店铺
export const getMyStore = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;

    const store = await prisma.store.findFirst({
      where: { ownerId: userId },
      include: {
        products: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!store) {
      return res.status(404).json({ message: '未找到店铺' });
    }

    res.json(store);
  } catch (error) {
    console.error('获取店铺信息失败:', error);
    res.status(500).json({ message: '获取店铺信息失败' });
  }
};

// 更新店铺信息
export const updateStore = async (req: AuthRequest, res: Response) => {
  try {
    const { name, logo, description } = req.body;
    const userId = req.user.id;

    const store = await prisma.store.findFirst({
      where: { ownerId: userId },
    });

    if (!store) {
      return res.status(404).json({ message: '未找到店铺' });
    }

    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: {
        name,
        logo,
        description,
      },
    });

    res.json(updatedStore);
  } catch (error) {
    console.error('更新店铺信息失败:', error);
    res.status(500).json({ message: '更新店铺信息失败' });
  }
};

// 获取店铺详情（公开）
export const getStoreDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        products: {
          where: { status: 'on_sale' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!store) {
      return res.status(404).json({ message: '未找到店铺' });
    }

    res.json(store);
  } catch (error) {
    console.error('获取店铺详情失败:', error);
    res.status(500).json({ message: '获取店铺详情失败' });
  }
}; 