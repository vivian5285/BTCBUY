import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { setMultiChainWallets, getWallets } from '../controllers/walletController';

const router = Router();

// 一次性绑定多个链的钱包地址
router.post('/multi', authenticate, setMultiChainWallets);

// 获取用户的钱包地址列表
router.get('/', authenticate, getWallets);

export default router; 