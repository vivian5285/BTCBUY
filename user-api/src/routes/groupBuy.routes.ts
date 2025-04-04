import { Router } from 'express';
import {
  createGroupBuy,
  joinGroupBuy,
  getMyGroupBuys,
  getGroupBuyDetail,
} from '../controllers/groupBuy.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 发起拼团
router.post('/', authenticateToken, createGroupBuy);

// 加入拼团
router.post('/:groupId/join', authenticateToken, joinGroupBuy);

// 获取我的拼团列表
router.get('/my', authenticateToken, getMyGroupBuys);

// 获取拼团详情
router.get('/:id', authenticateToken, getGroupBuyDetail);

export default router; 