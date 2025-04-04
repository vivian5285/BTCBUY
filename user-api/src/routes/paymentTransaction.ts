import express from 'express';
import { authenticate } from '../middleware/auth';
import { 
  createPaymentTransaction, 
  updatePaymentStatus, 
  getPaymentTransactions 
} from '../controllers/paymentTransactionController';

const router = express.Router();

// 创建支付记录
router.post('/create', authenticate, createPaymentTransaction);

// 更新支付状态
router.post('/update-status', authenticate, updatePaymentStatus);

// 获取支付记录
router.get('/transactions', authenticate, getPaymentTransactions);

export default router; 