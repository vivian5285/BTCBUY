import { Request, Response } from 'express';
import { prisma } from '../prisma';

// 基于用户行为的推荐
export const recommendProducts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    // 获取用户浏览记录
    const viewedProducts = await prisma.productView.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { viewedAt: 'desc' },
      take: 5, // 获取最近浏览的5个商品
    });

    if (viewedProducts.length === 0) {
      // 如果没有浏览记录，返回热门商品
      return recommendPopularProducts(req, res);
    }

    // 获取用户购买记录
    const purchasedProducts = await prisma.purchaseHistory.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { purchasedAt: 'desc' },
      take: 5,
    });

    // 获取用户偏好
    const preferences = await prisma.userPreference.findMany({
      where: { userId },
      orderBy: { weight: 'desc' },
      take: 3,
    });

    // 基于用户偏好和浏览历史推荐商品
    const recommendedProducts = await prisma.product.findMany({
      where: {
        AND: [
          { id: { notIn: viewedProducts.map(v => v.productId) } }, // 排除已浏览的商品
          { stock: { gt: 0 } }, // 只推荐有库存的商品
          {
            OR: [
              // 基于用户偏好的推荐
              ...preferences.map(p => ({
                category: p.category,
              })),
              // 基于浏览历史的推荐
              ...viewedProducts.map(v => ({
                category: v.product.category,
              })),
            ],
          },
        ],
      },
      include: {
        analytics: true,
      },
      orderBy: [
        { analytics: { viewCount: 'desc' } },
        { analytics: { purchaseCount: 'desc' } },
      ],
      take: Number(limit),
    });

    res.json(recommendedProducts);
  } catch (error) {
    console.error('获取推荐商品失败:', error);
    res.status(500).json({ error: '获取推荐商品失败' });
  }
};

// 基于商品热度的推荐
export const recommendPopularProducts = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const popularProducts = await prisma.product.findMany({
      where: {
        stock: { gt: 0 },
        status: 'published',
      },
      include: {
        analytics: true,
      },
      orderBy: [
        { analytics: { viewCount: 'desc' } },
        { analytics: { purchaseCount: 'desc' } },
      ],
      take: Number(limit),
    });

    res.json(popularProducts);
  } catch (error) {
    console.error('获取热门商品失败:', error);
    res.status(500).json({ error: '获取热门商品失败' });
  }
};

// 获取相似商品推荐
export const recommendSimilarProducts = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { limit = 5 } = req.query;

    // 获取当前商品信息
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { analytics: true },
    });

    if (!currentProduct) {
      return res.status(404).json({ error: '商品不存在' });
    }

    // 获取相似商品
    const similarProducts = await prisma.product.findMany({
      where: {
        AND: [
          { id: { not: productId } },
          { stock: { gt: 0 } },
          { status: 'published' },
          { category: currentProduct.category },
        ],
      },
      include: {
        analytics: true,
      },
      orderBy: [
        { analytics: { viewCount: 'desc' } },
        { analytics: { purchaseCount: 'desc' } },
      ],
      take: Number(limit),
    });

    res.json(similarProducts);
  } catch (error) {
    console.error('获取相似商品失败:', error);
    res.status(500).json({ error: '获取相似商品失败' });
  }
};

// 记录商品浏览
export const recordProductView = async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;
    const { duration, source } = req.query;

    // 创建浏览记录
    const view = await prisma.productView.create({
      data: {
        userId,
        productId,
        duration: Number(duration) || 0,
        source: source as string,
      },
    });

    // 更新商品分析数据
    await prisma.productAnalytics.upsert({
      where: { productId },
      update: {
        viewCount: { increment: 1 },
      },
      create: {
        productId,
        viewCount: 1,
        purchaseCount: 0,
        totalRevenue: 0,
        averageRating: 0,
      },
    });

    res.json(view);
  } catch (error) {
    console.error('记录商品浏览失败:', error);
    res.status(500).json({ error: '记录商品浏览失败' });
  }
}; 