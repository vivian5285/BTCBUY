import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createFlashSale,
  getFlashSales,
  updateFlashSaleStatus,
} from '../controllers/flashSaleController';

const router = express.Router();

// 创建秒杀活动
router.post('/create', authenticate, createFlashSale);

// 获取秒杀活动列表
router.get('/:liveId', getFlashSales);

// 更新秒杀活动状态
router.put('/:flashSaleId/status', authenticate, updateFlashSaleStatus);

export default router; 