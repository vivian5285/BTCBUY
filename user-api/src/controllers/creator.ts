import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { uploadToCloudinary } from '../utils/cloudinary';
import { triggerReferralCommission } from '../services/commissionService';

// 申请成为带货者
export const applyCreator = async (req: Request, res: Response) => {
  try {
    const { bio, avatar, nickname } = req.body;
    const userId = req.user.id;

    // 检查是否已经是带货者
    const existingCreator = await prisma.contentCreator.findUnique({
      where: { userId }
    });

    if (existingCreator) {
      return res.status(400).json({ message: '您已经是带货者了' });
    }

    // 创建带货者资料
    const creator = await prisma.contentCreator.create({
      data: {
        userId,
        bio,
        avatar,
        nickname,
        status: 'pending'
      }
    });

    res.status(201).json(creator);
  } catch (error) {
    console.error('申请成为带货者失败:', error);
    res.status(500).json({ message: '申请失败' });
  }
};

// 获取带货者资料
export const getCreatorProfile = async (req: Request, res: Response) => {
  try {
    const creatorId = req.params.id || req.user.id;
    
    const creator = await prisma.contentCreator.findUnique({
      where: { userId: creatorId },
      include: {
        contents: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!creator) {
      return res.status(404).json({ message: '带货者不存在' });
    }

    res.json(creator);
  } catch (error) {
    console.error('获取带货者资料失败:', error);
    res.status(500).json({ message: '获取资料失败' });
  }
};

// 更新带货者资料
export const updateCreatorProfile = async (req: Request, res: Response) => {
  try {
    const { bio, avatar, nickname } = req.body;
    const userId = req.user.id;

    const creator = await prisma.contentCreator.update({
      where: { userId },
      data: { bio, avatar, nickname }
    });

    res.json(creator);
  } catch (error) {
    console.error('更新带货者资料失败:', error);
    res.status(500).json({ message: '更新失败' });
  }
};

// 创建内容
export const createContent = async (req: Request, res: Response) => {
  try {
    const { title, description, type, mediaUrl, textContent, products } = req.body;
    const userId = req.user.id;

    // 检查是否是带货者
    const creator = await prisma.contentCreator.findUnique({
      where: { userId }
    });

    if (!creator) {
      return res.status(403).json({ message: '您还不是带货者' });
    }

    // 上传媒体文件
    let uploadedMediaUrl = mediaUrl;
    if (req.file) {
      uploadedMediaUrl = await uploadToCloudinary(req.file);
    }

    // 创建内容
    const content = await prisma.content.create({
      data: {
        creatorId: creator.id,
        title,
        description,
        type,
        mediaUrl: uploadedMediaUrl,
        textContent,
        products: {
          create: products.map((product: any) => ({
            productId: product.id,
            commissionRate: product.commissionRate
          }))
        }
      },
      include: {
        products: true
      }
    });

    res.status(201).json(content);
  } catch (error) {
    console.error('创建内容失败:', error);
    res.status(500).json({ message: '创建失败' });
  }
};

// 获取带货者内容列表
export const getCreatorContents = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const creator = await prisma.contentCreator.findUnique({
      where: { userId }
    });

    if (!creator) {
      return res.status(403).json({ message: '您还不是带货者' });
    }

    const contents = await prisma.content.findMany({
      where: { creatorId: creator.id },
      include: {
        products: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    res.json(contents);
  } catch (error) {
    console.error('获取内容列表失败:', error);
    res.status(500).json({ message: '获取失败' });
  }
};

// 获取内容详情
export const getContentDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        products: {
          include: {
            product: true
          }
        }
      }
    });

    if (!content) {
      return res.status(404).json({ message: '内容不存在' });
    }

    // 增加浏览量
    await prisma.content.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    res.json(content);
  } catch (error) {
    console.error('获取内容详情失败:', error);
    res.status(500).json({ message: '获取失败' });
  }
};

// 更新内容
export const updateContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, type, mediaUrl, textContent, products } = req.body;
    const userId = req.user.id;

    // 检查内容所有权
    const content = await prisma.content.findUnique({
      where: { id },
      include: { creator: true }
    });

    if (!content || content.creator.userId !== userId) {
      return res.status(403).json({ message: '无权修改此内容' });
    }

    // 上传新的媒体文件
    let uploadedMediaUrl = mediaUrl;
    if (req.file) {
      uploadedMediaUrl = await uploadToCloudinary(req.file);
    }

    // 更新内容
    const updatedContent = await prisma.content.update({
      where: { id },
      data: {
        title,
        description,
        type,
        mediaUrl: uploadedMediaUrl,
        textContent,
        products: {
          deleteMany: {},
          create: products.map((product: any) => ({
            productId: product.id,
            commissionRate: product.commissionRate
          }))
        }
      },
      include: {
        products: true
      }
    });

    res.json(updatedContent);
  } catch (error) {
    console.error('更新内容失败:', error);
    res.status(500).json({ message: '更新失败' });
  }
};

// 删除内容
export const deleteContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查内容所有权
    const content = await prisma.content.findUnique({
      where: { id },
      include: { creator: true }
    });

    if (!content || content.creator.userId !== userId) {
      return res.status(403).json({ message: '无权删除此内容' });
    }

    await prisma.content.delete({
      where: { id }
    });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除内容失败:', error);
    res.status(500).json({ message: '删除失败' });
  }
};

// 获取佣金记录
export const getCreatorCommissions = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const creator = await prisma.contentCreator.findUnique({
      where: { userId }
    });

    if (!creator) {
      return res.status(403).json({ message: '您还不是带货者' });
    }

    const commissions = await prisma.creatorCommission.findMany({
      where: { creatorId: creator.id },
      include: {
        order: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    res.json(commissions);
  } catch (error) {
    console.error('获取佣金记录失败:', error);
    res.status(500).json({ message: '获取失败' });
  }
};

// 带货成交
export const completeCreatorOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const creatorId = req.user.id;

    const order = await prisma.order.update({
      where: {
        id: orderId,
        status: 'completed'
      },
      data: {
        status: 'creator_settled'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // 计算带货收益
    const totalAmount = order.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // 触发分佣
    await triggerReferralCommission({
      event: 'creator_order',
      fromUserId: creatorId,
      relatedId: order.id,
      amount: totalAmount
    });

    res.json({ message: '带货订单结算成功' });
  } catch (error) {
    console.error('带货订单结算失败:', error);
    res.status(500).json({ message: '带货订单结算失败' });
  }
}; 