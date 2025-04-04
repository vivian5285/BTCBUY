import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { handleGroupBuyExpiration } from '../services/groupBuyService';

const prisma = new PrismaClient();

// 每5分钟检查一次过期拼团
export function startGroupStatusCheck() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('开始检查过期拼团...');
      
      // 查找所有过期但未处理的拼团
      const expiredGroupBuys = await prisma.groupBuy.findMany({
        where: {
          expiresAt: { lt: new Date() },
          status: 'PENDING',
        },
      });
      
      console.log(`找到 ${expiredGroupBuys.length} 个过期拼团`);
      
      // 处理每个过期拼团
      for (const groupBuy of expiredGroupBuys) {
        await handleGroupBuyExpiration(groupBuy.id);
      }
      
      console.log('过期拼团检查完成');
    } catch (error) {
      console.error('检查过期拼团时出错:', error);
    }
  });
} 