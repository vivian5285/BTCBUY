import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateInviteCode } from '../utils/invite';

const prisma = new PrismaClient();

// 扩展 Request 类型以包含用户信息
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    iat: number;
    exp: number;
  };
}

// 生成邀请码
export const generateInviteCodeController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const inviteCode = generateInviteCode();
    
    await prisma.user.update({
      where: { id: userId },
      data: { inviteCode }
    });

    res.json({ inviteCode });
  } catch (error) {
    res.status(500).json({ error: '生成邀请码失败' });
  }
};

// 使用邀请码注册
export const registerWithInviteCodeController = async (req: Request, res: Response) => {
  try {
    const { email, password, inviteCode } = req.body;

    // 验证邀请码
    const inviter = await prisma.user.findUnique({
      where: { inviteCode }
    });

    if (!inviter) {
      return res.status(400).json({ error: '无效的邀请码' });
    }

    // 创建新用户
    const user = await prisma.user.create({
      data: {
        email,
        password, // 注意：实际应用中应该对密码进行加密
        invitedById: inviter.id
      }
    });

    res.status(201).json({ message: '注册成功' });
  } catch (error) {
    res.status(500).json({ error: '注册失败' });
  }
};

// 获取我的邀请列表
export const getMyInvitesController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const invitedUsers = await prisma.user.findMany({
      where: { invitedById: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        orders: {
          select: {
            amount: true
          }
        }
      }
    });

    res.json(invitedUsers);
  } catch (error) {
    res.status(500).json({ error: '获取邀请列表失败' });
  }
};

// 获取我的佣金列表
export const getMyCommissionsController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const commissions = await prisma.commission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(commissions);
  } catch (error) {
    res.status(500).json({ error: '获取佣金列表失败' });
  }
}; 