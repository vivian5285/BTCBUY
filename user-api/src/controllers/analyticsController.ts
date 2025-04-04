import { Request, Response } from 'express';
import { prisma } from '../prisma';

// 获取用户行为分析数据
export const getUserBehavior = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // 获取浏览记录
    const views = await prisma.productView.findMany({
      where: {
        userId,
        viewedAt: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
          },
        },
      },
      orderBy: {
        viewedAt: 'desc',
      },
    });

    // 获取购买记录
    const purchases = await prisma.purchaseHistory.findMany({
      where: {
        userId,
        purchasedAt: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
          },
        },
      },
      orderBy: {
        purchasedAt: 'desc',
      },
    });

    // 计算用户偏好
    const preferences = await prisma.userPreference.findMany({
      where: { userId },
      orderBy: { weight: 'desc' },
    });

    res.json({
      views,
      purchases,
      preferences,
    });
  } catch (error) {
    console.error('获取用户行为数据失败:', error);
    res.status(500).json({ error: '获取用户行为数据失败' });
  }
};

// 获取商品热度分析数据
export const getProductAnalytics = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { startDate, endDate } = req.query;

    // 获取商品分析数据
    const analytics = await prisma.productAnalytics.findUnique({
      where: { productId },
    });

    // 获取浏览记录
    const views = await prisma.productView.findMany({
      where: {
        productId,
        viewedAt: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        viewedAt: 'desc',
      },
    });

    // 获取购买记录
    const purchases = await prisma.purchaseHistory.findMany({
      where: {
        productId,
        purchasedAt: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        purchasedAt: 'desc',
      },
    });

    res.json({
      analytics,
      views,
      purchases,
    });
  } catch (error) {
    console.error('获取商品分析数据失败:', error);
    res.status(500).json({ error: '获取商品分析数据失败' });
  }
};

// 获取热门商品排行
export const getPopularProducts = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const popularProducts = await prisma.productAnalytics.findMany({
      take: Number(limit),
      orderBy: [
        { viewCount: 'desc' },
        { purchaseCount: 'desc' },
      ],
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            stock: true,
          },
        },
      },
    });

    res.json(popularProducts);
  } catch (error) {
    console.error('获取热门商品失败:', error);
    res.status(500).json({ error: '获取热门商品失败' });
  }
};

// 更新商品分析数据
export const updateProductAnalytics = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { viewCount, purchaseCount, totalRevenue, averageRating } = req.body;

    const analytics = await prisma.productAnalytics.upsert({
      where: { productId },
      update: {
        viewCount,
        purchaseCount,
        totalRevenue,
        averageRating,
      },
      create: {
        productId,
        viewCount,
        purchaseCount,
        totalRevenue,
        averageRating,
      },
    });

    res.json(analytics);
  } catch (error) {
    console.error('更新商品分析数据失败:', error);
    res.status(500).json({ error: '更新商品分析数据失败' });
  }
};

// 更新用户偏好
export const updateUserPreference = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { category, weight } = req.body;

    const preference = await prisma.userPreference.upsert({
      where: {
        userId_category: {
          userId,
          category,
        },
      },
      update: {
        weight,
      },
      create: {
        userId,
        category,
        weight,
      },
    });

    res.json(preference);
  } catch (error) {
    console.error('更新用户偏好失败:', error);
    res.status(500).json({ error: '更新用户偏好失败' });
  }
}; 