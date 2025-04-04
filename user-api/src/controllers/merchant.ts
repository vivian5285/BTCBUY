import { triggerReferralCommission } from '../services/commissionService';
import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { createNotification } from './notification';

// 商家订单结算
export const settleMerchantOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const merchantId = req.user.id;

    const order = await prisma.order.update({
      where: {
        id: orderId,
        status: 'completed'
      },
      data: {
        status: 'settled'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // 计算商家收益
    const totalAmount = order.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // 触发分佣
    await triggerReferralCommission({
      event: 'merchant_order',
      fromUserId: merchantId,
      relatedId: order.id,
      amount: totalAmount
    });

    res.json({ message: '订单结算成功' });
  } catch (error) {
    console.error('订单结算失败:', error);
    res.status(500).json({ message: '订单结算失败' });
  }
};

// 获取销售统计
export const getMerchantStats = async (req: Request, res: Response) => {
  try {
    const { timeRange = 'week' } = req.query;
    const merchantId = req.user.id;

    let startDate = new Date();
    switch (timeRange) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const orders = await prisma.order.findMany({
      where: {
        merchantId,
        createdAt: {
          gte: startDate
        },
        status: 'completed'
      },
      select: {
        amount: true,
        createdAt: true
      }
    });

    // 按日期分组统计
    const stats = orders.reduce((acc: any, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += order.amount;
      return acc;
    }, {});

    // 转换为数组格式
    const result = Object.entries(stats).map(([date, amount]) => ({
      date,
      amount
    }));

    res.json(result);
  } catch (error) {
    console.error('获取销售统计失败:', error);
    res.status(500).json({ message: '获取销售统计失败' });
  }
};

// 获取热销商品排行榜
export const getTopProducts = async (req: Request, res: Response) => {
  try {
    const merchantId = req.user.id;

    const products = await prisma.product.findMany({
      where: {
        merchantId
      },
      include: {
        _count: {
          select: {
            orders: {
              where: {
                status: 'completed'
              }
            }
          }
        },
        orders: {
          where: {
            status: 'completed'
          },
          select: {
            amount: true
          }
        }
      }
    });

    const result = products.map(product => ({
      id: product.id,
      name: product.name,
      sales: product._count.orders,
      revenue: product.orders.reduce((sum, order) => sum + order.amount, 0)
    })).sort((a, b) => b.sales - a.sales);

    res.json(result);
  } catch (error) {
    console.error('获取热销商品失败:', error);
    res.status(500).json({ message: '获取热销商品失败' });
  }
};

// 获取新订单
export const getNewOrders = async (req: Request, res: Response) => {
  try {
    const merchantId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const orders = await prisma.order.findMany({
      where: {
        merchantId,
        status: 'pending'
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    res.json(orders);
  } catch (error) {
    console.error('获取新订单失败:', error);
    res.status(500).json({ message: '获取新订单失败' });
  }
}; 