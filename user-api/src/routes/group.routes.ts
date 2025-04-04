import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  startGroupBuyController,
  joinGroupBuyController,
  getMyGroupBuysController
} from '../controllers/group.controller';

const router = Router();

// 发起拼团
router.post('/start', authenticate, startGroupBuyController);

// 加入拼团
router.post('/join/:id', authenticate, joinGroupBuyController);

// 获取我的拼团列表
router.get('/my', authenticate, getMyGroupBuysController);

export default router; 