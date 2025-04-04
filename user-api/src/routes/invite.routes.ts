import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  generateInviteCodeController,
  registerWithInviteCodeController,
  getMyInvitesController,
  getMyCommissionsController
} from '../controllers/invite.controller';

const router = Router();

// 生成邀请码
router.post('/generate', authenticate, generateInviteCodeController);

// 使用邀请码注册
router.post('/register', registerWithInviteCodeController);

// 获取我的邀请列表
router.get('/my-invites', authenticate, getMyInvitesController);

// 获取我的佣金列表
router.get('/my-commissions', authenticate, getMyCommissionsController);

export default router; 