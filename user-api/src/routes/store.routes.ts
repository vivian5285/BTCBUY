import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createStoreController,
  getMyStoreController,
  updateStoreController,
  getStoreOrdersController
} from '../controllers/store.controller';

const router = Router();

// 创建店铺
router.post('/', authenticate, createStoreController);

// 获取我的店铺信息
router.get('/my', authenticate, getMyStoreController);

// 更新店铺信息
router.put('/my', authenticate, updateStoreController);

// 获取店铺订单列表
router.get('/orders', authenticate, getStoreOrdersController);

export default router; 