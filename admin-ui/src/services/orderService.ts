import { Order, OrderListResponse, UpdateOrderStatusInput } from '../types/order';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const orderService = {
  // 获取订单列表
  async getOrders(page: number = 1, pageSize: number = 10, status?: string): Promise<OrderListResponse> {
    const response = await fetch(
      `${API_URL}/orders?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ''}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    if (!response.ok) {
      throw new Error('获取订单列表失败');
    }
    return response.json();
  },

  // 获取订单详情
  async getOrder(id: string): Promise<Order> {
    const response = await fetch(`${API_URL}/orders/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('获取订单详情失败');
    }
    return response.json();
  },

  // 更新订单状态
  async updateOrderStatus(id: string, data: UpdateOrderStatusInput): Promise<Order> {
    const response = await fetch(`${API_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error('更新订单状态失败');
    }
    return response.json();
  },

  // 获取订单统计数据
  async getOrderStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
  }> {
    const response = await fetch(`${API_URL}/orders/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('获取订单统计数据失败');
    }
    return response.json();
  }
}; 