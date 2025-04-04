import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createLogistics,
  updateLogisticsStatus,
  getLogistics,
  getShippingCompanies,
  addTrackingRecord,
  calculateShippingFee,
  handleLogisticsException,
  getTrackingRecords,
  getLogisticsNotifications,
  markNotificationAsRead
} from '../controllers/logisticsController';

const router = express.Router();

// 创建物流记录（仅商家）
router.post('/create', authenticate, createLogistics);

// 更新物流状态（仅商家）
router.post('/update-status', authenticate, updateLogisticsStatus);

// 获取物流信息（订单用户或商家）
router.get('/:orderId', authenticate, getLogistics);

// 获取物流公司列表（所有用户）
router.get('/companies', getShippingCompanies);

// 新增路由
router.post('/tracking-record', authenticate, addTrackingRecord);
router.post('/calculate-fee', authenticate, calculateShippingFee);
router.post('/exception', authenticate, handleLogisticsException);
router.get('/tracking-records/:logisticsId', authenticate, getTrackingRecords);
router.get('/notifications', authenticate, getLogisticsNotifications);
router.put('/notifications/:notificationId/read', authenticate, markNotificationAsRead);

export default router; 