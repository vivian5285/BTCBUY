import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getMerchantStats, getTopProducts, getNewOrders } from '../controllers/merchant';

const router = Router();

// 获取销售统计
router.get('/stats', authenticate, getMerchantStats);

// 获取热销商品排行榜
router.get('/top-products', authenticate, getTopProducts);

// 获取新订单
router.get('/orders', authenticate, getNewOrders);

export default router; 