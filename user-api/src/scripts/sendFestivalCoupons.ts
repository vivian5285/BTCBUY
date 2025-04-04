import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * 发送节日优惠券
 */
export const sendFestivalCoupons = async () => {
  try {
    logger.info('开始发放节日优惠券');
    
    // 获取所有活跃用户
    const users = await prisma.user.findMany({
      where: {
        status: 'active'
      },
      select: {
        id: true,
        username: true
      }
    });
    
    logger.info(`找到 ${users.length} 个活跃用户`);
    
    // 批量创建优惠券
    const coupons = [];
    const notifications = [];
    
    for (const user of users) {
      // 创建优惠券
      coupons.push({
        userId: user.id,
        amount: 20, // 节日优惠券金额
        validFrom: new Date(),
        validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天有效期
        reason: '节日优惠券',
        status: 'active'
      });
      
      // 创建通知
      notifications.push({
        userId: user.id,
        type: 'coupon',
        message: '您收到一张节日优惠券，价值 ¥20',
        data: { couponId: null } // 将在创建优惠券后更新
      });
    }
    
    // 批量创建优惠券
    const createdCoupons = await prisma.coupon.createMany({
      data: coupons
    });
    
    logger.info(`成功创建 ${createdCoupons.count} 张优惠券`);
    
    // 获取刚创建的优惠券
    const newCoupons = await prisma.coupon.findMany({
      where: {
        reason: '节日优惠券',
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // 最近5分钟创建的
        }
      },
      select: {
        id: true,
        userId: true
      }
    });
    
    // 更新通知中的优惠券ID
    for (const coupon of newCoupons) {
      const notification = notifications.find(n => n.userId === coupon.userId);
      if (notification) {
        notification.data = { couponId: coupon.id };
      }
    }
    
    // 批量创建通知
    const createdNotifications = await prisma.notification.createMany({
      data: notifications
    });
    
    logger.info(`成功创建 ${createdNotifications.count} 条通知`);
    
    logger.info('节日优惠券发放完成');
  } catch (error) {
    logger.error('发放节日优惠券失败:', error);
    throw error;
  }
};

// 节日配置
interface FestivalConfig {
  name: string;
  date: string;
  amount: number;
  reason: string;
  validDays: number;
}

const festivals: FestivalConfig[] = [
  {
    name: '春节',
    date: '2024-02-10',
    amount: 8.8,
    reason: '春节限时红包 🎉',
    validDays: 15
  },
  {
    name: '元宵节',
    date: '2024-02-24',
    amount: 5.2,
    reason: '元宵节限时红包 🏮',
    validDays: 7
  },
  {
    name: '中秋节',
    date: '2024-09-17',
    amount: 8.8,
    reason: '中秋节限时红包 🥮',
    validDays: 15
  },
  {
    name: '国庆节',
    date: '2024-10-01',
    amount: 10,
    reason: '国庆节限时红包 🎊',
    validDays: 7
  }
];

// 如果直接运行此脚本
if (require.main === module) {
  sendFestivalCoupons()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
} 