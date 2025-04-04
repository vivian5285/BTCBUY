import mongoose from 'mongoose';

// 用户模型
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'merchant', 'admin'], default: 'user' },
  balance: { type: Number, default: 0 },
  walletAddress: { type: String },
  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 商品模型
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  images: [String],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 订单模型
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 分佣记录模型
const commissionSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  level: { type: Number, required: true }, // 1: 一级分佣, 2: 二级分佣
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 提现请求模型
const withdrawalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  walletAddress: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  adminNote: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 通知模型
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['order', 'commission', 'withdrawal', 'system'],
    required: true
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// 优惠券模型
const couponSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['active', 'used', 'expired', 'cancelled'],
    default: 'active'
  },
  reason: { type: String },
  validFrom: { type: Date, default: Date.now },
  validTo: { type: Date },
  isPublic: { type: Boolean, default: false },
  originalCoupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 优惠券使用记录模型
const couponUsageSchema = new mongoose.Schema({
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  originalAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// 创建索引
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ referralCode: 1 });
productSchema.index({ merchant: 1 });
productSchema.index({ category: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
commissionSchema.index({ user: 1 });
commissionSchema.index({ order: 1 });
withdrawalSchema.index({ user: 1 });
withdrawalSchema.index({ status: 1 });
notificationSchema.index({ user: 1 });
notificationSchema.index({ isRead: 1 });
couponSchema.index({ user: 1 });
couponSchema.index({ merchant: 1 });
couponSchema.index({ product: 1 });
couponSchema.index({ status: 1 });
couponSchema.index({ validTo: 1 });
couponUsageSchema.index({ coupon: 1 });
couponUsageSchema.index({ order: 1 });
couponUsageSchema.index({ user: 1 });
couponUsageSchema.index({ createdAt: 1 });

// 导出模型
export const User = mongoose.model('User', userSchema);
export const Product = mongoose.model('Product', productSchema);
export const Order = mongoose.model('Order', orderSchema);
export const Commission = mongoose.model('Commission', commissionSchema);
export const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
export const Coupon = mongoose.model('Coupon', couponSchema);
export const CouponUsage = mongoose.model('CouponUsage', couponUsageSchema); 