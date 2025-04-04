import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { createNotification } from './notification';

// 创建提现请求
export const createWithdrawalRequest = async (req: Request, res: Response) => {
  try {
    const { amount, walletAddress, chain } = req.body;
    const userId = req.user.id;

    // 检查用户余额
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.balance < amount) {
      return res.status(400).json({ message: '余额不足' });
    }

    // 检查钱包地址
    const walletField = `wallet_${chain.toLowerCase()}`;
    if (!user[walletField]) {
      return res.status(400).json({ message: '请先绑定对应链的钱包地址' });
    }

    // 创建提现请求
    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId,
        amount,
        walletAddress,
        chain,
        status: 'pending'
      }
    });

    // 冻结用户余额
    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: {
          decrement: amount
        }
      }
    });

    // 创建通知
    await createNotification(
      userId,
      'withdrawal',
      `您已提交提现申请，金额：${amount}，链：${chain}，钱包地址：${walletAddress}`
    );

    res.json({ message: '提现请求已创建', withdrawal });
  } catch (error) {
    console.error('创建提现请求失败:', error);
    res.status(500).json({ message: '创建提现请求失败' });
  }
};

// 获取用户的提现记录
export const getUserWithdrawals = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    res.json(withdrawals);
  } catch (error) {
    console.error('获取提现记录失败:', error);
    res.status(500).json({ message: '获取提现记录失败' });
  }
};

// 管理员处理提现请求
export const processWithdrawalRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status, txHash } = req.body;

    const withdrawal = await prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: { 
        status,
        txHash: status === 'completed' ? txHash : null
      }
    });

    // 如果提现被拒绝,返还用户余额
    if (status === 'rejected') {
      await prisma.user.update({
        where: { id: withdrawal.userId },
        data: {
          balance: {
            increment: withdrawal.amount
          }
        }
      });
    }

    // 创建通知
    await createNotification(
      withdrawal.userId,
      'withdrawal',
      `您的提现申请已${status === 'completed' ? '完成' : '被拒绝'}，金额：${withdrawal.amount}`
    );

    res.json({ message: '提现请求已处理', withdrawal });
  } catch (error) {
    console.error('处理提现请求失败:', error);
    res.status(500).json({ message: '处理提现请求失败' });
  }
}; 