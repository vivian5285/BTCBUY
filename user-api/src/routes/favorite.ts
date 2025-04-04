import express from 'express';
import { authenticate } from '../middleware/auth';
import { toggleFavorite, getMyFavorites } from '../controllers/favoriteController';

const router = express.Router();

// 收藏/取消收藏
router.post('/:videoId', authenticate, toggleFavorite);

// 获取我的收藏列表
router.get('/my', authenticate, getMyFavorites);

export default router; 