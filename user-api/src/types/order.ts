import { Document } from 'mongoose';

export interface IOrder extends Document {
  _id: string;
  user: string;
  merchant: string;
  products: Array<{
    product: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  createdAt: Date;
  updatedAt: Date;
} 