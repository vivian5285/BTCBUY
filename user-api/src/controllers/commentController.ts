import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const addComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { videoId } = req.params;
    const { content } = req.body;

    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    if (!content) {
      return res.status(400).json({ message: '评论内容不能为空' });
    }

    const comment = await prisma.comment.create({
      data: {
        userId,
        videoId,
        content
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    return res.json({ message: '评论成功', comment });
  } catch (error) {
    console.error('添加评论失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const comments = await prisma.comment.findMany({
      where: { videoId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.comment.count({
      where: { videoId }
    });

    return res.json({
      comments,
      total,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('获取评论失败:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
}; 