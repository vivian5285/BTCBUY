import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const toggleLike = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { videoId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId
        }
      }
    });

    if (existingLike) {
      await prisma.like.delete({
        where: {
          userId_videoId: {
            userId,
            videoId
          }
        }
      });
      return res.json({ message: '取消点赞成功' });
    } else {
      await prisma.like.create({
        data: {
          userId,
          videoId
        }
      });
      return res.json({ message: '点赞成功' });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

export const getVideoLikes = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const likes = await prisma.like.count({
      where: { videoId }
    });
    return res.json({ likes });
  } catch (error) {
    console.error('获取点赞数失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
}; 