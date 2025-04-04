import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getLiveData = async (req: Request, res: Response) => {
  try {
    const { liveId } = req.params;
    const userId = req.user?.id;

    // 验证直播是否存在且属于当前用户
    const live = await prisma.live.findUnique({
      where: { id: liveId },
    });

    if (!live || live.userId !== userId) {
      return res.status(403).json({ message: '无权访问此直播数据' });
    }

    // 获取直播的销售数据
    const salesData = await prisma.liveSalesData.findMany({
      where: { liveId },
      include: { 
        product: {
          select: {
            name: true,
            price: true,
            image: true,
          }
        }
      },
    });

    // 获取直播的互动数据
    const interactionData = await prisma.liveInteractionData.findMany({
      where: { liveId },
      include: {
        user: {
          select: {
            email: true,
          }
        }
      },
    });

    // 计算统计数据
    const totalSales = salesData.reduce((sum, data) => sum + data.totalAmount, 0);
    const totalQuantity = salesData.reduce((sum, data) => sum + data.quantity, 0);
    const totalLikes = interactionData.reduce((sum, data) => sum + data.likes, 0);
    const totalComments = interactionData.reduce((sum, data) => sum + data.comments, 0);
    const totalLotteryEntries = interactionData.reduce((sum, data) => sum + data.lotteryEntries, 0);
    const uniqueUsers = new Set(interactionData.map(data => data.userId)).size;

    // 获取直播基本信息
    const liveInfo = await prisma.live.findUnique({
      where: { id: liveId },
      select: {
        title: true,
        description: true,
        viewers: true,
        likes: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.json({
      liveInfo,
      salesData: {
        items: salesData,
        totalSales,
        totalQuantity,
        averageOrderValue: totalQuantity > 0 ? totalSales / totalQuantity : 0,
      },
      interactionData: {
        totalLikes,
        totalComments,
        totalLotteryEntries,
        uniqueUsers,
        userInteractions: interactionData,
      },
    });
  } catch (error) {
    console.error('获取直播数据失败:', error);
    res.status(500).json({ message: '获取直播数据失败' });
  }
};

export const getLiveAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate } = req.query;

    // 获取用户的所有直播
    const lives = await prisma.live.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined,
        }
      },
      include: {
        _count: {
          select: {
            viewers: true,
            likes: true,
            comments: true,
          }
        },
        salesData: {
          select: {
            quantity: true,
            totalAmount: true,
          }
        },
        interactionData: {
          select: {
            likes: true,
            comments: true,
            lotteryEntries: true,
          }
        }
      },
    });

    // 计算总体统计数据
    const totalStats = lives.reduce((acc, live) => {
      acc.totalViewers += live._count.viewers;
      acc.totalLikes += live._count.likes;
      acc.totalComments += live._count.comments;
      acc.totalSales += live.salesData.reduce((sum, data) => sum + data.totalAmount, 0);
      acc.totalQuantity += live.salesData.reduce((sum, data) => sum + data.quantity, 0);
      acc.totalLotteryEntries += live.interactionData.reduce((sum, data) => sum + data.lotteryEntries, 0);
      return acc;
    }, {
      totalViewers: 0,
      totalLikes: 0,
      totalComments: 0,
      totalSales: 0,
      totalQuantity: 0,
      totalLotteryEntries: 0,
    });

    res.json({
      totalStats,
      lives: lives.map(live => ({
        id: live.id,
        title: live.title,
        viewers: live._count.viewers,
        likes: live._count.likes,
        comments: live._count.comments,
        sales: live.salesData.reduce((sum, data) => sum + data.totalAmount, 0),
        quantity: live.salesData.reduce((sum, data) => sum + data.quantity, 0),
        lotteryEntries: live.interactionData.reduce((sum, data) => sum + data.lotteryEntries, 0),
        createdAt: live.createdAt,
      })),
    });
  } catch (error) {
    console.error('获取直播分析数据失败:', error);
    res.status(500).json({ message: '获取直播分析数据失败' });
  }
}; 