import express from 'express';
import { authenticate } from '../middleware/auth';
import { uploadVideo, getMyVideos, updateVideoStatus, getVideos } from '../controllers/videoController';

const router = express.Router();

// 获取视频列表
router.get('/', getVideos);

// 上传视频
router.post('/upload', authenticate, uploadVideo);

// 获取我的视频列表
router.get('/my', authenticate, getMyVideos);

// 获取待审核视频列表
router.get('/pending', authenticate, getVideos);

// 更新视频状态（审核）
router.put('/:id/status', authenticate, updateVideoStatus);

export default router; 