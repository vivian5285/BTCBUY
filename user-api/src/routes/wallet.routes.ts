import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { setWalletsController } from '../controllers/wallet.controller';

const router = Router();

// 设置多链钱包地址
router.post('/wallets', authenticate, setWalletsController);

export default router; 