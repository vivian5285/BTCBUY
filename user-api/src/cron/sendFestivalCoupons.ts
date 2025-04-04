import cron from 'node-cron';
import { sendFestivalCoupons } from '../scripts/sendFestivalCoupons';
import logger from '../utils/logger';

// 每天凌晨1点执行
cron.schedule('0 1 * * *', async () => {
  try {
    logger.info('开始执行节日优惠券发放任务');
    await sendFestivalCoupons();
    logger.info('节日优惠券发放任务完成');
  } catch (error) {
    logger.error('节日优惠券发放任务失败:', error);
  }
});

export default cron; 