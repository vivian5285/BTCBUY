import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 一次性绑定多个链的钱包地址
export const setMultiChainWallets = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { wallet_bsc, wallet_trc, wallet_erc, wallet_op, wallet_arb } = req.body;

    // 验证所有地址格式
    const addresses = {
      wallet_bsc,
      wallet_trc,
      wallet_erc,
      wallet_op,
      wallet_arb,
    };

    // 更新用户钱包地址
    const user = await prisma.user.update({
      where: { id: userId },
      data: addresses,
      select: {
        id: true,
        wallet_bsc: true,
        wallet_trc: true,
        wallet_erc: true,
        wallet_op: true,
        wallet_arb: true,
      },
    });

    res.json({
      message: 'Wallets updated successfully',
      wallets: user,
    });
  } catch (error) {
    console.error('Error updating wallets:', error);
    res.status(500).json({ error: 'Failed to update wallets' });
  }
};

// 获取用户的钱包地址列表
export const getWallets = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

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