export interface User {
  id: string;
  email: string;
  walletAddress?: string;
  role: 'user' | 'merchant' | 'admin';
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UpdateUserInput {
  role?: 'user' | 'merchant' | 'admin';
  status?: 'active' | 'inactive' | 'banned';
} 