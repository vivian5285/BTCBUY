import { PrismaClient } from '@prisma/client';
import { Coupon, CouponUsage } from '../models';
import { cacheService } from './cache';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * 查找用户可用的优惠券
 * @param userId 用户ID
 * @param amount 订单金额，用于筛选可用优惠券
 * @returns 可用的优惠券列表
 */
export const findAvailableCoupons = async (userId: string, amount: number) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: {
        userId,
        status: 'active',
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: 'asc', // 优先使用最早创建的优惠券
      },
    });

    return coupons;
  } catch (error) {
    logger.error('查找可用优惠券失败:', error);
    throw new Error('查找可用优惠券失败');
  }
};

/**
 * 使用优惠券
 * @param couponId 优惠券ID
 * @param orderId 订单ID
 * @param amount 订单金额
 * @returns 更新后的优惠券
 */
export const useCoupon = async (couponId: string, orderId: string, amount: number) => {
  try {
    // 更新优惠券状态
    const coupon = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        status: 'used',
        orderId
      },
    });

    // 清除用户优惠券缓存
    await cacheService.del(`user:${coupon.userId}:coupons`);

    return coupon;
  } catch (error) {
    logger.error('使用优惠券失败:', error);
    throw new Error('使用优惠券失败');
  }
};

/**
 * 检查并更新过期优惠券
 */
export const checkExpiredCoupons = async () => {
  try {
    const now = new Date();
    const expiredCoupons = await prisma.coupon.findMany({
      where: {
        status: 'active',
        expiresAt: { lt: now }
      }
    });

    if (expiredCoupons.length > 0) {
      await prisma.coupon.updateMany({
        where: {
          id: { in: expiredCoupons.map(c => c.id) }
        },
        data: {
          status: 'expired'
        }
      });

      // 清除相关用户的优惠券缓存
      const userIds = [...new Set(expiredCoupons.map(c => c.userId))];
      await Promise.all(
        userIds.map(userId => 
          cacheService.del(`user:${userId}:coupons`)
        )
      );
    }

    return expiredCoupons.length;
  } catch (error) {
    logger.error('检查过期优惠券失败:', error);
    throw new Error('检查过期优惠券失败');
  }
};

/**
 * 在创建订单时自动应用优惠券
 * @param userId 用户ID
 * @param amount 订单金额
 * @returns 应用的优惠券和折扣后的金额
 */
export const applyCouponToOrder = async (userId: string, amount: number) => {
  try {
    // 查找可用优惠券
    const coupons = await findAvailableCoupons(userId, amount);
    
    if (coupons.length === 0) {
      return { coupon: null, discountedAmount: amount };
    }
    
    // 使用第一张可用优惠券
    const coupon = coupons[0];
    const discountedAmount = Math.max(0, amount - coupon.amount);
    
    return { coupon, discountedAmount };
  } catch (error) {
    logger.error('应用优惠券失败:', error);
    throw new Error('应用优惠券失败');
  }
};

/**
 * 获取优惠券使用统计
 */
export const getCouponStatistics = async (merchantId?: string) => {
  try {
    const cacheKey = merchantId ? 
      `merchant:${merchantId}:coupon:stats` : 
      'coupon:stats:global';
    
    // 尝试从缓存获取
    const cachedStats = await cacheService.get(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }

    // 构建查询条件
    const query = merchantId ? { merchantId } : {};

    // 获取统计数据
    const [
      totalCoupons,
      usedCoupons,
      expiredCoupons,
      activeCoupons
    ] = await Promise.all([
      // 总优惠券数量
      prisma.coupon.count({ where: query }),
      // 已使用优惠券数量
      prisma.coupon.count({ 
        where: { ...query, status: 'used' } 
      }),
      // 已过期优惠券数量
      prisma.coupon.count({ 
        where: { ...query, status: 'expired' } 
      }),
      // 有效优惠券数量
      prisma.coupon.count({ 
        where: { ...query, status: 'active' } 
      })
    ]);

    const stats = {
      totalCoupons,
      usedCoupons,
      expiredCoupons,
      activeCoupons
    };

    // 更新缓存
    await cacheService.set(cacheKey, stats, 3600); // 缓存1小时

    return stats;
  } catch (error) {
    logger.error('获取优惠券统计失败:', error);
    throw new Error('获取优惠券统计失败');
  }
};

/**
 * 处理订单满减送券
 * @param order 订单信息
 */
export const handleOrderCoupon = async (order: any) => {
  try {
    const { userId, totalAmount } = order;
    
    // 满100送10元券
    if (totalAmount >= 100) {
      const coupon = await prisma.coupon.create({
        data: {
          userId,
          amount: 10,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天有效期
          status: 'active'
        }
      });

      // 创建通知
      await prisma.notification.create({
        data: {
          userId,
          type: 'coupon',
          message: '感谢您消费满100元，已赠送 ¥10 优惠券',
          data: { couponId: coupon.id }
        }
      });

      logger.info(`用户 ${userId} 获得满100元赠券`);
    }
    
    // 满200送25元券
    if (totalAmount >= 200) {
      const coupon = await prisma.coupon.create({
        data: {
          userId,
          amount: 25,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天有效期
          status: 'active'
        }
      });

      // 创建通知
      await prisma.notification.create({
        data: {
          userId,
          type: 'coupon',
          message: '感谢您消费满200元，已赠送 ¥25 优惠券',
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
};

/**
 * 应用优惠券到订单
 * @param orderId 订单ID
 * @param couponId 优惠券ID
 * @returns 应用结果
 */
export const applyCouponToOrder = async (orderId: string, couponId: string) => {
  try {
    // 获取订单
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      throw new Error('订单不存在');
    }
    
    // 获取优惠券
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId }
    });
    
    if (!coupon) {
      throw new Error('优惠券不存在');
    }
    
    // 检查优惠券是否属于当前用户
    if (coupon.userId !== order.userId) {
      throw new Error('优惠券不属于当前用户');
    }
    
    // 检查优惠券是否有效
    if (coupon.status !== 'active') {
      throw new Error('优惠券已使用或已过期');
    }
    
    // 检查优惠券是否过期
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTo) {
      throw new Error('优惠券不在有效期内');
    }
    
    // 计算优惠后金额
    const discountedAmount = order.totalAmount - coupon.amount;
    
    // 更新订单金额
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        totalAmount: discountedAmount,
        couponId: couponId
      }
    });
    
    // 更新优惠券状态
    await prisma.coupon.update({
      where: { id: couponId },
      data: { status: 'used' }
    });
    
    logger.info(`优惠券 ${couponId} 已应用到订单 ${orderId}`);
    
    return {
      success: true,
      originalAmount: order.totalAmount,
      discountedAmount,
      discount: coupon.amount
    };
  } catch (error) {
    logger.error(`应用优惠券失败:`, error);
    throw error;
  }
}; 