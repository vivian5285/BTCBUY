import express, { Response, Request } from 'express';
import { auth } from '../middleware/auth';
import { Coupon, User, Order, CouponUsage, Notification } from '../models';
import { cacheService } from '../services/cache';
import { getCouponStatistics } from '../services/couponService';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

// 扩展Request类型以包含user属性
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 获取用户优惠券列表
router.get('/user/coupons', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const userId = req.user.id;
    const cacheKey = `user:${userId}:coupons`;
    
    // 尝试从缓存获取
    const cachedCoupons = await cacheService.get(cacheKey);
    if (cachedCoupons) {
      return res.json(cachedCoupons);
    }

    // 从数据库获取
    const coupons = await Coupon.find({ user: userId })
      .populate('merchant', 'username')
      .populate('product', 'name')
      .sort({ createdAt: -1 });

    // 更新缓存
    await cacheService.set(cacheKey, coupons, 300); // 缓存5分钟

    res.json(coupons);
  } catch (error) {
    console.error('获取优惠券列表失败:', error);
    res.status(500).json({ message: '获取优惠券列表失败' });
  }
});

// 管理员发放优惠券
router.post('/admin/coupon/send', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    // 检查权限
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限操作' });
    }

    const { userId, amount, validFrom, validTo, reason, type, productId } = req.body;

    const coupon = await Coupon.create({
      user: userId,
      amount,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      reason,
      product: type === 'product' ? productId : undefined
    });

    // 清除用户优惠券缓存
    await cacheService.del(`user:${userId}:coupons`);

    res.json(coupon);
  } catch (error) {
    console.error('发放优惠券失败:', error);
    res.status(500).json({ message: '发放优惠券失败' });
  }
});

// 商家预览优惠券发放
router.post('/merchant/coupon/preview', auth, async (req, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    // 检查权限
    if (req.user.role !== 'merchant') {
      return res.status(403).json({ message: '无权限操作' });
    }

    const { targetType, productId } = req.body;
    let users: any[] = [];

    if (targetType === 'followers') {
      // 获取关注者列表
      users = await User.find({ 
        followers: req.user.id 
      }).select('id username');
    } else if (targetType === 'customers') {
      // 获取下单用户列表
      const orders = await Order.find({ 
        'products.product': productId,
        status: 'completed'
      }).distinct('user');
      
      users = await User.find({ 
        _id: { $in: orders }
      }).select('id username');
    }

    res.json({
      targetType,
      totalUsers: users.length,
      users: users.map(user => ({
        userId: user.id,
        username: user.username
      }))
    });
  } catch (error) {
    console.error('预览优惠券发放失败:', error);
    res.status(500).json({ message: '预览优惠券发放失败' });
  }
});

// 商家批量发放优惠券
router.post('/merchant/coupon/send-batch', auth, async (req, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    // 检查权限
    if (req.user.role !== 'merchant') {
      return res.status(403).json({ message: '无权限操作' });
    }

    const { amount, validFrom, validTo, targetType, productId, reason } = req.body;
    let users: any[] = [];

    if (targetType === 'followers') {
      users = await User.find({ followers: req.user.id }).select('id');
    } else if (targetType === 'customers') {
      const orders = await Order.find({ 
        'products.product': productId,
        status: 'completed'
      }).distinct('user');
      users = await User.find({ _id: { $in: orders } }).select('id');
    }

    // 批量创建优惠券
    const coupons = await Coupon.insertMany(
      users.map(user => ({
        user: user.id,
        merchant: req.user.id,
        amount,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        product: productId,
        reason
      }))
    );

    // 清除相关用户的优惠券缓存
    await Promise.all(
      users.map(user => 
        cacheService.del(`user:${user.id}:coupons`)
      )
    );

    res.json({
      success: true,
      count: coupons.length
    });
  } catch (error) {
    console.error('批量发放优惠券失败:', error);
    res.status(500).json({ message: '批量发放优惠券失败' });
  }
});

// 获取优惠券统计信息
router.get('/statistics', auth, async (req, res) => {
  try {
    const merchantId = req.user.role === 'merchant' ? req.user.id : undefined;
    const stats = await getCouponStatistics(merchantId);
    res.json(stats);
  } catch (error) {
    console.error('获取优惠券统计失败:', error);
    res.status(500).json({ message: '获取优惠券统计失败' });
  }
});

// 获取优惠券使用记录
router.get('/usage', auth, async (req, res) => {
  try {
    const { startDate, endDate, page = 1, pageSize = 10 } = req.query;
    const merchantId = req.user.role === 'merchant' ? req.user.id : undefined;

    const query: any = {};
    if (merchantId) {
      query.merchant = merchantId;
    }
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const total = await CouponUsage.countDocuments(query);
    const records = await CouponUsage.find(query)
      .populate('coupon', 'amount validTo')
      .populate('order', 'totalAmount')
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(pageSize))
      .limit(Number(pageSize));

    res.json({
      records,
      pagination: {
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('获取优惠券使用记录失败:', error);
    res.status(500).json({ message: '获取优惠券使用记录失败' });
  }
});

// 批量导入优惠券
router.post('/import', auth, upload.single('file'), async (req, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    if (req.user.role !== 'merchant' && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权限操作' });
    }

    if (!req.file) {
      return res.status(400).json({ message: '请上传文件' });
    }

    const results: any[] = [];
    const errors: any[] = [];
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv())
        .on('data', (data) => {
          try {
            // 验证必要字段
            if (!data.userId || !data.amount || !data.validTo) {
              errors.push({ row: results.length + 1, error: '缺少必要字段' });
              return;
            }

            // 验证金额格式
            const amount = parseFloat(data.amount);
            if (isNaN(amount) || amount <= 0) {
              errors.push({ row: results.length + 1, error: '无效的金额' });
              return;
            }

            // 验证日期格式
            const validTo = new Date(data.validTo);
            if (isNaN(validTo.getTime())) {
              errors.push({ row: results.length + 1, error: '无效的过期日期' });
              return;
            }

            results.push({
              userId: data.userId,
              amount,
              validTo,
              reason: data.reason || '批量导入',
              productId: data.productId,
              merchant: req.user.id
            });
          } catch (error) {
            errors.push({ row: results.length + 1, error: '数据格式错误' });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (errors.length > 0) {
      return res.status(400).json({
        message: '导入过程中发现错误',
        errors,
        successCount: results.length
      });
    }

    // 批量创建优惠券
    const coupons = await Coupon.insertMany(results);

    // 清除相关用户的优惠券缓存
    const userIds = [...new Set(results.map(r => r.userId))];
    await Promise.all(
      userIds.map(userId => 
        cacheService.del(`user:${userId}:coupons`)
      )
    );

    res.json({
      message: '批量导入成功',
      count: coupons.length
    });
  } catch (error) {
    console.error('批量导入优惠券失败:', error);
    res.status(500).json({ message: '批量导入优惠券失败' });
  }
});

// 获取优惠券活动列表
router.get('/events', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // 获取所有有效的活动优惠券
    const coupons = await Coupon.find({
      status: 'active',
      validFrom: { $lte: new Date() },
      validTo: { $gt: new Date() },
      isPublic: true // 公开活动优惠券
    })
    .populate('merchant', 'username')
    .populate('product', 'name')
    .sort({ createdAt: -1 });

    // 检查用户是否已领取
    const userCoupons = userId ? await Coupon.find({
      user: userId,
      status: 'active',
      validTo: { $gt: new Date() }
    }).select('_id') : [];

    const userCouponIds = new Set(userCoupons.map(c => c._id.toString()));

    // 添加是否已领取标记
    const couponsWithReceived = coupons.map(coupon => ({
      ...coupon.toObject(),
      isReceived: userCouponIds.has(coupon._id.toString())
    }));

    res.json(couponsWithReceived);
  } catch (error) {
    console.error('获取优惠券活动失败:', error);
    res.status(500).json({ message: '获取优惠券活动失败' });
  }
});

// 领取优惠券
router.post('/receive/:id', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const couponId = req.params.id;
    const userId = req.user.id;

    // 检查优惠券是否存在且有效
    const coupon = await Coupon.findOne({
      _id: couponId,
      status: 'active',
      validFrom: { $lte: new Date() },
      validTo: { $gt: new Date() },
      isPublic: true
    });

    if (!coupon) {
      return res.status(404).json({ message: '优惠券不存在或已过期' });
    }

    // 检查用户是否已领取
    const existingCoupon = await Coupon.findOne({
      user: userId,
      originalCoupon: couponId,
      status: 'active'
    });

    if (existingCoupon) {
      return res.status(400).json({ message: '您已领取过此优惠券' });
    }

    // 创建用户优惠券
    const userCoupon = await Coupon.create({
      user: userId,
      merchant: coupon.merchant,
      amount: coupon.amount,
      validFrom: coupon.validFrom,
      validTo: coupon.validTo,
      reason: coupon.reason,
      product: coupon.product,
      originalCoupon: couponId,
      status: 'active'
    });

    // 清除用户优惠券缓存
    await cacheService.del(`user:${userId}:coupons`);

    // 创建通知
    await Notification.create({
      user: userId,
      type: 'coupon',
      title: '优惠券领取成功',
      content: `您已成功领取${coupon.amount}元优惠券`,
      data: { couponId: userCoupon._id }
    });

    res.json(userCoupon);
  } catch (error) {
    console.error('领取优惠券失败:', error);
    res.status(500).json({ message: '领取优惠券失败' });
  }
});

export default router; 