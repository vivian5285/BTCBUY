export interface Withdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string;
  user: {
    id: string;
  };
}

export interface WithdrawalResponse {
  items: Withdrawal[];
  total: number;
}

export interface WithdrawalSettings {
  fee: number;
  minAmount: number;
  maxAmount: number;
} 