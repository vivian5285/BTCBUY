export interface Group {
  id: string;
  userId: string;
  productId: string;
  groupSize: number;
  price: number;
  status: 'pending' | 'success' | 'failed';
  shareCode: string;
  expiresAt: Date;
  isHandled: boolean;
  members: GroupParticipant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupParticipant {
  id: string;
  groupId: string;
  userId: string;
  joinedAt: Date;
}

export interface CreateGroupParams {
  userId: string;
  productId: string;
  groupSize: number;
  price: number;
  expiresInMinutes?: number;
} 