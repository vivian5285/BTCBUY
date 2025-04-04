import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { createNotification } from './notification';

// 生成推荐链接
export const generateReferralLink = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const referralLink = `${process.env.BASE_URL}/signup?ref=${user.inviteCode}`;
    res.json({ referralLink });
  } catch (error) {
    console.error('生成推荐链接失败:', error);
    res.status(500).json({ message: '生成推荐链接失败' });
  }
};

// 绑定推荐关系
export const bindReferral = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    // 检查是否已经绑定过推荐人
    const existingRelation = await prisma.referralRelation.findUnique({
      where: { userId }
    });

    if (existingRelation) {
      return res.status(400).json({ message: '您已经绑定过推荐人' });
    }

    // 查找推荐人
    const referrer = await prisma.user.findUnique({
      where: { inviteCode: code }
    });

    if (!referrer) {
      return res.status(404).json({ message: '推荐码无效' });
    }

    // 查找推荐人的推荐人(二级推荐)
    const grandParent = await prisma.referralRelation.findUnique({
      where: { userId: referrer.id }
    });

    // 创建推荐关系
    const relation = await prisma.referralRelation.create({
      data: {
        userId,
        parentId: referrer.id,
        grandParentId: grandParent?.parentId
      }
    });

    // 创建通知
    await createNotification(
      userId,
      'referral',
      `您已成功绑定推荐人：${referrer.email}`
    );

    // 给推荐人发送通知
    await createNotification(
      referrer.id,
      'referral',
      `您有新用户通过您的推荐链接注册：${req.user.email}`
    );

    res.json({ message: '推荐关系绑定成功', relation });
  } catch (error) {
    console.error('绑定推荐关系失败:', error);
    res.status(500).json({ message: '绑定推荐关系失败' });
  }
};

// 获取推荐信息
export const getReferralInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    // 获取推荐关系
    const relation = await prisma.referralRelation.findUnique({
      where: { userId },
      include: {
        parent: {
          select: {
            id: true,
            email: true
          }
        },
        grandParent: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    // 获取佣金统计
    const commissions = await prisma.referralCommission.findMany({
      where: { toUserId: userId },
      select: {
        amount: true,
        createdAt: true
      }
    });

    const totalCommission = commissions.reduce((sum, commission) => sum + commission.amount, 0);
    
    // 计算本月佣金
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyCommission = commissions
      .filter(commission => new Date(commission.createdAt) >= firstDayOfMonth)
      .reduce((sum, commission) => sum + commission.amount, 0);

    // 获取推荐用户数
    const referralCount = await prisma.referralRelation.count({
      where: { parentId: userId }
    });

    res.json({
      relation,
      stats: {
        totalCommission,
        monthlyCommission,
        referralCount
      }
    });
  } catch (error) {
    console.error('获取推荐信息失败:', error);
    res.status(500).json({ message: '获取推荐信息失败' });
  }
}; 