import express from 'express';
import { createOrder, getMyOrders, getStoreOrders, markOrderShipped, confirmPayment, completeOrder, getOrderSettlement } from '../controllers/orderController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 创建订单
router.post('/', authenticate, createOrder);

// 获取我的订单列表
router.get('/me', authenticate, getMyOrders);

// 获取店铺订单列表
router.get('/store', authenticate, getStoreOrders);

// 标记订单为已发货
router.patch('/:orderId/ship', authenticate, markOrderShipped);

// 确认支付
router.post('/confirm-payment', authenticate, confirmPayment);

// 完成订单（用户确认收货）
router.patch('/:orderId/complete', authenticate, completeOrder);

// 获取订单结算状态
router.get('/:orderId/settlement', authenticate, getOrderSettlement);

export default router; 