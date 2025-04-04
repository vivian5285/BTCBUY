import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();

// 扩展 Request 类型以包含用户信息
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    iat: number;
    exp: number;
  };
}

// 绑定钱包地址
export const bindWallet = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { chain, address } = req.body;

    // 验证链类型
    const validChains = ['bsc', 'trc', 'erc', 'op', 'arb'];
    if (!validChains.includes(chain)) {
      return res.status(400).json({ error: 'Invalid chain type' });
    }

    // 更新用户钱包地址
    const walletField = `wallet_${chain}`;
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        [walletField]: address,
      },
    });

    res.json({
      message: 'Wallet address bound successfully',
      user: {
        id: user.id,
        [walletField]: user[walletField],
      },
    });
  } catch (error) {
    console.error('Error binding wallet:', error);
    res.status(500).json({ error: 'Failed to bind wallet address' });
  }
};

// 获取用户的充值记录
export const getDeposits = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { chain, page = 1, limit = 10 } = req.query;

    const where: any = { userId };
    if (chain) {
      where.chain = chain;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [deposits, total] = await Promise.all([
      prisma.deposit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.deposit.count({ where }),
    ]);

    res.json({
      deposits,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    res.status(500).json({ error: 'Failed to fetch deposit records' });
  }
};

// 获取用户的钱包地址列表
export const getWallets = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        wallet: true,
        wallet_bsc: true,
        wallet_trc: true,
        wallet_erc: true,
        wallet_op: true,
        wallet_arb: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      wallets: {
        main: user.wallet,
        bsc: user.wallet_bsc,
        trc: user.wallet_trc,
        erc: user.wallet_erc,
        op: user.wallet_op,
        arb: user.wallet_arb,
      },
    });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    res.status(500).json({ error: 'Failed to fetch wallet addresses' });
  }
};

// 获取用户的充值记录
export const getMyDepositsController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const deposits = await prisma.deposit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(deposits);
  } catch (error) {
    res.status(500).json({ error: '获取充值记录失败' });
  }
}; 