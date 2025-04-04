import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UnifiedNotificationService } from '../services/unifiedNotificationService';

const prisma = new PrismaClient();
const notificationService = UnifiedNotificationService.getInstance();

// 发起拼团
export const createGroupBuy = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { productId, maxMembers = 3, expiresInMinutes = 60 } = req.body;

    // 验证商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 创建拼团
    const groupBuy = await prisma.groupBuy.create({
      data: {
        productId,
        initiatorId: userId,
        maxMembers,
        expiresAt: new Date(Date.now() + expiresInMinutes * 60000),
        currentMembers: 1,
        isSuccess: false,
        participants: {
          create: {
            userId,
          },
        },
      },
      include: {
        product: true,
        initiator: {
          select: {
            id: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json({
      message: 'Group buy created successfully',
      groupBuy,
    });
  } catch (error) {
    console.error('Error creating group buy:', error);
    res.status(500).json({ error: 'Failed to create group buy' });
  }
};

// 发送拼团提醒
const sendGroupBuyReminder = async (groupId: string) => {
  const group = await prisma.groupBuy.findUnique({
    where: { id: groupId },
    include: {
      product: true,
      participants: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!group) return;

  // 计算剩余需要的人数
  const remainingMembers = group.maxMembers - group.currentMembers;

  // 向所有参与者发送提醒
  for (const participant of group.participants) {
    await notificationService.sendSystemNotification(
      participant.user.id,
      '拼团提醒',
      `您参与的商品"${group.product.name}"拼团还差${remainingMembers}人，快邀请好友加入吧！`,
      {
        type: 'GROUP_BUY_REMINDER',
        groupId: group.id,
        productId: group.productId,
      }
    );
  }
};

// 发送拼团成功通知
const sendGroupBuySuccessNotification = async (groupId: string) => {
  const group = await prisma.groupBuy.findUnique({
    where: { id: groupId },
    include: {
      product: true,
      participants: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!group) return;

  // 向所有参与者发送成功通知
  for (const participant of group.participants) {
    await notificationService.sendSystemNotification(
      participant.user.id,
      '拼团成功',
      `恭喜您！商品"${group.product.name}"拼团已成功，请尽快完成支付。`,
      {
        type: 'GROUP_BUY_SUCCESS',
        groupId: group.id,
        productId: group.productId,
      }
    );
  }
};

// 处理拼团失败
const handleFailedGroupBuy = async (groupId: string) => {
  const group = await prisma.groupBuy.findUnique({
    where: { id: groupId },
    include: {
      participants: true
    }
  });

  if (!group) return;

  // 更新拼团状态
  await prisma.groupBuy.update({
    where: { id: groupId },
    data: { status: 'FAILED' }
  });

  // 获取所有参与订单
  const orders = await prisma.order.findMany({
    where: {
      groupBuyId: groupId,
      status: 'PAID'
    }
  });

  // 处理每个订单的退款或发券
  for (const order of orders) {
    if (group.refundStrategy === 'REFUND') {
      // 处理退款
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'REFUNDED',
          refundStatus: 'COMPLETED'
        }
      });

      // 发送退款通知
      await notificationService.sendSystemNotification(
        order.userId,
        '拼团失败退款通知',
        `您的拼团订单${order.id}已退款，金额：${order.amount}元`
      );
    } else {
      // 发放优惠券
      const coupon = await prisma.coupon.create({
        data: {
          userId: order.userId,
          amount: group.couponAmount || order.amount,
          status: 'ACTIVE',
          groupBuyId: groupId,
          orderId: order.id
        }
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'FAILED',
          couponIssued: true,
          couponId: coupon.id
        }
      });

      // 发送优惠券通知
      await notificationService.sendSystemNotification(
        order.userId,
        '拼团失败优惠券通知',
        `您的拼团订单${order.id}已发放${coupon.amount}元优惠券`
      );
    }
  }
};

// 修改joinGroupBuy函数，添加推荐人逻辑
export const joinGroupBuy = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const referrerId = req.query.ref as string; // 从URL参数获取推荐人ID

    const group = await prisma.groupBuy.findUnique({
      where: { id: groupId },
      include: { participants: true }
    });

    if (!group) {
      return res.status(404).json({ message: '拼团不存在' });
    }

    if (group.status !== 'PENDING') {
      return res.status(400).json({ message: '该拼团已结束' });
    }

    if (group.currentMembers >= group.requiredMembers) {
      return res.status(400).json({ message: '拼团已满' });
    }

    // 创建订单，包含推荐人信息
    const order = await prisma.order.create({
      data: {
        userId,
        groupBuyId: groupId,
        amount: group.groupPrice,
        status: 'PENDING',
        referrerId: referrerId || null
      }
    });

    // 更新拼团参与人数
    await prisma.groupBuy.update({
      where: { id: groupId },
      data: {
        currentMembers: group.currentMembers + 1
      }
    });

    // 添加参与者记录
    await prisma.groupParticipant.create({
      data: {
        groupBuyId: groupId,
        userId,
        orderId: order.id
      }
    });

    // 如果拼团成功，处理推荐人佣金
    if (group.currentMembers + 1 === group.requiredMembers) {
      await handleGroupBuySuccess(groupId);
    }

    res.json({ message: '加入拼团成功', orderId: order.id });
  } catch (error) {
    console.error('加入拼团失败:', error);
    res.status(500).json({ message: '加入拼团失败' });
  }
};

// 处理拼团成功，结算推荐人佣金
const handleGroupBuySuccess = async (groupId: string) => {
  const group = await prisma.groupBuy.findUnique({
    where: { id: groupId },
    include: {
      participants: {
        include: {
          order: true
        }
      }
    }
  });

  if (!group) return;

  // 更新拼团状态
  await prisma.groupBuy.update({
    where: { id: groupId },
    data: { status: 'SUCCESS' }
  });

  // 处理每个参与者的推荐人佣金
  for (const participant of group.participants) {
    if (participant.order?.referrerId && !participant.order.commissionPaid) {
      // 计算佣金（示例：订单金额的5%）
      const commissionAmount = participant.order.amount * 0.05;

      // 创建佣金记录
      await prisma.referralCommission.create({
        data: {
          fromUserId: participant.userId,
          toUserId: participant.order.referrerId,
          orderId: participant.order.id,
          level: 1,
          amount: commissionAmount,
          type: 'group_buy'
        }
      });

      // 更新订单佣金状态
      await prisma.order.update({
        where: { id: participant.order.id },
        data: { commissionPaid: true }
      });

      // 发送佣金通知
      await notificationService.sendSystemNotification(
        participant.order.referrerId,
        '拼团推荐佣金通知',
        `您推荐的用户参与拼团成功，获得佣金${commissionAmount}元`
      );
    }
  }
};

// 获取我的拼团列表
export const getMyGroupBuys = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type = 'all' } = req.query; // all, initiated, joined

    let where: any = {};
    if (type === 'initiated') {
      where = { initiatorId: userId };
    } else if (type === 'joined') {
      where = {
        participants: {
          some: {
            userId,
          },
        },
      };
    } else {
      where = {
        OR: [
          { initiatorId: userId },
          { participants: { some: { userId } } },
        ],
      };
    }

    const groupBuys = await prisma.groupBuy.findMany({
      where,
      include: {
        product: true,
        initiator: {
          select: {
            id: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(groupBuys);
  } catch (error) {
    console.error('Error fetching group buys:', error);
    res.status(500).json({ error: 'Failed to fetch group buys' });
  }
};

// 获取拼团详情
export const getGroupBuyDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const groupBuy = await prisma.groupBuy.findUnique({
      where: { id },
      include: {
        product: true,
        initiator: {
          select: {
            id: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!groupBuy) {
      return res.status(404).json({ error: 'Group buy not found' });
    }

    res.json(groupBuy);
  } catch (error) {
    console.error('Error fetching group buy detail:', error);
    res.status(500).json({ error: 'Failed to fetch group buy detail' });
  }
};

// 设置拼团提醒
export const setGroupBuyReminder = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { groupId } = req.params;

    // 创建提醒记录
    await prisma.groupBuyReminder.create({
      data: {
        userId,
        groupId,
      },
    });

    res.json({ message: '提醒设置成功' });
  } catch (error) {
    console.error('Error setting reminder:', error);
    res.status(500).json({ error: 'Failed to set reminder' });
  }
}; 