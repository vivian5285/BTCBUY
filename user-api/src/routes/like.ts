import express from 'express';
import { authenticate } from '../middleware/auth';
import { toggleLike, getVideoLikes } from '../controllers/likeController';

const router = express.Router();

// 点赞/取消点赞
router.post('/:videoId', authenticate, toggleLike);

// 获取视频点赞数
router.get('/:videoId', getVideoLikes);

export default router; 