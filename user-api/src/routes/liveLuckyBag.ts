import express from 'express';
import { authenticate } from '../middleware/auth';
import { createLuckyBag, joinLuckyBag } from '../controllers/liveLuckyBagController';

const router = express.Router();

// 创建福袋抽奖
router.post('/create', authenticate, createLuckyBag);

// 参与福袋抽奖
router.post('/join/:liveId', authenticate, joinLuckyBag);

export default router; 