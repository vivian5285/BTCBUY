export interface Merchant {
  id: string;
  name: string;
  contact: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface MerchantResponse {
  items: Merchant[];
  total: number;
} 