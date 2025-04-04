import { PrismaClient, Prisma } from '@prisma/client';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

interface CommissionEvent {
  event: 'user_order' | 'merchant_order' | 'creator_order' | 'group_buy';
  fromUserId: string;
  toUserId?: string;
  relatedId: string;
  amount: number;
}

interface Commission {
  fromUserId: string;
  toUserId: string;
  orderId: string;
  level: number;
  amount: number;
  type: 'user_order' | 'merchant_order' | 'creator_order' | 'group_buy';
}

export const triggerReferralCommission = async ({
  event,
  fromUserId,
  toUserId,
  relatedId,
  amount
}: CommissionEvent) => {
  try {
    // 查找用户的推荐关系
    const relation = await prisma.referralRelation.findUnique({
      where: { userId: fromUserId }
    });

    if (!relation) return;

    const commissions: Commission[] = [];

    // 计算一级推荐佣金
    if (relation.parentId) {
      const rate = event === 'user_order' ? 0.10 :
                   event === 'merchant_order' ? 0.05 :
                   event === 'creator_order' ? 0.08 :
                   event === 'group_buy' ? 0.15 : 0;
                   
      commissions.push({
        fromUserId,
        toUserId: relation.parentId,
        orderId: relatedId,
        level: 1,
        amount: Number((amount * rate).toFixed(2)),
        type: event
      });
    }

    // 计算二级推荐佣金(仅用户订单和拼团)
    if (relation.grandParentId && (event === 'user_order' || event === 'group_buy')) {
      commissions.push({
        fromUserId,
        toUserId: relation.grandParentId,
        orderId: relatedId,
        level: 2,
        amount: Number((amount * 0.05).toFixed(2)),
        type: event
      });
    }

    // 使用事务处理佣金创建和余额更新
    if (commissions.length > 0) {
      await prisma.$transaction(async (prisma) => {
        // 批量创建佣金记录
        await prisma.referralCommission.createMany({
          data: commissions.map(commission => ({
            fromUserId: commission.fromUserId,
            toUserId: commission.toUserId,
            orderId: commission.orderId,
            level: commission.level,
            amount: commission.amount,
            type: commission.type
          }))
        });

        // 更新用户余额并创建通知
        for (const commission of commissions) {
          await prisma.user.update({
            where: { id: commission.toUserId },
            data: {
              balance: {
                increment: commission.amount
              }
            }
          });

          // 使用NotificationService创建通知
          await NotificationService.createNotification({
            userId: commission.toUserId,
            type: 'commission',
            title: '推荐佣金到账',
            content: `您收到一笔${commission.amount}元的${
              commission.level === 1 ? '一级' : '二级'
            }推荐佣金`,
          });
        }
      });
    }
  } catch (error) {
    console.error('处理佣金分配失败:', error);
    throw new Error('佣金分配失败，请重试');
  }
}; 