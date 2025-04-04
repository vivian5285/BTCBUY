import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { io } from '../socket';

export const createFlashSale = async (req: Request, res: Response) => {
  try {
    const { liveId, productId, originalPrice, salePrice, startTime, endTime } = req.body;
    const userId = req.user?.id;

    const live = await prisma.live.findUnique({
      where: { id: liveId },
    });

    if (!live || live.userId !== userId) {
      return res.status(403).json({ message: '无权创建秒杀活动' });
    }

    const flashSale = await prisma.flashSale.create({
      data: {
        liveId,
        productId,
        originalPrice,
        salePrice,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: 'pending',
      },
    });

    // 通知直播间所有用户
    io.to(`live:${liveId}`).emit('flash_sale_created', flashSale);

    res.json(flashSale);
  } catch (error) {
    res.status(500).json({ message: '创建秒杀活动失败' });
  }
};

export const getFlashSales = async (req: Request, res: Response) => {
  try {
    const { liveId } = req.params;

    const flashSales = await prisma.flashSale.findMany({
      where: { liveId },
      include: {
        product: true,
      },
    });

    res.json(flashSales);
  } catch (error) {
    res.status(500).json({ message: '获取秒杀活动失败' });
  }
};

export const updateFlashSaleStatus = async (req: Request, res: Response) => {
  try {
    const { flashSaleId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    const flashSale = await prisma.flashSale.findUnique({
      where: { id: flashSaleId },
      include: { live: true },
    });

    if (!flashSale || flashSale.live.userId !== userId) {
      return res.status(403).json({ message: '无权更新秒杀活动' });
    }

    const updatedFlashSale = await prisma.flashSale.update({
      where: { id: flashSaleId },
      data: { status },
    });

    // 通知直播间所有用户
    io.to(`live:${flashSale.liveId}`).emit('flash_sale_updated', updatedFlashSale);

    res.json(updatedFlashSale);
  } catch (error) {
    res.status(500).json({ message: '更新秒杀活动失败' });
  }
}; 