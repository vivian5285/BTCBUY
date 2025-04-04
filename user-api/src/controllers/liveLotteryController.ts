import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { io } from '../socket';

export const createLottery = async (req: Request, res: Response) => {
  try {
    const { liveId, title, type, quantity, startTime, endTime } = req.body;
    const userId = req.user?.id;

    const live = await prisma.live.findUnique({
      where: { id: liveId },
    });

    if (!live || live.userId !== userId) {
      return res.status(403).json({ message: '无权创建抽奖' });
    }

    const lottery = await prisma.liveLottery.create({
      data: {
        liveId,
        title,
        type,
        quantity,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: 'pending',
      },
    });

    // 通知直播间所有用户
    io.to(`live:${liveId}`).emit('lottery_created', lottery);

    res.json(lottery);
  } catch (error) {
    res.status(500).json({ message: '创建抽奖失败' });
  }
};

export const joinLottery = async (req: Request, res: Response) => {
  try {
    const { lotteryId } = req.params;
    const userId = req.user?.id;

    const lottery = await prisma.liveLottery.findUnique({
      where: { id: lotteryId },
      include: { entries: true },
    });

    if (!lottery) {
      return res.status(404).json({ message: '抽奖不存在' });
    }

    if (lottery.status !== 'running') {
      return res.status(400).json({ message: '抽奖未开始或已结束' });
    }

    if (lottery.entries.some(entry => entry.userId === userId)) {
      return res.status(400).json({ message: '已参与抽奖' });
    }

    const entry = await prisma.liveLotteryEntry.create({
      data: {
        lotteryId,
        userId,
      },
    });

    // 通知直播间所有用户
    io.to(`live:${lottery.liveId}`).emit('lottery_joined', {
      lotteryId,
      userId,
      username: req.user?.email,
    });

    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: '参与抽奖失败' });
  }
};

export const drawLottery = async (req: Request, res: Response) => {
  try {
    const { lotteryId } = req.params;
    const userId = req.user?.id;

    const lottery = await prisma.liveLottery.findUnique({
      where: { id: lotteryId },
      include: { entries: true, live: true },
    });

    if (!lottery) {
      return res.status(404).json({ message: '抽奖不存在' });
    }

    if (lottery.live.userId !== userId) {
      return res.status(403).json({ message: '无权开奖' });
    }

    if (lottery.status !== 'running') {
      return res.status(400).json({ message: '抽奖未开始或已结束' });
    }

    // 随机选择中奖者
    const winners = lottery.entries
      .sort(() => Math.random() - 0.5)
      .slice(0, lottery.quantity)
      .map(entry => entry.userId);

    // 更新抽奖状态和中奖者
    const updatedLottery = await prisma.liveLottery.update({
      where: { id: lotteryId },
      data: {
        status: 'ended',
        winners,
      },
      include: {
        entries: {
          include: {
            user: true,
          },
        },
      },
    });

    // 创建中奖通知
    await prisma.liveNotification.createMany({
      data: winners.map(userId => ({
        liveId: lottery.liveId,
        type: 'lottery_winner',
        content: `恭喜中奖！`,
        userId,
      })),
    });

    // 通知直播间所有用户
    io.to(`live:${lottery.liveId}`).emit('lottery_drawn', {
      lotteryId,
      winners: updatedLottery.entries
        .filter(entry => winners.includes(entry.userId))
        .map(entry => ({
          userId: entry.userId,
          username: entry.user.email,
        })),
    });

    res.json(updatedLottery);
  } catch (error) {
    res.status(500).json({ message: '开奖失败' });
  }
};

export const getLotteryResults = async (req: Request, res: Response) => {
  try {
    const { lotteryId } = req.params;

    const lottery = await prisma.liveLottery.findUnique({
      where: { id: lotteryId },
      include: {
        entries: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!lottery) {
      return res.status(404).json({ message: '抽奖不存在' });
    }

    const winners = lottery.entries
      .filter(entry => lottery.winners.includes(entry.userId))
      .map(entry => ({
        userId: entry.userId,
        username: entry.user.email,
        createdAt: entry.createdAt,
      }));

    res.json({
      lottery,
      winners,
      totalParticipants: lottery.entries.length,
    });
  } catch (error) {
    res.status(500).json({ message: '获取抽奖结果失败' });
  }
}; 