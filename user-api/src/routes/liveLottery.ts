import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createLottery,
  joinLottery,
  drawLottery,
  getLotteryResults,
} from '../controllers/liveLotteryController';

const router = express.Router();

// 创建抽奖
router.post('/create', authenticate, createLottery);

// 参与抽奖
router.post('/join/:lotteryId', authenticate, joinLottery);

// 开奖
router.post('/draw/:lotteryId', authenticate, drawLottery);

// 获取抽奖结果
router.get('/results/:lotteryId', getLotteryResults);

export default router; 