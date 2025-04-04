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

// 创建订单
export const createOrderController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const { productId, quantity } = req.body;

    // 获取产品信息
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: '库存不足' });
    }

    const amount = product.price * quantity;

    // 创建订单
    const order = await prisma.order.create({
      data: {
        userId,
        productId,
        quantity,
        amount,
        status: 'pending'
      }
    });

    // 更新产品库存
    await prisma.product.update({
      where: { id: productId },
      data: { stock: product.stock - quantity }
    });

    // 订单创建成功后，生成推广佣金
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { invitedBy: true },
    });

    if (user?.invitedById) {
      const commissionAmount = order.amount * 0.05; // 返佣比例 5%

      await prisma.commission.create({
        data: {
          userId: user.invitedById,
          orderId: order.id,
          amount: commissionAmount,
        },
      });
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: '创建订单失败' });
  }
};

// 获取我的订单列表
export const getMyOrdersController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: '获取订单列表失败' });
  }
}; 