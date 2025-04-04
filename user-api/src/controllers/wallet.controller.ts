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

// 设置多链钱包地址
export const setWalletsController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const { wallet_bsc, wallet_trc, wallet_erc, wallet_op, wallet_arb } = req.body;

    // 验证地址格式（这里可以添加更详细的验证逻辑）
    const chains = ['bsc', 'trc', 'erc', 'op', 'arb'];
    for (const chain of chains) {
      const wallet = req.body[`wallet_${chain}`];
      if (wallet && !wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({ error: `Invalid ${chain.toUpperCase()} wallet address` });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        wallet_bsc,
        wallet_trc,
        wallet_erc,
        wallet_op,
        wallet_arb
      }
    });

    res.json({
      message: '钱包地址更新成功',
      wallets: {
        bsc: user.wallet_bsc,
        trc: user.wallet_trc,
        erc: user.wallet_erc,
        op: user.wallet_op,
        arb: user.wallet_arb
      }
    });
  } catch (error) {
    res.status(500).json({ error: '更新钱包地址失败' });
  }
}; 