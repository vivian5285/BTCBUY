import axios from 'axios';
import { Withdrawal, WithdrawalResponse, WithdrawalSettings } from '../types/withdrawal';
import { ReferralResponse, ReferralStats, CommissionRule } from '../types/referral';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface CommissionFilters {
  page?: number;
  limit?: number;
  dateRange?: [Date, Date] | null;
  type?: string;
  userId?: string;
}

// 获取所有分佣记录
export const getAllReferralCommissions = async (filters: CommissionFilters): Promise<ApiResponse<ReferralResponse>> => {
  const response = await axios.get<ApiResponse<ReferralResponse>>(`${API_URL}/referral/commissions`, {
    params: filters
  });
  return response.data;
};

// 获取分佣统计数据
export const getReferralStats = async (): Promise<ApiResponse<ReferralStats>> => {
  const response = await axios.get<ApiResponse<ReferralStats>>(`${API_URL}/referral/stats`);
  return response.data;
};

// 手动触发佣金结算
export const triggerCommissionSettlement = async (commissionId: string): Promise<ApiResponse<void>> => {
  const response = await axios.post<ApiResponse<void>>(`${API_URL}/referral/settle/${commissionId}`);
  return response.data;
};

export const getAllWithdrawals = async (params: { page: number; limit: number }): Promise<WithdrawalResponse> => {
  const response = await axios.get<ApiResponse<WithdrawalResponse>>(`${API_URL}/admin/withdrawals`, { params });
  return response.data.data;
};

export const processWithdrawal = async (id: string, status: 'completed' | 'rejected', reason?: string): Promise<void> => {
  await axios.post<ApiResponse<void>>(`${API_URL}/admin/withdrawals/${id}/process`, { status, reason });
};

// 通知管理接口
export const getAllNotifications = async (params: { page: number; limit: number }): Promise<ApiResponse<any>> => {
  const response = await axios.get<ApiResponse<any>>(`${API_URL}/notifications`, { params });
  return response.data;
};

export const deleteNotification = async (id: string): Promise<ApiResponse<void>> => {
  const response = await axios.delete<ApiResponse<void>>(`${API_URL}/notifications/${id}`);
  return response.data;
};

export const deleteNotifications = async (ids: string[]): Promise<ApiResponse<void>> => {
  const response = await axios.delete<ApiResponse<void>>(`${API_URL}/notifications`, { 
    data: { ids } 
  });
  return response.data;
};

// 商户管理接口
export const getMerchants = async (params: { page: number; limit: number }): Promise<ApiResponse<any>> => {
  const response = await axios.get<ApiResponse<any>>(`${API_URL}/merchants`, { params });
  return response.data;
};

export const approveMerchant = async (id: string): Promise<ApiResponse<void>> => {
  const response = await axios.put<ApiResponse<void>>(`${API_URL}/merchants/${id}/approve`);
  return response.data;
};

export const rejectMerchant = async (id: string, reason: string): Promise<ApiResponse<void>> => {
  const response = await axios.put<ApiResponse<void>>(`${API_URL}/merchants/${id}/reject`, { reason });
  return response.data;
};

export const exportMerchantData = async (): Promise<Blob> => {
  const response = await axios.get<Blob>(`${API_URL}/merchants/export`, {
    responseType: 'blob',
  });
  return response.data;
};

// 提现管理接口
export const getWithdrawals = async (params: { page: number; limit: number }): Promise<ApiResponse<any>> => {
  const response = await axios.get<ApiResponse<any>>(`${API_URL}/withdrawals`, { params });
  return response.data;
};

export const setWithdrawalFee = async (fee: number): Promise<void> => {
  await axios.post<ApiResponse<void>>(`${API_URL}/admin/withdrawals/settings/fee`, { fee });
};

export const setWithdrawalLimit = async (min: number, max: number): Promise<void> => {
  await axios.post<ApiResponse<void>>(`${API_URL}/admin/withdrawals/settings/limit`, { min, max });
};

export const getWithdrawalSettings = async (): Promise<WithdrawalSettings> => {
  const response = await axios.get<ApiResponse<WithdrawalSettings>>(`${API_URL}/admin/withdrawals/settings`);
  return response.data.data;
};

// 佣金管理接口
export const getCommissionRules = async (): Promise<ApiResponse<CommissionRule[]>> => {
  const response = await axios.get<ApiResponse<CommissionRule[]>>(`${API_URL}/commission/rules`);
  return response.data;
};

export const setCommissionRate = async (rate: number): Promise<ApiResponse<void>> => {
  const response = await axios.put<ApiResponse<void>>(`${API_URL}/commission/rate`, { rate });
  return response.data;
};

export const addCommissionRule = async (rule: {
  level: number;
  rate: number;
  description: string;
}): Promise<ApiResponse<CommissionRule>> => {
  const response = await axios.post<ApiResponse<CommissionRule>>(`${API_URL}/commission/rules`, rule);
  return response.data;
};

export const updateCommissionRule = async (id: string, rule: {
  level: number;
  rate: number;
  description: string;
}): Promise<ApiResponse<CommissionRule>> => {
  const response = await axios.put<ApiResponse<CommissionRule>>(`${API_URL}/commission/rules/${id}`, rule);
  return response.data;
};

export const deleteCommissionRule = async (id: string): Promise<ApiResponse<void>> => {
  const response = await axios.delete<ApiResponse<void>>(`${API_URL}/commission/rules/${id}`);
  return response.data;
}; 