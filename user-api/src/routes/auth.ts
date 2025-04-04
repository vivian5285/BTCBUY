import express from 'express';
import { register, login } from '../controllers/authController';

const router = express.Router();

// 注册路由
router.post('/register', register);

// 登录路由
router.post('/login', login);

export default router; 