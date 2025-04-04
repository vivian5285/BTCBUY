import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { videoId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId
        }
      }
    });

    if (existingFavorite) {
      await prisma.favorite.delete({
        where: {
          userId_videoId: {
            userId,
            videoId
          }
        }
      });
      return res.json({ message: '取消收藏成功' });
    } else {
      await prisma.favorite.create({
        data: {
          userId,
          videoId
        }
      });
      return res.json({ message: '收藏成功' });
    }
  } catch (error) {
    console.error('收藏操作失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

export const getMyFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        video: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.favorite.count({
      where: { userId }
    });

    return res.json({
      favorites,
      total,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
}; 