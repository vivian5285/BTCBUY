import { triggerReferralCommission } from '../services/commissionService';

// 确认收货
export const confirmDelivery = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.update({
      where: {
        id: orderId,
        userId,
        status: 'shipped'
      },
      data: {
        status: 'completed'
      }
    });

    // 触发分佣
    await triggerReferralCommission({
      event: 'user_order',
      fromUserId: userId,
      relatedId: order.id,
      amount: order.totalAmount
    });

    res.json({ message: '确认收货成功' });
  } catch (error) {
    console.error('确认收货失败:', error);
    res.status(500).json({ message: '确认收货失败' });
  }
}; 