import { Request, Response } from 'express';
import { PrismaClient, CommissionStatus } from '@prisma/client';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

// 扩展 Request 类型以包含用户信息
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    iat: number;
    exp: number;
  };
}

export const getMyCommissions = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: '未授权' });
  }

  try {
    const commissions = await prisma.commission.findMany({
      where: { userId },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(commissions);
  } catch (error) {
    console.error('获取佣金列表失败:', error);
    res.status(500).json({ message: '获取佣金列表失败' });
  }
};

// 获取订单佣金信息
export const getOrderCommission = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: '未授权' });
  }

  const { orderId } = req.params;

  try {
    const commission = await prisma.commission.findFirst({
      where: { 
        orderId,
        userId
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!commission) {
      return res.status(404).json({ message: '未找到佣金记录' });
    }

    res.json(commission);
  } catch (error) {
    console.error('获取订单佣金失败:', error);
    res.status(500).json({ message: '获取订单佣金失败' });
  }
};

// 确认佣金支付
export const confirmCommissionPayment = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: '未授权' });
  }

  const { commissionId } = req.params;
  const { txHash } = req.body;

  try {
    const commission = await prisma.commission.findUnique({
      where: { id: commissionId },
      include: {
        order: true
      }
    });

    if (!commission) {
      return res.status(404).json({ message: '佣金记录不存在' });
    }

    if (commission.userId !== userId) {
      return res.status(403).json({ message: '无权操作此佣金记录' });
    }

    if (commission.status !== 'PENDING') {
      return res.status(400).json({ message: '佣金状态不正确，只有待支付的佣金才能确认支付' });
    }

    // 验证交易哈希
    const isPaymentValid = await verifyTransaction(txHash, commission.amount);
    
    if (isPaymentValid) {
      // 更新佣金状态为已支付
      const updatedCommission = await prisma.commission.update({
        where: { id: commissionId },
        data: { 
          status: 'PAID',
          txHash
        }
      });

      res.json({ message: '佣金支付确认成功', commission: updatedCommission });
    } else {
      res.status(400).json({ message: '佣金支付验证失败' });
    }
  } catch (error) {
    console.error('确认佣金支付失败:', error);
    res.status(500).json({ message: '确认佣金支付失败' });
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