import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const createLuckyBag = async (req: Request, res: Response) => {
  try {
    const { liveId, type, total, rewardDesc, expiredAt } = req.body;
    const userId = (req as any).user.userId;

    const luckyBag = await prisma.liveLuckyBag.create({
      data: {
        liveId,
        type,
        total: Number(total),
        rewardDesc,
        expiredAt: new Date(expiredAt),
      },
    });

    res.json(luckyBag);
  } catch (error) {
    console.error('创建福袋失败:', error);
    res.status(500).json({ message: '创建福袋失败' });
  }
};

export const joinLuckyBag = async (req: Request, res: Response) => {
  try {
    const { liveId } = req.params;
    const userId = (req as any).user.userId;

    const luckyBag = await prisma.liveLuckyBag.findUnique({
      where: { liveId },
    });

    if (!luckyBag) {
      return res.status(404).json({ message: '福袋不存在' });
    }

    if (luckyBag.claimed >= luckyBag.total) {
      return res.status(400).json({ message: '福袋已领完' });
    }

    if (new Date() > luckyBag.expiredAt) {
      return res.status(400).json({ message: '福袋已过期' });
    }

    const alreadyClaimed = await prisma.liveLuckyBagEntry.findFirst({
      where: { liveId, userId },
    });

    if (alreadyClaimed) {
      return res.status(400).json({ message: '您已参与过抽奖' });
    }

    // 随机中奖
    const isWinner = Math.random() < 0.5; // 50% 几率中奖
    if (isWinner) {
      await prisma.liveLuckyBag.update({
        where: { liveId },
        data: {
          claimed: luckyBag.claimed + 1,
          winners: { push: userId },
        },
      });
    }

    // 记录用户参与
    await prisma.liveLuckyBagEntry.create({
      data: { liveId, userId },
    });

    res.json({ 
      message: isWinner ? '恭喜您中奖！' : '感谢参与！',
      isWinner,
      rewardDesc: isWinner ? luckyBag.rewardDesc : null
    });
  } catch (error) {
    console.error('参与福袋抽奖失败:', error);
    res.status(500).json({ message: '参与抽奖失败' });
  }
}; 