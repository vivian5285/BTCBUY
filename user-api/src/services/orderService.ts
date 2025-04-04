import { PrismaClient } from '@prisma/client';
import { triggerReferralCommission } from './commissionService';
import { handleOrderCoupon } from './couponService';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * 处理订单完成后的逻辑
 * @param order 订单信息
 */
export const handleOrderCompletion = async (order: any) => {
  try {
    logger.info(`处理订单完成逻辑: ${order.id}`);
    
    // 处理佣金
    await handleOrderCommission(order);
    
    // 处理满减送券
    await handleOrderCoupon(order);
    
    logger.info(`订单 ${order.id} 完成处理成功`);
  } catch (error) {
    logger.error(`订单 ${order.id} 完成处理失败:`, error);
    throw error;
  }
};

/**
 * 处理订单佣金
 * @param order 订单信息
 */
async function handleOrderCommission(order: any) {
  try {
    const { userId, totalAmount, id: orderId } = order;
    
    // 触发推荐佣金
    await triggerReferralCommission({
      event: 'user_order',
      fromUserId: userId,
      relatedId: orderId,
      amount: totalAmount
    });
    
    logger.info(`订单 ${orderId} 佣金处理成功`);
  } catch (error) {
    logger.error(`订单 ${order.id} 佣金处理失败:`, error);
    throw error;
  }
}

/**
 * 处理满减送券
 * @param order 订单信息
 */
async function handleOrderCoupon(order: any) {
  try {
    const { userId, totalAmount, merchantId } = order;
    
    // 满100送10元券
    if (totalAmount >= 100) {
      const coupon = await prisma.coupon.create({
        data: {
          userId: userId,
          merchantId: merchantId,
          amount: 10,
          validFrom: new Date(),
          validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天有效期
          reason: '满100元赠券',
          status: 'active'
        }
      });

      // 创建通知
      await prisma.notification.create({
        data: {
          userId: userId,
          type: 'coupon',
          title: '获得优惠券',
          content: '感谢您消费满100元，已赠送 ¥10 优惠券',
          data: { couponId: coupon.id }
        }
      });

      logger.info(`用户 ${userId} 获得满100元赠券`);
    }
    
    // 满200送25元券
    if (totalAmount >= 200) {
      const coupon = await prisma.coupon.create({
        data: {
          userId: userId,
          merchantId: merchantId,
          amount: 25,
          validFrom: new Date(),
          validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天有效期
          reason: '满200元赠券',
          status: 'active'
        }
      });

      // 创建通知
      await prisma.notification.create({
        data: {
          userId: userId,
          type: 'coupon',
          title: '获得优惠券',
          content: '感谢您消费满200元，已赠送 ¥25 优惠券',
          data: { couponId: coupon.id }
        }
      });

      logger.info(`用户 ${userId} 获得满200元赠券`);
    }
    
    logger.info(`订单 ${order.id} 满减送券处理成功`);
  } catch (error) {
    logger.error(`订单 ${order.id} 满减送券处理失败:`, error);
    throw error;
  }
} 