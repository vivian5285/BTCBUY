import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { bindWallet, getDeposits, getWallets } from '../controllers/deposit.controller';

const router = Router();

// 绑定钱包地址
router.post('/wallet', authenticate, bindWallet);

// 获取用户的钱包地址列表
router.get('/wallets', authenticate, getWallets);

// 获取充值记录
router.get('/deposits', authenticate, getDeposits);

export default router; 