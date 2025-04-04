import axios from 'axios';
import { AnalyticsResponse } from '../types/analytics';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const analyticsService = {
  // 获取销售数据
  async getSalesData(startDate?: string, endDate?: string): Promise<AnalyticsResponse> {
    const response = await axios.get(`${API_URL}/analytics/sales`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // 获取产品分析数据
  async getProductAnalytics(): Promise<AnalyticsResponse> {
    const response = await axios.get(`${API_URL}/analytics/products`);
    return response.data;
  },

  // 获取用户行为数据
  async getUserBehavior(): Promise<AnalyticsResponse> {
    const response = await axios.get(`${API_URL}/analytics/users`);
    return response.data;
  },

  // 获取综合数据分析
  async getAnalyticsSummary(): Promise<AnalyticsResponse> {
    const response = await axios.get(`${API_URL}/analytics/summary`);
    return response.data;
  }
}; 