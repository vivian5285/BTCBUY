import express from 'express';
import { authenticate } from '../middleware/auth';
import { addComment, getComments } from '../controllers/commentController';

const router = express.Router();

// 添加评论
router.post('/:videoId', authenticate, addComment);

// 获取评论列表
router.get('/:videoId', getComments);

export default router; 