import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 扩展 Request 类型以包含用户角色
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    iat: number;
    exp: number;
  };
}

// 创建物流记录
export const createLogistics = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, shippingCompany, trackingNumber, estimatedTime, currentLocation } = req.body;

    // 验证订单是否存在
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    // 验证用户权限（只有商家可以创建物流记录）
    if (req.user?.role !== 'merchant') {
      return res.status(403).json({ message: '无权创建物流记录' });
    }

    const logistics = await prisma.orderLogistics.create({
      data: {
        orderId,
        shippingCompany,
        trackingNumber,
        status: 'shipped',
        estimatedTime,
        currentLocation
      },
      include: {
        order: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    // 更新订单状态为已发货
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'shipped' }
    });

    res.json(logistics);
  } catch (error) {
    console.error('创建物流记录失败:', error);
    res.status(500).json({ message: '创建物流记录失败' });
  }
};

// 更新物流状态
export const updateLogisticsStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { logisticsId, status, currentLocation } = req.body;

    const logistics = await prisma.orderLogistics.findUnique({
      where: { id: logisticsId },
      include: {
        order: true
      }
    });

    if (!logistics) {
      return res.status(404).json({ message: '物流记录不存在' });
    }

    // 验证用户权限（只有商家可以更新物流状态）
    if (req.user?.role !== 'merchant') {
      return res.status(403).json({ message: '无权更新物流状态' });
    }

    const updatedLogistics = await prisma.orderLogistics.update({
      where: { id: logisticsId },
      data: {
        status,
        currentLocation
      },
      include: {
        order: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    // 如果物流状态为已送达，更新订单状态
    if (status === 'delivered') {
      await prisma.order.update({
        where: { id: logistics.orderId },
        data: { status: 'completed' }
      });
    }

    res.json(updatedLogistics);
  } catch (error) {
    console.error('更新物流状态失败:', error);
    res.status(500).json({ message: '更新物流状态失败' });
  }
};

// 获取物流信息
export const getLogistics = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;

    const logistics = await prisma.orderLogistics.findFirst({
      where: { orderId },
      include: {
        order: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    if (!logistics) {
      return res.status(404).json({ message: '物流记录不存在' });
    }

    // 验证用户权限（只有订单所属用户或商家可以查看物流信息）
    if (req.user?.id !== logistics.order.userId && req.user?.role !== 'merchant') {
      return res.status(403).json({ message: '无权查看物流信息' });
    }

    res.json(logistics);
  } catch (error) {
    console.error('获取物流信息失败:', error);
    res.status(500).json({ message: '获取物流信息失败' });
  }
};

// 获取物流公司列表
export const getShippingCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await prisma.shippingCompany.findMany({
      where: {
        status: 'active'
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(companies);
  } catch (error) {
    console.error('获取物流公司列表失败:', error);
    res.status(500).json({ message: '获取物流公司列表失败' });
  }
};

// 添加物流跟踪记录
export const addTrackingRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { logisticsId, location, status, description } = req.body;

    const logistics = await prisma.orderLogistics.findUnique({
      where: { id: logisticsId },
      include: {
        order: true
      }
    });

    if (!logistics) {
      return res.status(404).json({ message: '物流记录不存在' });
    }

    // 验证用户权限（只有商家可以添加跟踪记录）
    if (req.user?.role !== 'merchant') {
      return res.status(403).json({ message: '无权添加跟踪记录' });
    }

    const trackingRecord = await prisma.trackingRecord.create({
      data: {
        logisticsId,
        location,
        status,
        description
      }
    });

    // 更新物流状态和当前位置
    await prisma.orderLogistics.update({
      where: { id: logisticsId },
      data: {
        status,
        currentLocation: location
      }
    });

    // 创建通知
    await prisma.logisticsNotification.create({
      data: {
        logisticsId,
        userId: logistics.order.userId,
        type: 'status_update',
        message: `物流状态更新：${description}`
      }
    });

    res.json(trackingRecord);
  } catch (error) {
    console.error('添加物流跟踪记录失败:', error);
    res.status(500).json({ message: '添加物流跟踪记录失败' });
  }
};

// 获取物流跟踪记录
export const getTrackingRecords = async (req: AuthRequest, res: Response) => {
  try {
    const { logisticsId } = req.params;

    const logistics = await prisma.orderLogistics.findUnique({
      where: { id: logisticsId },
      include: {
        order: true
      }
    });

    if (!logistics) {
      return res.status(404).json({ message: '物流记录不存在' });
    }

    // 验证用户权限（只有订单所属用户或商家可以查看跟踪记录）
    if (req.user?.id !== logistics.order.userId && req.user?.role !== 'merchant') {
      return res.status(403).json({ message: '无权查看跟踪记录' });
    }

    const trackingRecords = await prisma.trackingRecord.findMany({
      where: { logisticsId },
      orderBy: { timestamp: 'desc' }
    });

    res.json(trackingRecords);
  } catch (error) {
    console.error('获取物流跟踪记录失败:', error);
    res.status(500).json({ message: '获取物流跟踪记录失败' });
  }
};

// 计算物流费用
export const calculateShippingFee = async (req: Request, res: Response) => {
  try {
    const { orderId, shippingCompany } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    // 计算基础运费（根据订单总重量和距离）
    const totalWeight = order.items.reduce((sum: number, item: { weight?: number }) => 
      sum + (item.weight || 0), 0);
    const baseFee = totalWeight * 0.1; // 每公斤0.1元

    // 计算保价费（根据订单金额）
    const orderAmount = order.items.reduce((sum: number, item: { price: number; quantity: number }) => 
      sum + item.price * item.quantity, 0);
    const insuranceFee = orderAmount * 0.01; // 保价费为订单金额的1%

    // 计算总费用
    const totalFee = baseFee + insuranceFee;

    res.json({
      shippingFee: baseFee,
      insuranceFee,
      totalFee
    });
  } catch (error) {
    console.error('计算物流费用失败:', error);
    res.status(500).json({ message: '计算物流费用失败' });
  }
};

// 处理物流异常
export const handleLogisticsException = async (req: AuthRequest, res: Response) => {
  try {
    const { logisticsId, type, description, solution } = req.body;

    const logistics = await prisma.orderLogistics.findUnique({
      where: { id: logisticsId },
      include: {
        order: true
      }
    });

    if (!logistics) {
      return res.status(404).json({ message: '物流记录不存在' });
    }

    // 验证用户权限（只有商家可以处理异常）
    if (req.user?.role !== 'merchant') {
      return res.status(403).json({ message: '无权处理物流异常' });
    }

    // 创建异常跟踪记录
    await prisma.trackingRecord.create({
      data: {
        logisticsId,
        location: logistics.currentLocation || '未知',
        status: 'exception',
        description: `异常类型：${type}\n异常描述：${description}\n解决方案：${solution}`
      }
    });

    // 创建异常通知
    await prisma.logisticsNotification.create({
      data: {
        logisticsId,
        userId: logistics.order.userId,
        type: 'exception',
        message: `物流异常：${type} - ${description}`
      }
    });

    // 更新物流状态
    await prisma.orderLogistics.update({
      where: { id: logisticsId },
      data: {
        status: 'failed'
      }
    });

    res.json({ message: '物流异常处理成功' });
  } catch (error) {
    console.error('处理物流异常失败:', error);
    res.status(500).json({ message: '处理物流异常失败' });
  }
};

// 获取物流通知
export const getLogisticsNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.logisticsNotification.findMany({
      where: {
        userId: req.user?.id,
        isRead: false
      },
      include: {
        logistics: {
          include: {
            order: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(notifications);
  } catch (error) {
    console.error('获取物流通知失败:', error);
    res.status(500).json({ message: '获取物流通知失败' });
  }
};

// 标记通知为已读
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { notificationId } = req.params;

    const notification = await prisma.logisticsNotification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({ message: '通知不存在' });
    }

    // 验证用户权限（只能标记自己的通知为已读）
    if (notification.userId !== req.user?.id) {
      return res.status(403).json({ message: '无权操作此通知' });
    }

    await prisma.logisticsNotification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    res.json({ message: '通知已标记为已读' });
  } catch (error) {
    console.error('标记通知为已读失败:', error);
    res.status(500).json({ message: '标记通知为已读失败' });
  }
}; 