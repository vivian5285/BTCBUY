import { Request, Response } from 'express';
import { GroupService } from '../services/groupService';

interface AuthRequest extends Request {
  user: {
    id: string;
    iat: number;
    exp: number;
  };
}

export const startGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { productId, groupSize, price } = req.body;

    if (!productId || !groupSize || !price) {
      return res.status(400).json({ message: '缺少必要参数' });
    }

    const group = await GroupService.createGroup({
      userId,
      productId,
      groupSize,
      price,
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('发起拼团失败:', error);
    res.status(500).json({ message: '发起拼团失败' });
  }
};

export const joinGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.id;

    const result = await GroupService.joinGroup(groupId, userId);
    res.json(result);
  } catch (error) {
    console.error('加入拼团失败:', error);
    res.status(500).json({ message: '加入拼团失败' });
  }
};

export const myGroups = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const groups = await GroupService.getUserGroups(userId);
    res.json(groups);
  } catch (error) {
    console.error('获取拼团列表失败:', error);
    res.status(500).json({ message: '获取拼团列表失败' });
  }
}; 