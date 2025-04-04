import express from 'express';
import { authenticate } from '../middleware/auth';
import { getLiveData, getLiveAnalytics } from '../controllers/liveDataController';

const router = express.Router();

// 获取单个直播的详细数据
router.get('/:liveId', authenticate, getLiveData);

// 获取商家的所有直播分析数据
router.get('/', authenticate, getLiveAnalytics);

export default router; 