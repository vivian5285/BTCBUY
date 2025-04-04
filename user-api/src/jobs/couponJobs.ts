import cron from 'node-cron';
import { checkExpiredCoupons } from '../services/couponService';
import { sendFestivalCoupons } from '../scripts/sendFestivalCoupons';
import logger from '../utils/logger';

/**
 * 启动优惠券相关的定时任务
 */
export function startCouponJobs() {
  // 每天凌晨2点检查过期优惠券
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('开始检查过期优惠券...');
      await checkExpiredCoupons();
      logger.info('过期优惠券检查完成');
    } catch (error) {
      logger.error('检查过期优惠券失败:', error);
    }
  });

  // 每天凌晨1点检查是否需要发放节日优惠券
  cron.schedule('0 1 * * *', async () => {
    try {
      logger.info('开始检查节日优惠券发放...');
      await sendFestivalCoupons();
    } catch (error) {
      logger.error('发放节日优惠券失败:', error);
    }
  });
} 