import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getMyDeposits, getDepositDetail } from '../controllers/depositController';

const router = Router();

// 获取用户的充值记录列表
router.get('/my', authenticate, getMyDeposits);

// 获取单条充值记录详情
router.get('/:id', authenticate, getDepositDetail);

export default router; 