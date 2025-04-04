import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { uploadToOSS, generateThumbnail } from '../services/ossService';
import { checkVideoContent } from '../services/contentModeration';

export const uploadVideo = async (req: Request, res: Response) => {
  try {
    const { title, description, productId } = req.body;
    const videoFile = req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!videoFile) {
      return res.status(400).json({ error: '请上传视频文件' });
    }

    // 上传视频到 OSS
    const videoUrl = await uploadToOSS(videoFile, 'videos');
    
    // 生成视频封面
    const thumbnailUrl = thumbnailFile 
      ? await uploadToOSS(thumbnailFile, 'thumbnails')
      : await generateThumbnail(videoUrl);

    // 创建视频记录
    const video = await prisma.video.create({
      data: {
        userId: req.user.id,
        title,
        description,
        videoUrl,
        thumbnail: thumbnailUrl,
        productId: productId || null,
        status: 'pending'
      }
    });

    res.json(video);
  } catch (error) {
    console.error('上传视频失败:', error);
    res.status(500).json({ error: '上传视频失败' });
  }
};

export const getMyVideos = async (req: Request, res: Response) => {
  try {
    const videos = await prisma.video.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        product: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(videos);
  } catch (error) {
    console.error('获取视频列表失败:', error);
    res.status(500).json({ error: '获取视频列表失败' });
  }
};

export const updateVideoStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 检查视频是否存在
    const video = await prisma.video.findUnique({
      where: { id }
    });

    if (!video) {
      return res.status(404).json({ error: '视频不存在' });
    }

    // 如果是审核通过，检查视频内容
    if (status === 'approved') {
      const isSafe = await checkVideoContent(video.videoUrl);
      if (!isSafe) {
        return res.status(400).json({ error: '视频内容不符合规范' });
      }
    }

    // 更新视频状态
    const updatedVideo = await prisma.video.update({
      where: { id },
      data: { status }
    });

    res.json(updatedVideo);
  } catch (error) {
    console.error('更新视频状态失败:', error);
    res.status(500).json({ error: '更新视频状态失败' });
  }
}; 