import express from 'express';
import { authenticate } from '../middleware/auth';
import { startGroup, joinGroup, myGroups } from '../controllers/groupController';

const router = express.Router();

// 发起拼团
router.post('/start', authenticate, startGroup);

// 加入拼团
router.post('/join/:id', authenticate, joinGroup);

// 获取我的拼团列表
router.get('/my', authenticate, myGroups);

export default router; 