import express from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import commissionRoutes from './commission.routes';
import withdrawalRoutes from './withdrawal.routes';
import notificationRoutes from './notification.routes';
import merchantRoutes from './merchant.routes';
import groupRoutes from './group.routes';
import videoRoutes from './video.routes';
import paymentRoutes from './payment.routes';
import walletRoutes from './wallet.routes';
import inviteRoutes from './invite.routes';
import couponRoutes from './coupon.routes';

const router = express.Router();

// 认证相关路由
router.use('/auth', authRoutes);

// 商品相关路由
router.use('/products', productRoutes);

// 订单相关路由
router.use('/orders', orderRoutes);

// 分佣相关路由
router.use('/commissions', commissionRoutes);

// 提现相关路由
router.use('/withdrawals', withdrawalRoutes);

// 通知相关路由
router.use('/notifications', notificationRoutes);

// 商家相关路由
router.use('/merchants', merchantRoutes);

// 团购相关路由
router.use('/groups', groupRoutes);

// 视频相关路由
router.use('/videos', videoRoutes);

// 支付相关路由
router.use('/payments', paymentRoutes);

// 钱包相关路由
router.use('/wallet', walletRoutes);

// 邀请相关路由
router.use('/invites', inviteRoutes);

// 优惠券相关路由
router.use('/', couponRoutes);

export default router; 