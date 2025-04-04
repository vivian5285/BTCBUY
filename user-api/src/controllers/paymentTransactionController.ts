import { Request, Response } from 'express';
import { prisma } from '../prisma';

interface CreatePaymentTransactionRequest {
  userId: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentUrl: string;
  paymentMethod: string;
}

interface UpdatePaymentStatusRequest {
  transactionId: string;
  status: string;
  txHash?: string;
}

export const createPaymentTransaction = async (req: Request, res: Response) => {
  try {
    const { userId, orderId, amount, currency, paymentUrl, paymentMethod } = req.body as CreatePaymentTransactionRequest;

    // 验证用户权限
    if (req.user?.id !== userId) {
      return res.status(403).json({ message: '无权创建支付记录' });
    }

    // 验证订单是否存在
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    const paymentTransaction = await prisma.paymentTransaction.create({
      data: {
        userId,
        orderId,
        amount,
        currency,
        status: 'pending',
        paymentUrl,
        paymentMethod
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        },
        order: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    res.json(paymentTransaction);
  } catch (error) {
    console.error('创建支付记录失败:', error);
    res.status(500).json({ message: '创建支付记录失败' });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { transactionId, status, txHash } = req.body as UpdatePaymentStatusRequest;

    // 获取支付记录
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        order: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ message: '支付记录不存在' });
    }

    // 验证用户权限
    if (req.user?.id !== transaction.userId) {
      return res.status(403).json({ message: '无权更新支付状态' });
    }

    const updatedTransaction = await prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: { 
        status,
        txHash: txHash || undefined
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        },
        order: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    // 如果支付成功，更新订单状态
    if (status === 'completed') {
      await prisma.order.update({
        where: { id: transaction.orderId },
        data: { status: 'paid' }
      });
    }

    res.json(updatedTransaction);
  } catch (error) {
    console.error('更新支付状态失败:', error);
    res.status(500).json({ message: '更新支付状态失败' });
  }
};

export const getPaymentTransactions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const transactions = await prisma.paymentTransaction.findMany({
      where: { userId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            products: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(transactions);
  } catch (error) {
    console.error('获取支付记录失败:', error);
    res.status(500).json({ message: '获取支付记录失败' });
  }
}; 