import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { securityMiddleware, xssProtection, sqlInjectionProtection, requestSizeLimit } from './middleware/security';
import { verifyToken, checkRole, loginRateLimit, validateSession, validateDeviceFingerprint, validateSensitiveOperation } from './middleware/auth';
import { apiLimiter, loginLimiter, withdrawalLimiter, captchaLimiter, contentCreationLimiter, commentLimiter, uploadLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { ScheduledTaskService } from './services/scheduledTaskService';
import { SecurityConfigService } from './services/securityConfigService';
import adminRouter from './routes/admin';
import userRouter from './routes/user';
import merchantRouter from './routes/merchant';
import creatorRouter from './routes/creator';
import notificationRouter from './routes/notification';
import withdrawalRouter from './routes/withdrawal';
import referralRouter from './routes/referral';
import { WebSocketService } from './services/websocketService';
import { startCouponJobs } from './jobs/couponJobs';

const app = express();
const httpServer = createServer(app);

// 初始化WebSocket服务
WebSocketService.initialize(httpServer);

// 基础中间件
app.use(helmet()); // 安全头
app.use(cors()); // 跨域
app.use(compression()); // 压缩
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析
app.use(morgan('combined')); // 日志

// 应用安全中间件
app.use(securityMiddleware);
app.use(xssProtection);
app.use(sqlInjectionProtection);
app.use(requestSizeLimit);

// 应用速率限制
app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/withdrawal', withdrawalLimiter);
app.use('/api/captcha', captchaLimiter);
app.use('/api/content', contentCreationLimiter);
app.use('/api/comments', commentLimiter);
app.use('/api/upload', uploadLimiter);

// 应用认证中间件
app.use('/api/protected', verifyToken);
app.use('/api/protected', validateSession);
app.use('/api/protected', validateDeviceFingerprint);
app.use('/api/protected', validateSensitiveOperation);

// 应用角色验证中间件
app.use('/api/admin', checkRole(['ADMIN']));

// 启动定时任务
ScheduledTaskService.startScheduledTasks();

// 启动优惠券定时任务
startCouponJobs();

// 初始化安全配置
SecurityConfigService.getSecurityConfig().then(config => {
  console.log('安全配置已加载:', config);
}).catch(error => {
  console.error('加载安全配置失败:', error);
});

// 路由
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/merchant', merchantRouter);
app.use('/api/creator', creatorRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/withdrawals', withdrawalRouter);
app.use('/api/referral', referralRouter);

// 错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，准备关闭服务器...');
  app.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

export { app, httpServer }; 