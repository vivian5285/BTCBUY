import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

/**
 * 处理拼团过期
 * 检查拼团是否到期但未成功，如果是则标记为失败并处理退款或发放优惠券
 */
export const handleGroupBuyExpiration = async (groupBuyId: string) => {
  try {
    // 查找拼团信息
    const groupBuy = await prisma.groupBuy.findUnique({
      where: { id: groupBuyId },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        product: true,
      },
    });

    if (!groupBuy) {
      console.error(`拼团 ${groupBuyId} 不存在`);
      return;
    }

    // 检查拼团是否已经成功或失败
    if (groupBuy.status !== 'PENDING') {
      console.log(`拼团 ${groupBuyId} 状态为 ${groupBuy.status}，无需处理`);
      return;
    }

    // 检查拼团是否过期
    if (groupBuy.expiresAt > new Date()) {
      console.log(`拼团 ${groupBuyId} 尚未过期`);
      return;
    }

    // 标记拼团为失败
    await prisma.groupBuy.update({
      where: { id: groupBuyId },
      data: { status: 'FAILED' },
    });

    // 处理所有参与者的订单
    for (const participant of groupBuy.participants) {
      // 查找用户的订单
      const order = await prisma.order.findFirst({
        where: {
          userId: participant.userId,
          groupBuyId: groupBuyId,
          status: 'PENDING',
        },
      });

      if (order) {
        // 更新订单状态为失败
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'FAILED' },
        });

        // 发放优惠券代替退款
        const coupon = await prisma.coupon.create({
          data: {
            userId: participant.userId,
            amount: order.amount,
            status: 'ACTIVE',
            groupBuyId: groupBuyId,
            orderId: order.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
          },
        });

        // 更新订单关联的优惠券
        await prisma.order.update({
          where: { id: order.id },
          data: {
            couponId: coupon.id,
            couponIssued: true,
          },
        });

        // 发送通知
        await NotificationService.createNotification({
          userId: participant.userId,
          type: 'group_failed',
          title: '拼团失败通知',
          content: `您参与的拼团失败，已补偿优惠券 ¥${order.amount}`,
        });
      }
    }

    console.log(`拼团 ${groupBuyId} 处理完成`);
  } catch (error) {
    console.error(`处理拼团 ${groupBuyId} 失败:`, error);
  }
}; 