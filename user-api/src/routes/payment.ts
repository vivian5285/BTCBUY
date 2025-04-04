import express from 'express';
import { authenticate } from '../middleware/auth';
import { createUSDTInvoice, verifyPayment } from '../controllers/cryptoPaymentController';

const router = express.Router();

// 创建USDT支付订单
router.post('/create-usdt-invoice', authenticate, createUSDTInvoice);

// 验证支付状态
router.get('/verify/:orderId', authenticate, verifyPayment);

export default router; 