import { Router } from 'express';
import merchantRouter from './merchant';
import withdrawalRouter from './withdrawal';
import commissionRouter from './commission';
import notificationRouter from './notification';

const router = Router();

router.use('/merchants', merchantRouter);
router.use('/withdrawals', withdrawalRouter);
router.use('/commission', commissionRouter);
router.use('/notifications', notificationRouter);

export default router; 