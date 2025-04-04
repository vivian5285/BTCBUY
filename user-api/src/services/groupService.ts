import { PrismaClient } from '@prisma/client';
import { Group, CreateGroupParams } from '../types/group';
import { generateShareCode } from '../utils/shareCode';
import { triggerReferralCommission } from './commissionService';
import { createNotification } from './notificationService';

const prisma = new PrismaClient();

export class GroupService {
  static async createGroup(params: CreateGroupParams): Promise<Group> {
    const { userId, productId, groupSize, price, expiresInMinutes = 24 * 60 } = params;
    const shareCode = generateShareCode();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60000);

    const group = await prisma.group.create({
      data: {
        userId,
        productId,
        groupSize,
        price,
        shareCode,
        expiresAt,
        members: {
          create: {
            userId,
          },
        },
      },
      include: {
        members: true,
      },
    });

    return group;
  }

  static async joinGroup(groupId: string, userId: string): Promise<Group> {
    // 检查拼团是否存在且未过期
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      include: {
        members: true,
      },
    });

    if (!group) {
      throw new Error('拼团不存在或已过期');
    }

    // 检查用户是否已参与
    if (group.members.some(member => member.userId === userId)) {
      throw new Error('您已参与此拼团');
    }

    // 检查是否已满员
    if (group.members.length >= group.groupSize) {
      throw new Error('拼团已满员');
    }

    // 添加新成员
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          create: {
            userId,
          },
        },
      },
      include: {
        members: true,
      },
    });

    // 检查是否达到拼团人数
    if (updatedGroup.members.length === updatedGroup.groupSize) {
      await this.handleSuccessfulGroup(updatedGroup);
    }

    return updatedGroup;
  }

  static async handleSuccessfulGroup(group: Group): Promise<void> {
    // 更新拼团状态为成功
    await prisma.group.update({
      where: { id: group.id },
      data: { status: 'success' },
    });

    // 为所有参与者创建订单并处理返佣
    for (const member of group.members) {
      // 创建订单
      const order = await prisma.order.create({
        data: {
          userId: member.userId,
          productId: group.productId,
          quantity: 1,
          amount: group.price,
          status: 'pending',
          groupId: group.id,
        },
      });

      // 减少库存
      await prisma.product.update({
        where: { id: group.productId },
        data: { stock: { decrement: 1 } },
      });

      // 处理推荐返佣
      const referral = await prisma.referralRelation.findFirst({
        where: { userId: member.userId },
        orderBy: { createdAt: 'desc' },
      });

      if (referral) {
        await triggerReferralCommission({
          event: 'group_buy',
          fromUserId: member.userId,
          toUserId: referral.referrerId,
          relatedId: group.id,
          amount: order.amount,
        });
      }
    }
  }

  static async getUserGroups(userId: string): Promise<Group[]> {
    return prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async getGroupByShareCode(shareCode: string): Promise<Group | null> {
    return prisma.group.findUnique({
      where: { shareCode },
      include: {
        members: true,
      },
    });
  }

  static async handleExpiredGroups(): Promise<void> {
    const expiredGroups = await prisma.group.findMany({
      where: {
        status: 'pending',
        expiresAt: { lt: new Date() },
        isHandled: false,
      },
      include: {
        members: true,
        orders: true,
      },
    });

    for (const group of expiredGroups) {
      // 更新拼团状态为失败
      await prisma.group.update({
        where: { id: group.id },
        data: { 
          status: 'failed',
          isHandled: true,
        },
      });

      // 处理所有未完成的订单
      const pendingOrders = group.orders.filter(order => order.status === 'pending');
      for (const order of pendingOrders) {
        // 更新订单状态为失败
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'failed' },
        });

        // 发放优惠券代替退款
        await prisma.coupon.create({
          data: {
            userId: order.userId,
            amount: order.amount,
            status: 'active',
            reason: '拼团失败补偿',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
          },
        });

        // 发送通知
        await createNotification({
          userId: order.userId,
          type: 'group_failed',
          title: '拼团失败通知',
          content: `您参与的拼团失败，已补偿优惠券 ¥${order.amount}`,
        });
      }
    }
  }
} 