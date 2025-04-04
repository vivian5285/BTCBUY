export interface Order {
  id: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    walletAddress?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentTime?: string;
  txHash?: string;
  shippingAddress?: string;
  commission?: number;
  invitedById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  productName: string;
  productImage: string;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'wallet' | 'credit_card' | 'alipay' | 'wechat';

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
} 