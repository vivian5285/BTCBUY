import { Request, Response } from 'express';
import { PrismaClient, Product, OrderStatus, CommissionStatus } from '@prisma/client';
import { ethers } from 'ethers';
import { applyCouponToOrder } from '../services/couponService';
import { verifyTransaction } from '../services/blockchain';
import { transferToMerchant, transferCommission } from '../services/payment';
import { CouponUsage } from '../models';
import { handleOrderCompletion } from '../services/orderService';

const prisma = new PrismaClient();

// 扩展 Request 类型以包含用户信息
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    iat: number;
    exp: number;
  };
}

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: '未授权' });
  }
  
  const { productId, quantity, useCoupon = true } = req.body;

  try {
    const product = await prisma.product.findUnique({ 
      where: { id: productId }
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock' });
    }

    // 计算订单金额
    const originalAmount = product.price * quantity;
    
    // 应用优惠券
    let finalAmount = originalAmount;
    let couponId = null;
    let couponUsage = null;
    
    if (useCoupon) {
      const availableCoupon = await prisma.coupon.findFirst({
        where: { 
          userId: userId,
          status: 'active'
        },
        orderBy: { createdAt: 'asc' },
      });

      if (availableCoupon) {
        finalAmount -= availableCoupon.amount;
        couponId = availableCoupon.id;

        // 更新优惠券状态
        await prisma.coupon.update({
          where: { id: availableCoupon.id },
          data: { status: 'used' },
        });

        // 记录优惠券使用情况
        couponUsage = await CouponUsage.create({
          coupon: availableCoupon.id,
          order: order.id,
          user: userId,
          amount: availableCoupon.amount,
          originalAmount: originalAmount
        });
      }
    }

    // 创建订单
    const order = await prisma.order.create({
      data: {
        userId,
        productId,
        amount: finalAmount,
        status: 'PENDING',
        couponId,
        quantity
      }
    });

    // 更新商品库存
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } }
    });

    // 获取完整的订单信息
    const orderWithDetails = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        user: true,
        product: true,
        coupon: true
      }
    });

    res.json({ 
      message: 'Order created', 
      order: orderWithDetails,
      originalAmount,
      discount: originalAmount - finalAmount,
      couponApplied: !!couponId,
      couponUsage
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

export const getMyOrders = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: '未授权' });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// 获取店铺订单列表
export const getStoreOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    // 获取用户拥有的店铺
    const stores = await prisma.store.findMany({
      where: { ownerId: userId }
    });

    if (stores.length === 0) {
      return res.status(404).json({ error: '您没有店铺' });
    }

    const storeIds = stores.map(store => store.id);

    // 获取店铺的所有产品
    const products = await prisma.product.findMany({
      where: { storeId: { in: storeIds } }
    });

    const productIds = products.map(product => product.id);

    // 获取这些产品的所有订单
    const orders = await prisma.order.findMany({
      where: { productId: { in: productIds } },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    console.error('获取店铺订单失败:', error);
    res.status(500).json({ error: '获取店铺订单失败' });
  }
};

// 标记订单为已发货
export const markOrderShipped = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const { orderId } = req.params;

    // 获取订单信息
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true }
    });

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    // 检查用户是否拥有该产品所属的店铺
    const store = await prisma.store.findFirst({
      where: {
        ownerId: userId,
        products: {
          some: {
            id: order.productId
          }
        }
      }
    });

    if (!store) {
      return res.status(403).json({ error: '您没有权限操作此订单' });
    }

    // 更新订单状态为已发货
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'shipped' }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('标记订单发货失败:', error);
    res.status(500).json({ error: '标记订单发货失败' });
  }
};

// 确认支付
export const confirmPayment = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: '未授权' });
  }

  const { orderId, txHash } = req.body;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ message: '无权操作此订单' });
    }

    // 验证交易哈希
    const isPaymentValid = await verifyTransaction(txHash, order.totalAmount);
    
    if (isPaymentValid) {
      // 更新订单状态为已支付
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: 'paid',
          txHash,
          paymentTime: new Date()
        }
      });

      res.json({ message: '支付确认成功', order: updatedOrder });
    } else {
      res.status(400).json({ message: '支付验证失败' });
    }
  } catch (error) {
    console.error('确认支付失败:', error);
    res.status(500).json({ message: '确认支付失败' });
  }
};

// 完成订单（用户确认收货）
export const completeOrder = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: '未授权' });
  }

  const { orderId } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        user: true,
        product: {
          include: {
            store: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ message: '无权操作此订单' });
    }

    if (order.status !== 'shipped') {
      return res.status(400).json({ message: '订单状态不正确，只有已发货的订单才能确认收货' });
    }

    // 更新订单状态为已完成
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'delivered' }
    });

    // 获取商家钱包地址
    const merchantWallet = order.product.store.walletAddress;
    
    if (!merchantWallet) {
      return res.status(400).json({ message: '商家未设置钱包地址，无法完成结算' });
    }

    // 转账给商家
    const txHash = await transferToMerchant(merchantWallet, order.totalAmount);
    
    // 如果有邀请人，结算佣金
    if (order.invitedById) {
      const commissionAmount = order.totalAmount * 0.05; // 佣金比例 5%
      
      // 创建佣金记录
      const commission = await prisma.commission.create({
        data: {
          userId: order.invitedById,
          orderId: order.id,
          amount: commissionAmount,
          status: 'PENDING'
        }
      });
      
      // 转账佣金给邀请人
      const invitedUser = await prisma.user.findUnique({
        where: { id: order.invitedById }
      });
      
      if (invitedUser?.wallet) {
        const commissionTxHash = await transferCommission(invitedUser.wallet, commissionAmount);
        
        // 更新佣金状态为已支付
        await prisma.commission.update({
          where: { id: commission.id },
          data: { 
            status: 'PAID',
            txHash: commissionTxHash
          }
        });
      }
    }

    // 调用订单完成处理服务
    await handleOrderCompletion(updatedOrder);

    res.json({ 
      message: '订单已完成，资金已结算给商家', 
      order: updatedOrder,
      merchantTxHash: txHash
    });
  } catch (error) {
    console.error('完成订单失败:', error);
    res.status(500).json({ message: '完成订单失败' });
  }
};

// 获取订单结算状态
export const getOrderSettlement = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: '未授权' });
  }

  const { orderId } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        user: true,
        product: {
          include: {
            store: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    // 检查商家是否已收到款项
    const merchantPaid = order.status === 'delivered';
    
    // 检查佣金是否已支付
    let commissionPaid = false;
    let commissionTxHash = null;
    
    if (order.invitedById) {
      const commission = await prisma.commission.findFirst({
        where: { 
          orderId: order.id,
          userId: order.invitedById
        }
      });
      
      if (commission) {
        commissionPaid = commission.status === 'PAID';
        commissionTxHash = commission.txHash;
      }
    }

    res.json({
      merchantPaid,
      commissionPaid,
      merchantTxHash: order.txHash,
      commissionTxHash
    });
  } catch (error) {
    console.error('获取订单结算状态失败:', error);
    res.status(500).json({ message: '获取订单结算状态失败' });
  }
};

// 验证交易哈希
async function verifyTransaction(txHash: string, amount: number): Promise<boolean> {
  try {
    // 这里应该实现实际的链上交易验证逻辑
    // 例如，通过以太坊节点查询交易状态和金额
    // 为了演示，我们假设验证成功
    return true;
  } catch (error) {
    console.error('验证交易失败:', error);
    return false;
  }
}

// 转账给商家
async function transferToMerchant(merchantWallet: string, amount: number): Promise<string> {
  try {
    // 这里应该实现实际的链上转账逻辑
    // 例如，使用 ethers.js 发送交易
    // 为了演示，我们返回一个模拟的交易哈希
    return `0x${Math.random().toString(16).substring(2, 42)}`;
  } catch (error) {
    console.error('转账给商家失败:', error);
    throw new Error('转账给商家失败');
  }
}

// 转账佣金
async function transferCommission(userWallet: string, amount: number): Promise<string> {
  try {
    // 这里应该实现实际的链上转账逻辑
    // 例如，使用 ethers.js 发送交易
    // 为了演示，我们返回一个模拟的交易哈希
    return `0x${Math.random().toString(16).substring(2, 42)}`;
  } catch (error) {
    console.error('转账佣金失败:', error);
    throw new Error('转账佣金失败');
  }
} 