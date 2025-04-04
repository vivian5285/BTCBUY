import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserBehavior,
  getProductAnalytics,
  getPopularProducts,
  updateProductAnalytics,
  updateUserPreference
} from '../controllers/analyticsController';

const router = express.Router();

// 获取用户行为分析数据
router.get('/user/:userId', authenticate, getUserBehavior);

// 获取商品热度分析数据
router.get('/product/:productId', authenticate, getProductAnalytics);

// 获取热门商品排行
router.get('/popular', getPopularProducts);

// 更新商品分析数据
router.put('/product/:productId', authenticate, updateProductAnalytics);

// 更新用户偏好
router.put('/user/:userId/preference', authenticate, updateUserPreference);

export default router; 