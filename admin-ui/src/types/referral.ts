export interface ReferralCommission {
  id: string;
  fromUserId: string;
  toUserId: string;
  orderId: string;
  level: number;
  amount: number;
  type: 'user_order' | 'merchant_order' | 'creator_order';
  createdAt: string;
  status: 'pending' | 'completed' | 'rejected';
}

export interface ReferralStats {
  totalCommission: number;
  monthlyCommission: number;
  totalOrders: number;
  monthlyOrders: number;
  averageCommission: number;
}

export interface ReferralResponse {
  items: ReferralCommission[];
  total: number;
}

export interface CommissionRule {
  id: string;
  level: number;
  rate: number;
  description: string;
  createdAt: string;
  updatedAt: string;
} 