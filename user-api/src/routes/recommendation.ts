import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  recommendProducts,
  recommendPopularProducts,
  recommendSimilarProducts,
  recordProductView
} from '../controllers/recommendationController';

const router = express.Router();

// 基于用户行为的推荐
router.get('/user/:userId', authenticate, recommendProducts);

// 基于商品热度的推荐
router.get('/popular', recommendPopularProducts);

// 获取相似商品推荐
router.get('/similar/:productId', recommendSimilarProducts);

// 记录商品浏览
router.post('/view', authenticate, recordProductView);

export default router; 