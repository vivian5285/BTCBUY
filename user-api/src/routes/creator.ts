import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  applyCreator,
  getCreatorProfile,
  updateCreatorProfile,
  getCreatorContents,
  createContent,
  updateContent,
  deleteContent,
  getContentDetails,
  getCreatorCommissions
} from '../controllers/creator';

const router = Router();

// 申请成为带货者
router.post('/apply', authenticate, applyCreator);

// 获取带货者资料
router.get('/profile/:id', getCreatorProfile);
router.get('/my-profile', authenticate, getCreatorProfile);

// 更新带货者资料
router.put('/profile', authenticate, updateCreatorProfile);

// 内容管理
router.post('/contents', authenticate, createContent);
router.get('/contents', authenticate, getCreatorContents);
router.get('/contents/:id', getContentDetails);
router.put('/contents/:id', authenticate, updateContent);
router.delete('/contents/:id', authenticate, deleteContent);

// 佣金管理
router.get('/commissions', authenticate, getCreatorCommissions);

export default router; 