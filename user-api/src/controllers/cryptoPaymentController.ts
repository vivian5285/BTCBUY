import { Request, Response } from 'express';
import axios from 'axios';
import { prisma } from '../prisma';

const COINBASE_API_KEY = process.env.COINBASE_API_KEY;
const COINBASE_API_URL = 'https://api.coinbase.com/v2';

interface CreateUSDTInvoiceRequest {
  orderId: string;
  amount: number;
  currency: string;
}

export const createUSDTInvoice = async (req: Request, res: Response) => {
  try {
    const { orderId, amount, currency } = req.body as CreateUSDTInvoiceRequest;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 验证订单是否存在且属于当前用户
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: '订单不存在' });
    }

    // 创建Coinbase支付订单
    const response = await axios.post(
      `${COINBASE_API_URL}/charges`,
      {
        name: `订单 ${orderId}`,
        description: `通过USDT支付购买商品`,
        amount: {
          amount: amount.toString(),
          currency: currency.toUpperCase()
        },
        metadata: {
          orderId,
          userId
        },
        pricing_type: 'fixed_price',
        redirect_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
      },
      {
        headers: {
          'X-CC-Api-Key': COINBASE_API_KEY,
          'X-CC-Version': '2018-03-22'
        }
      }
    );

    // 更新订单状态为待支付
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'pending',
        paymentMethod: 'usdt',
        paymentUrl: response.data.data.hosted_url
      }
    });

    res.json({
      paymentUrl: response.data.data.hosted_url,
      orderId
    });
  } catch (error) {
    console.error('创建USDT支付订单失败:', error);
    res.status(500).json({ message: '创建支付订单失败' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 获取订单信息
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: '订单不存在' });
    }

    // 从Coinbase获取支付状态
    const response = await axios.get(
      `${COINBASE_API_URL}/charges/${orderId}`,
      {
        headers: {
          'X-CC-Api-Key': COINBASE_API_KEY,
          'X-CC-Version': '2018-03-22'
        }
      }
    );

    const paymentStatus = response.data.data.status;

    // 更新订单状态
    if (paymentStatus === 'completed') {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'paid',
          paymentTime: new Date()
        }
      });
    }

    res.json({
      status: paymentStatus,
      orderId
    });
  } catch (error) {
    console.error('验证支付状态失败:', error);
    res.status(500).json({ message: '验证支付状态失败' });
  }
}; 