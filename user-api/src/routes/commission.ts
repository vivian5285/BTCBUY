import express from 'express';
import { authenticate } from '../middleware/auth';
import { getMyCommissions, getOrderCommission, confirmCommissionPayment } from '../controllers/commissionController';

const router = express.Router();

// 获取我的佣金列表
router.get('/my', authenticate, getMyCommissions);

// 获取订单佣金信息
router.get('/order/:orderId', authenticate, getOrderCommission);

// 确认佣金支付
router.post('/:commissionId/confirm', authenticate, confirmCommissionPayment);

export default router; 